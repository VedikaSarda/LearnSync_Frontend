import { User, Bell, Shield, Palette, Camera, Mail, Phone, Globe, Moon, Sun, Monitor, Volume2, VolumeX, Eye, Key, Download, Trash2, Save, FileText, HardDrive, LogOut, Settings as SettingsIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './styles.css'
import {
  loadUserModules,
  getStorageUsage,
  loadUserProfile,
  saveUserProfile,
  loadUserSettings,
  saveUserSettings,
  syncUserProfile,
  getUserDisplayInfo,
  updateProfileField,
  validateProfile,
  getAvailableStudyFields
} from '../../utils/localStorage'
import { logoutUser } from '../../utils/auth'
import { fetchUserProfile, updateUserProfile } from '../../utils/profile'

const fetchUserSettingsFromApi = async (token) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/settings/user-settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      console.error('Failed to fetch user settings:', response.statusText)
      return null
    }
    const data = await response.json()
    if (data.user_settings && data.user_settings.length > 0) {
      const userSettings = data.user_settings[0]
      // Convert bytes to GB with 2 decimal places
      const totalStorageGB = (parseInt(userSettings.total_storage, 10) / (1024 ** 3)).toFixed(2)
      const usedStorageGB = (parseInt(userSettings.used_storage, 10) / (1024 ** 3)).toFixed(2)
      return {
        ...userSettings,
        total_storage_gb: totalStorageGB,
        used_storage_gb: usedStorageGB
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return null
  }
}

const Settings = () => {
  const navigate = useNavigate()
  const [selectedSection, setSelectedSection] = useState('profile')
  const [saveStatus, setSaveStatus] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [userProfile, setUserProfile] = useState({})
  const [settings, setSettings] = useState({})
  const [profileErrors, setProfileErrors] = useState({})
  const [isProfileValid, setIsProfileValid] = useState(true)
  const [availableStudyFields, setAvailableStudyFields] = useState([])

  useEffect(() => {
    const fields = getAvailableStudyFields();
    setAvailableStudyFields(fields);
  }, [])

  const updateUserSettingsApi = async (settingsData) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      console.error('No auth token found for updating user settings')
      return { success: false, error: 'No auth token' }
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/settings/user-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to update user settings:', errorText)
        return { success: false, error: errorText }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error updating user settings:', error)
      return { success: false, error: error.message }
    }
  }
  const [selectedSubFields, setSelectedSubFields] = useState([])

  const [specializations, setSpecializations] = useState([])
  const [selectedSpecializations, setSelectedSpecializations] = useState([])

  const [userSettings, setUserSettings] = useState(null)

  // Add the missing handler functions
  const handleSpecializationChange = (specializationId) => {
    const updatedSpecializations = selectedSpecializations.includes(specializationId)
      ? selectedSpecializations.filter(id => id !== specializationId)
      : [...selectedSpecializations, specializationId]

    setSelectedSpecializations(updatedSpecializations)
    handleProfileChange('specializations', updatedSpecializations)
  }

  const handleSelectAllSpecializations = () => {
    const allSpecializationIds = specializations.map(spec => spec.id)
    setSelectedSpecializations(allSpecializationIds)
    handleProfileChange('specializations', allSpecializationIds)
  }

  const handleClearAllSpecializations = () => {
    setSelectedSpecializations([])
    handleProfileChange('specializations', [])
  }

  // Load user data on component mount
  useEffect(() => {
    
    if (Object.keys(userProfile).length === 0) {
      const loadProfileData = async () => {
        try {
          console.log('Attempting to fetch profile from API...');
          const result = await fetchUserProfile();
          
          if (result.success && result.profile) {
            console.log('Successfully loaded profile from API:', result.profile);
            setUserProfile(result.profile);

            // Set selectedSpecializations from profile specialization field if present
            if (Array.isArray(result.profile.specialization)) {
              setSelectedSpecializations(result.profile.specialization);
            }
            
            // Also update settings from profile.settings
            if (result.profile.settings) {
              setSettings(prevSettings => ({
                ...prevSettings,
                ...result.profile.settings
              }));
            }
          } else {
            console.error('Failed to load profile from API:', result.error);
            // Removed fallback to localStorage per user request
            setUserProfile({})
            setSettings({})
          }
        } catch (error) {
          console.error('Unexpected error in loadProfileData:', error);
          // Removed fallback to localStorage per user request
          setUserProfile({})
          setSettings({})
        }
      };
      
      loadProfileData();
    }
  }, [userProfile]);

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        setUserProfile(event.detail)
        setHasUnsavedChanges(false) // Reset unsaved changes since it's synced
      }
    }

    window.addEventListener('userProfileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
    }
  }, [])

  // Get user display info
  const userDisplayInfo = getUserDisplayInfo()
  
useEffect(() => {
  const loadUserSettings = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const userSettings = await fetchUserSettingsFromApi(token);
    if (userSettings) {
      setSettings(userSettings);
    }
  };

  loadUserSettings();
}, []);

  useEffect(() => {
    if (userProfile && userProfile.fieldOfStudy) {
      const parentField = availableStudyFields.find(field => field.id === userProfile.fieldOfStudy)
      if (parentField) {
        // Filter selected sub-fields to only include those from the current parent field
        const validSubFields = userProfile.subFieldsOfStudy?.filter(subFieldId => 
          parentField.subFields.some(subField => subField.id === subFieldId)
        ) || []

        // Update user profile if sub-fields changed
        if (JSON.stringify(validSubFields) !== JSON.stringify(userProfile.subFieldsOfStudy)) {
          handleProfileChange('subFieldsOfStudy', validSubFields)
        }
      }
    }
  }, [userProfile && userProfile.fieldOfStudy, availableStudyFields])

  // Mapping from fieldOfStudy to specializations
  const fieldOfStudyToSpecializations = {
    medical: [
      { id: 'cardiology', name: 'Cardiology' },
      { id: 'neurology', name: 'Neurology' },
      { id: 'pediatrics', name: 'Pediatrics' }
    ],
    nursing: [
      { id: 'pediatric-nursing', name: 'Pediatric Nursing' },
      { id: 'geriatric-nursing', name: 'Geriatric Nursing' },
      { id: 'critical-care', name: 'Critical Care' }
    ],
    pharmacy: [
      { id: 'clinical-pharmacy', name: 'Clinical Pharmacy' },
      { id: 'pharmaceutical-research', name: 'Pharmaceutical Research' }
    ],
    dentistry: [
      { id: 'orthodontics', name: 'Orthodontics' },
      { id: 'periodontics', name: 'Periodontics' }
    ],
    physiotherapy: [
      { id: 'sports-physiotherapy', name: 'Sports Physiotherapy' },
      { id: 'neurological-physiotherapy', name: 'Neurological Physiotherapy' }
    ],
    'computer-science': [
      { id: 'artificial-intelligence', name: 'Artificial Intelligence' },
      { id: 'software-engineering', name: 'Software Engineering' },
      { id: 'data-science', name: 'Data Science' }
    ],
    engineering: [
      { id: 'civil-engineering', name: 'Civil Engineering' },
      { id: 'mechanical-engineering', name: 'Mechanical Engineering' },
      { id: 'electrical-engineering', name: 'Electrical Engineering' }
    ],
    business: [
      { id: 'marketing', name: 'Marketing' },
      { id: 'finance', name: 'Finance' },
      { id: 'human-resources', name: 'Human Resources' }
    ],
    law: [
      { id: 'corporate-law', name: 'Corporate Law' },
      { id: 'criminal-law', name: 'Criminal Law' }
    ],
    education: [
      { id: 'early-childhood', name: 'Early Childhood' },
      { id: 'special-education', name: 'Special Education' }
    ],
    psychology: [
      { id: 'clinical-psychology', name: 'Clinical Psychology' },
      { id: 'counseling', name: 'Counseling' }
    ],
    'arts': [
      { id: 'history', name: 'History' },
      { id: 'philosophy', name: 'Philosophy' },
      { id: 'literature', name: 'Literature' }
    ],
    science: [
      { id: 'physics', name: 'Physics' },
      { id: 'chemistry', name: 'Chemistry' },
      { id: 'biology', name: 'Biology' }
    ],
    'school': [
      { id: 'primary-education', name: 'Primary Education' },
      { id: 'secondary-education', name: 'Secondary Education' },
      { id: 'special-education', name: 'Special Education' }
    ],
    other: [
      { id: 'general', name: 'General' }
    ]
  }

  // Update specializations dynamically based on fieldOfStudy
  useEffect(() => {
    if (userProfile && userProfile.fieldOfStudy && fieldOfStudyToSpecializations[userProfile.fieldOfStudy]) {
      setSpecializations(fieldOfStudyToSpecializations[userProfile.fieldOfStudy])
      // Reset selected specializations when fieldOfStudy changes
      setSelectedSpecializations([])
      handleProfileChange('specializations', [])
    } else {
      // If no fieldOfStudy or no mapping, clear specializations
      setSpecializations([])
      setSelectedSpecializations([])
      handleProfileChange('specializations', [])
    }
  }, [userProfile && userProfile.fieldOfStudy])

  // Sync selectedSpecializations with userProfile.specialization on userProfile change only if selectedSpecializations is empty
  useEffect(() => {
    if (
      userProfile &&
      Array.isArray(userProfile.specialization) &&
      selectedSpecializations.length === 0
    ) {
      setSelectedSpecializations(userProfile.specialization)
    }
  }, [userProfile])

  const handleSettingChange = async (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setHasUnsavedChanges(true)
    setSaveStatus('')

    try {
      const settingPayload = {
        ...settings,
        [key]: value
      }
      const apiResult = await updateUserSettingsApi(settingPayload)
      if (apiResult.success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus(''), 2000)
      } else {
        setSaveStatus('error')
        console.error('Failed to update setting:', apiResult.error)
      }
    } catch (error) {
      setSaveStatus('error')
      console.error('Error updating setting:', error)
    }
  }

  const handleProfileChange = (key, value) => {
    const updatedProfile = { ...userProfile, [key]: value }

    // Validate the updated profile
    const validation = validateProfile(updatedProfile)
    setProfileErrors(validation.errors)
    setIsProfileValid(validation.isValid)

    setUserProfile(updatedProfile)
    setHasUnsavedChanges(true)
    setSaveStatus('')

    // Removed auto-sync on profile changes to prevent unnecessary PUT API calls on load
    // if (validation.isValid) {
    //   syncUserProfile(updatedProfile)
    // }
  }

  const handleSubFieldChange = (subFieldId, isChecked) => {
    const updatedSubFields = isChecked
      ? [...(userProfile.subFieldsOfStudy || []), subFieldId]
      : (userProfile.subFieldsOfStudy || []).filter(id => id !== subFieldId)
    
    handleProfileChange('subFieldsOfStudy', updatedSubFields)
  }

  const handleSave = async (section = 'all') => {
    setSaveStatus('saving')

    try {
      if (section === 'profile') {
        // Save user profile
        const profileToSave = {
          displayName: userProfile.display_name || userProfile.displayName || '',
          firstName: userProfile.firstName || '',
          lastName: userProfile.lastName || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          bio: userProfile.bio || '',
          educationLevel: userProfile.educationLevel || '',
          fieldOfStudy: userProfile.fieldOfStudy || '',
          specialization: selectedSpecializations || [],
          profilePictureUrl: userProfile.profilePictureUrl || ''
        }

        const result = await updateUserProfile(profileToSave)

        if (result.success) {
          setUserProfile(profileToSave)
          setSaveStatus('success')
          setHasUnsavedChanges(false)

          setTimeout(() => {
            setSaveStatus('')
          }, 3000)

          console.log(`Profile saved successfully for section: ${section}`)
        } else {
          setSaveStatus('error')
          console.error('Failed to save profile:', result.error)
        }
      } else {
        // Save settings for other sections
        saveUserSettings(settings)

        const apiResult = await updateUserSettingsApi({
          email_notifications: settings.email_notifications,
          push_notifications: settings.pushNotifications,
          sound_enabled: settings.soundEnabled,
          course_reminders: settings.courseReminders,
          assignment_deadlines: settings.assignmentDeadlines,
          weekly_progress: settings.weeklyProgress,
          marketing_emails: settings.marketingEmails,
          profile_visibility: settings.profileVisibility,
          show_progress: settings.showProgress,
          show_achievements: settings.showAchievements,
          data_sharing: settings.dataSharing,
          analytics_tracking: settings.analyticsTracking,
          theme: settings.theme,
          font_size: settings.fontSize,
          compact_mode: settings.compactMode,
          reduced_motion: settings.reducedMotion,
          high_contrast: settings.highContrast
        })

        if (apiResult.success) {
          setSaveStatus('success')
          setHasUnsavedChanges(false)

          setTimeout(() => {
            setSaveStatus('')
          }, 3000)

          console.log(`Settings saved successfully for section: ${section}`)
        } else {
          setSaveStatus('error')
          console.error('Failed to save settings:', apiResult.error)
        }
      }
    } catch (error) {
      setSaveStatus('error')
      console.error('Error saving settings:', error)
    }
  }

  const handleSecurityAction = (action) => {
    setSaveStatus('processing')

    setTimeout(() => {
      setSaveStatus('success')

      const messages = {
        'change-password': 'Password change initiated. Check your email for instructions.',
        'two-factor': 'Two-factor authentication setup started.',
        'download-data': 'Data export initiated. You will receive an email when ready.',
        'delete-account': 'Account deletion request submitted. This action cannot be undone.'
      }

      alert(messages[action] || 'Action completed successfully.')
      setSaveStatus('')
    }, 1500)
  }

  const handleLogout = () => {
    const result = logoutUser()
    if (result.success) {
      navigate('/login')
    }
  }

  const settingsSections = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'materials', name: 'Materials', icon: FileText },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'privacy', name: 'Privacy & Security', icon: Shield },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'account', name: 'Account', icon: SettingsIcon }
  ]

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your learning experience and preferences</p>
        </div>
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-nav">
          {settingsSections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                className={`settings-nav-item ${selectedSection === section.id ? 'active' : ''}`}
                onClick={() => setSelectedSection(section.id)}
              >
                <Icon size={20} />
                <span>{section.name}</span>
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {selectedSection === 'profile' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Profile Information</h2>
                <p>Manage your personal information and account details</p>
              </div>

              {/* Profile Picture */}
              <div className="setting-group">
                <h3>Profile Picture</h3>
                <div className="profile-picture-section">
                  <div className="current-avatar">
                    <div className="user-avatar large">{userDisplayInfo.initials}</div>
                  </div>
                  <div className="avatar-actions">
                    <button className="action-btn secondary">
                      <Camera size={16} />
                      Change Photo
                    </button>
                    <button className="action-btn danger">
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="setting-group">
                <h3>Personal Information</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Username</label>
                    <div className="input-with-icon">
                      <User size={16} />
                    <input
                      type="text"
                      value={userProfile?.username || ''}
                      className="form-input"
                      placeholder="Your username"
                      disabled
                      title="Username cannot be changed"
                      style={{ 
                        backgroundColor: '#2d2d30', 
                        cursor: 'not-allowed',
                        opacity: 0.8
                      }}
                    />
                    </div>
                    <div className="form-note">Username cannot be changed after account creation</div>
                  </div>
                  <div className="form-field">
                    <label>Display Name</label>
                    <input
                      type="text"
                      value={userProfile?.displayName || ''}
                      onChange={(e) => handleProfileChange('display_name', e.target.value)}
                      className={`form-input ${profileErrors.displayName ? 'error' : ''}`}
                      placeholder="How you want to be displayed"
                    />
                    {profileErrors.display_name && (
                      <div className="form-error">{profileErrors.displayName}</div>
                    )}
                  </div>
                  <div className="form-field">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={(userProfile && userProfile.firstName) || ''}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={(userProfile && userProfile.lastName) || ''}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      className="form-input"
                    />
                  </div>
                  <div className="form-field">
                    <label>Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        value={userProfile.email || ''}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className={`form-input ${profileErrors.email ? 'error' : ''}`}
                      />
                    </div>
                    {profileErrors.email && (
                      <div className="form-error">{profileErrors.email}</div>
                    )}
                  </div>
                  <div className="form-field">
                    <label>Phone Number</label>
                    <div className="input-with-icon">
                      <Phone size={16} />
                      <input
                        type="tel"
                        value={userProfile.phone || ''}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-field full-width">
                    <label>Bio</label>
                    <textarea
                      value={userProfile.bio || ''}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      className="form-textarea"
                      rows="3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="form-field full-width">
                    <label>Field of Study</label>
                    <select
                      value={userProfile.fieldOfStudy || ''}
                      onChange={(e) => handleProfileChange('fieldOfStudy', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select your field of study</option>
                      {availableStudyFields.map(field => (
                        <option key={field.id} value={field.id}>{field.name}</option>
                      ))}
                    </select>
                    <div className="form-note">Select your primary field of study</div>
                  </div>
                  {/* Specialization Section */}
                  <div className="form-field full-width">
                    <div className="field-selection-header">
                      <div>
                        <h3 className="field-selection-title">Specialization</h3>
                        <p className="field-selection-subtitle">Select your specializations within your field of study</p>
                      </div>
                      <div className="field-selection-actions">
                        <button className="select-all-btn" onClick={handleSelectAllSpecializations}>Select All</button>
                        <button className="clear-all-btn" onClick={handleClearAllSpecializations}>Clear All</button>
                      </div>
                    </div>
                    
                    <div className="study-fields-selector">
                      {specializations.map(specialization => (
                        <label key={specialization.id} className="checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedSpecializations.includes(specialization.id)}
                            onChange={() => handleSpecializationChange(specialization.id)}
                          />
                          <span className="checkbox-custom"></span>
                          <span className="checkbox-label">{specialization.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-field full-width">
                    <label>Education Level</label>
                    <select
                      value={userProfile.educationLevel || ''}
                      onChange={(e) => handleProfileChange('educationLevel', e.target.value)}
                      className="form-select"
                    >
                      <option value="">Select your education level</option>
                      <option value="high_school">High School</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="graduate">Graduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="professional">Professional</option>
                    </select>
                    <div className="form-note">Select your current education level</div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="setting-group">
                <h3>Preferences</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Timezone</label>
                    <div className="input-with-icon">
                      <Globe size={16} />
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleSettingChange('timezone', e.target.value)}
                        className="form-select"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Language</label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="form-select"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Español</option>
                      <option value="French">Français</option>
                      <option value="German">Deutsch</option>
                      <option value="Chinese">中文</option>
                      <option value="Japanese">日本語</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="section-actions">
                {saveStatus && (
                  <div className={`save-status ${saveStatus}`}>
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'success' && '✓ Profile saved and synced successfully!'}
                    {saveStatus === 'processing' && 'Processing...'}
                  </div>
                )}
                {!isProfileValid && (
                  <div className="save-status error">
                    Please fix the errors above before saving
                  </div>
                )}
                {isProfileValid && !hasUnsavedChanges && !saveStatus && (
                  <div className="save-status success">
                    ✓ Profile is synced and up to date
                  </div>
                )}
                <button
                  className="action-btn primary"
                  onClick={() => handleSave('profile')}
                  disabled={saveStatus === 'saving' || !isProfileValid}
                >
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {selectedSection === 'materials' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Learning Materials</h2>
                <p>Manage your uploaded files, documents, and study materials</p>
              </div>

              <div className="setting-group">
  <h3>Storage Overview</h3>
  <div className="materials-overview">
    <div className="materials-stats">
      <div className="materials-stat">
        <div className="materials-stat-value">
          {settings.used_storage_gb || '0.00'} GB
        </div>
        <div className="materials-stat-label">Used</div>
      </div>
      <div className="materials-stat">
        <div className="materials-stat-value">
          {settings.total_storage_gb || '0.00'} GB
        </div>
        <div className="materials-stat-label">Total</div>
      </div>
      <div className="materials-stat">
        <div className="materials-stat-value">
          {(
            (parseFloat(settings.used_storage_gb || 0) /
              parseFloat(settings.total_storage_gb || 1)) *
            100
          ).toFixed(0)}
          %
        </div>
        <div className="materials-stat-label">Usage</div>
      </div>
    </div>

    <div className="storage-usage">
      <div className="storage-bar">
        <div
          className="storage-fill"
          style={{
            width: `${
              (parseFloat(settings.used_storage_gb || 0) /
                parseFloat(settings.total_storage_gb || 1)) *
              100
            }%`
          }}
        ></div>
      </div>
      <div className="storage-info">
        <span>
          {settings.used_storage_gb || '0.00'} GB used of{' '}
          {settings.total_storage_gb || '0.00'} GB
        </span>
        <span>
          {(
            parseFloat(settings.total_storage_gb || 0) -
            parseFloat(settings.used_storage_gb || 0)
          ).toFixed(2)}{' '}
          GB available
        </span>
      </div>
    </div>
  </div>
</div>


              <div className="setting-group">
                <h3>Upload Materials</h3>
                <div className="materials-upload">
                  <div className="materials-upload-icon">
                    <FileText size={24} />
                  </div>
                  <h4>Upload Study Materials</h4>
                  <p>Drag and drop files here or click to browse</p>
                  <button className="action-btn primary">
                    <FileText size={16} />
                    Choose Files
                  </button>
                </div>
              </div>

              <div className="setting-group">
                <h3>Recent Materials</h3>
                <div className="materials-list">
                  <div className="material-item">
                    <div className="material-file-icon">
                      <FileText size={20} />
                    </div>
                    <div className="material-details">
                      <div className="material-name">Calculus Notes.pdf</div>
                      <div className="material-meta">
                        <span className="material-size">2.4 MB</span>
                        <span className="material-date">2 days ago</span>
                      </div>
                    </div>
                    <div className="material-actions">
                      <button className="material-btn">
                        <Download size={14} />
                        Download
                      </button>
                      <button className="material-btn">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="material-item">
                    <div className="material-file-icon">
                      <FileText size={20} />
                    </div>
                    <div className="material-details">
                      <div className="material-name">Physics Formulas.docx</div>
                      <div className="material-meta">
                        <span className="material-size">1.8 MB</span>
                        <span className="material-date">1 week ago</span>
                      </div>
                    </div>
                    <div className="material-actions">
                      <button className="material-btn">
                        <Download size={14} />
                        Download
                      </button>
                      <button className="material-btn">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="material-item">
                    <div className="material-file-icon">
                      <FileText size={20} />
                    </div>
                    <div className="material-details">
                      <div className="material-name">Chemistry Lab Report.pdf</div>
                      <div className="material-meta">
                        <span className="material-size">3.2 MB</span>
                        <span className="material-date">2 weeks ago</span>
                      </div>
                    </div>
                    <div className="material-actions">
                      <button className="material-btn">
                        <Download size={14} />
                        Download
                      </button>
                      <button className="material-btn">
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-actions">
                {saveStatus && (
                  <div className={`save-status ${saveStatus}`}>
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'success' && '✓ Materials settings saved!'}
                    {saveStatus === 'processing' && 'Processing...'}
                  </div>
                )}
                <button
                  className="action-btn secondary"
                  onClick={() => {
                    // Clear all materials
                    setSaveStatus('processing')
                    setTimeout(() => setSaveStatus('success'), 1500)
                  }}
                >
                  <Trash2 size={16} />
                  Clear All Materials
                </button>
                <button
                  className="action-btn primary"
                  onClick={() => handleSave('materials')}
                  disabled={saveStatus === 'saving'}
                >
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {selectedSection === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Notification Preferences</h2>
                <p>Control how and when you receive notifications</p>
              </div>

              <div className="setting-group">
                <h3>General Notifications</h3>
                <div className="toggle-settings">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Email Notifications</div>
                      <div className="toggle-description">Receive notifications via email</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.email_notifications}
                        onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Push Notifications</div>
                      <div className="toggle-description">Receive push notifications in your browser</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.push_notifications}
                        onChange={(e) => handleSettingChange('push_notifications', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Sound Notifications</div>
                      <div className="toggle-description">Play sounds for notifications</div>
                    </div>
                    <div className="toggle-with-icon">
                      {settings.sound_enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.sound_enabled}
                          onChange={(e) => handleSettingChange('sound_enabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Learning Notifications</h3>
                <div className="toggle-settings">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Course Reminders</div>
                      <div className="toggle-description">Get reminded about upcoming classes</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.course_reminders}
                        onChange={(e) => handleSettingChange('course_reminders', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Assignment Deadlines</div>
                      <div className="toggle-description">Notifications for upcoming assignment deadlines</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.assignment_deadlines}
                        onChange={(e) => handleSettingChange('assignment_deadlines', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Weekly Progress Reports</div>
                      <div className="toggle-description">Receive weekly summaries of your progress</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.weekly_progress}
                        onChange={(e) => handleSettingChange('weekly_progress', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Marketing & Updates</h3>
                <div className="toggle-settings">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Marketing Emails</div>
                      <div className="toggle-description">Receive promotional emails and course recommendations</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.marketing_emails}
                        onChange={(e) => handleSettingChange('marketing_emails', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedSection === 'privacy' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Privacy & Security</h2>
                <p>Manage your privacy settings and account security</p>
              </div>

              <div className="setting-group">
                <h3>Profile Privacy</h3>
                <div className="radio-settings">
                  <div className="radio-setting">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="public"
                        checked={settings.profile_visibility === 'public'}
                        onChange={(e) => handleSettingChange('profile_visibility', e.target.value)}
                      />
                      <span className="radio-custom"></span>
                      <div className="radio-info">
                        <div className="radio-title">Public Profile</div>
                        <div className="radio-description">Your profile is visible to everyone</div>
                      </div>
                    </label>
                  </div>

                  <div className="radio-setting">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="friends"
                        checked={settings.profile_visibility === 'friends'}
                        onChange={(e) => handleSettingChange('profile_visibility', e.target.value)}
                      />
                      <span className="radio-custom"></span>
                      <div className="radio-info">
                        <div className="radio-title">Friends Only</div>
                        <div className="radio-description">Only your connections can see your profile</div>
                      </div>
                    </label>
                  </div>

                  <div className="radio-setting">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="profileVisibility"
                        value="private"
                        checked={settings.profile_visibility === 'private'}
                        onChange={(e) => handleSettingChange('profile_visibility', e.target.value)}
                      />
                      <span className="radio-custom"></span>
                      <div className="radio-info">
                        <div className="radio-title">Private Profile</div>
                        <div className="radio-description">Your profile is completely private</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Data Sharing</h3>
                <div className="toggle-settings">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Show Learning Progress</div>
                      <div className="toggle-description">Allow others to see your course progress</div>
                    </div>
                    <div className="toggle-with-icon">
                      <Eye size={16} />
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={settings.show_progress}
                          onChange={(e) => handleSettingChange('show_progress', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Show Achievements</div>
                      <div className="toggle-description">Display your badges and achievements publicly</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.show_achievements}
                        onChange={(e) => handleSettingChange('show_achievements', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Data Sharing for Research</div>
                      <div className="toggle-description">Share anonymized data to improve learning experiences</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.data_sharing}
                        onChange={(e) => handleSettingChange('data_sharing', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Analytics Tracking</div>
                      <div className="toggle-description">Help us improve by tracking usage patterns</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.analytics_tracking}
                        onChange={(e) => handleSettingChange('analytics_tracking', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Account Security</h3>
                <div className="security-actions">
                  <button
                    className="security-btn"
                    onClick={() => handleSecurityAction('change-password')}
                    disabled={saveStatus === 'processing'}
                  >
                    <Key size={16} />
                    <div className="security-info">
                      <div className="security-title">Change Password</div>
                      <div className="security-description">Update your account password</div>
                    </div>
                  </button>

                  <button
                    className="security-btn"
                    onClick={() => handleSecurityAction('two-factor')}
                    disabled={saveStatus === 'processing'}
                  >
                    <Shield size={16} />
                    <div className="security-info">
                      <div className="security-title">Two-Factor Authentication</div>
                      <div className="security-description">Add an extra layer of security</div>
                    </div>
                  </button>

                  <button
                    className="security-btn"
                    onClick={() => handleSecurityAction('download-data')}
                    disabled={saveStatus === 'processing'}
                  >
                    <Download size={16} />
                    <div className="security-info">
                      <div className="security-title">Download Data</div>
                      <div className="security-description">Export your personal data</div>
                    </div>
                  </button>

                  <button
                    className="security-btn danger"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        handleSecurityAction('delete-account')
                      }
                    }}
                    disabled={saveStatus === 'processing'}
                  >
                    <Trash2 size={16} />
                    <div className="security-info">
                      <div className="security-title">Delete Account</div>
                      <div className="security-description">Permanently delete your account</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedSection === 'appearance' && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Appearance & Display</h2>
                <p>Customize the look and feel of your learning environment</p>
              </div>

              <div className="setting-group">
                <h3>Theme</h3>
                <div className="theme-options">
                  <div className="theme-option">
                    <label className="theme-label">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={settings.theme === 'light'}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                      />
                      <div className="theme-preview light">
                        <Sun size={20} />
                        <span>Light</span>
                      </div>
                    </label>
                  </div>

                  <div className="theme-option">
                    <label className="theme-label">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={settings.theme === 'dark'}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                      />
                      <div className="theme-preview dark">
                        <Moon size={20} />
                        <span>Dark</span>
                      </div>
                    </label>
                  </div>

                  <div className="theme-option">
                    <label className="theme-label">
                      <input
                        type="radio"
                        name="theme"
                        value="system"
                        checked={settings.theme === 'system'}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                      />
                      <div className="theme-preview system">
                        <Monitor size={20} />
                        <span>System</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="setting-group">
                <h3>Display Options</h3>
                <div className="form-grid">
                  <div className="form-field">
                    <label>Font Size</label>
                    <select
                      value={settings.font_size}
                      onChange={(e) => handleSettingChange('font_size', e.target.value)}
                      className="form-select"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extra-large">Extra Large</option>
                    </select>
                  </div>
                </div>

                <div className="toggle-settings">
                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Compact Mode</div>
                      <div className="toggle-description">Reduce spacing for more content on screen</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.compact_mode}
                        onChange={(e) => handleSettingChange('compact_mode', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">Reduced Motion</div>
                      <div className="toggle-description">Minimize animations and transitions</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.reduced_motion}
                        onChange={(e) => handleSettingChange('reduced_motion', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="toggle-setting">
                    <div className="toggle-info">
                      <div className="toggle-title">High Contrast</div>
                      <div className="toggle-description">Increase contrast for better visibility</div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={settings.high_contrast}
                        onChange={(e) => handleSettingChange('high_contrast', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="section-actions">
                {saveStatus && (
                  <div className={`save-status ${saveStatus}`}>
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'success' && '✓ Preferences saved successfully!'}
                    {saveStatus === 'processing' && 'Processing...'}
                  </div>
                )}
                <button
                  className="action-btn primary"
                  onClick={() => handleSave('appearance')}
                  disabled={saveStatus === 'saving'}
                >
                  <Save size={16} />
                  {saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}
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
  )
}

export default Settings






