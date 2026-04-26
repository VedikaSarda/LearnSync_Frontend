import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, Clock, Briefcase, FileText, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { mentorApi } from '../../../utils/mentorApi';
import { useNotifications } from '../../../components/ui/NotificationSystem';
import { getCurrentUser, logoutUser } from '../../../utils/auth';
// Reusing the same styles from the main settings page
import '../../Settings/styles.css';

const MentorProfile = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const currentUser = getCurrentUser() || {};
  
  const [selectedSection, setSelectedSection] = useState('profile');
  const [profileData, setProfileData] = useState({
    bio: '',
    expertise: '',
    available_times: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    }
  });
  
  const [saveStatus, setSaveStatus] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleFieldChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
    setSaveStatus('');
  };

  const handleTimeChange = (day, value) => {
    setProfileData(prev => ({
      ...prev,
      available_times: {
        ...prev.available_times,
        [day]: value
      }
    }));
    setHasUnsavedChanges(true);
    setSaveStatus('');
  };

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    try {
      const cleanedTimes = {};
      Object.entries(profileData.available_times).forEach(([day, time]) => {
        if (time.trim()) cleanedTimes[day] = time;
      });

      const payload = {
        bio: profileData.bio,
        expertise: profileData.expertise,
        available_times: cleanedTimes
      };

      await mentorApi.updateProfile(payload);
      
      setSaveStatus('success');
      setHasUnsavedChanges(false);
      addNotification('Profile updated successfully!', 'success');
      
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
      addNotification('Failed to update profile.', 'error');
    }
  };

  const handleLogout = () => {
    const result = logoutUser();
    if (result.success) {
      navigate('/login');
    }
  };

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const settingsSections = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'account', name: 'Account', icon: SettingsIcon }
  ];

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Update your professional details, availability, and account.</p>
        </div>
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-nav">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`settings-nav-item ${selectedSection === section.id ? 'active' : ''}`}
                onClick={() => setSelectedSection(section.id)}
              >
                <Icon size={20} />
                <span>{section.name}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {selectedSection === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                <p>Manage your public mentor profile visible to students.</p>
              </div>

              {/* Read-only Account Info */}
              <div className="setting-group">
                <h3>Account Details</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Username</label>
                    <input
                      type="text"
                      value={currentUser.username || ''}
                      className="form-input"
                      disabled
                      style={{ backgroundColor: '#2d2d30', cursor: 'not-allowed', opacity: 0.8 }}
                    />
                    <div className="form-note">Your account username.</div>
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={currentUser.email || ''}
                      className="form-input"
                      disabled
                      style={{ backgroundColor: '#2d2d30', cursor: 'not-allowed', opacity: 0.8 }}
                    />
                    <div className="form-note">Your registered email.</div>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="setting-group">
                <h3>Professional Details</h3>
                <div className="form-grid">
                  <div className="form-field full-width">
                    <label className="flex items-center gap-2"><Briefcase size={16}/> Expertise / Tech Stack</label>
                    <input
                      type="text"
                      value={profileData.expertise}
                      onChange={(e) => handleFieldChange('expertise', e.target.value)}
                      className="form-input"
                      placeholder="e.g., JavaScript, React, Node.js, WebRTC"
                    />
                    <div className="form-note">Comma separated list of your key skills.</div>
                  </div>

                  <div className="form-field full-width">
                    <label className="flex items-center gap-2"><FileText size={16}/> Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleFieldChange('bio', e.target.value)}
                      className="form-textarea"
                      rows="4"
                      placeholder="Tell students about your experience and background..."
                    />
                    <div className="form-note">A short biography highlighting your career and mentoring style.</div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="setting-group">
                <h3><span className="flex items-center gap-2"><Clock size={18}/> Weekly Availability</span></h3>
                <p className="text-gray-400 text-sm mb-4">Set your available time slots for mentorship sessions (e.g., "10:00-12:00"). Leave blank if unavailable.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {daysOfWeek.map(day => (
                    <div key={day} className="form-field">
                      <label className="capitalize">{day}</label>
                      <input
                        type="text"
                        value={profileData.available_times[day]}
                        onChange={(e) => handleTimeChange(day, e.target.value)}
                        className="form-input"
                        placeholder="e.g., 14:00-16:00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="section-actions">
                {saveStatus && (
                  <div className={`save-status ${saveStatus}`}>
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'success' && '✓ Profile saved successfully!'}
                    {saveStatus === 'error' && 'Failed to save profile.'}
                  </div>
                )}
                {hasUnsavedChanges && !saveStatus && (
                  <div className="save-status" style={{ color: 'var(--teams-text-secondary)' }}>
                    You have unsaved changes
                  </div>
                )}
                <button
                  className="action-btn primary"
                  onClick={handleSaveProfile}
                  disabled={saveStatus === 'saving' || !hasUnsavedChanges}
                >
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {selectedSection === 'account' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Account Management</h2>
                <p>Manage your account settings and session</p>
              </div>

              <div className="setting-group">
                <h3>Session Management</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-title">Sign Out</div>
                    <div className="setting-description">
                      Sign out of your account and return to the login page
                    </div>
                  </div>
                  <div className="setting-control">
                    <button
                      className="action-btn danger logout-btn"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Account Information</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <div className="setting-title">Account Status</div>
                    <div className="setting-description">
                      Your account is active and in good standing
                    </div>
                  </div>
                  <div className="setting-control">
                    <span className="status-badge active">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
