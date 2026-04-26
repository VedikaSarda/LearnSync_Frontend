import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Mail, BookOpen, CheckCircle, XCircle, Calendar, Video, X, MessageCircle, Activity } from 'lucide-react';
import { mentorApi } from '../../../utils/mentorApi';
import { useNotifications } from '../../../components/ui/NotificationSystem';
import './MentorStudents.css';

const MentorStudents = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [schedulingStudent, setSchedulingStudent] = useState(null);
  const [sessionForm, setSessionForm] = useState({
    title: 'Mentorship Session',
    description: 'Discussing goals and study plans.',
    date: '',
    time: '',
    duration: 60
  });
  const [generatedLink, setGeneratedLink] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await mentorApi.getStudents();
      setStudents(data.students || []);
    } catch (error) {
      addNotification('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAcceptRequest = async (student) => {
    try {
      await mentorApi.acceptRequest(student.request_id);
      addNotification('Mentorship request accepted!', 'success');
      fetchStudents();
      // Open scheduling modal for this student
      setSchedulingStudent(student);
      setGeneratedLink('');
    } catch (error) {
      addNotification('Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await mentorApi.rejectRequest(requestId);
      addNotification('Mentorship request rejected.', 'info');
      fetchStudents();
    } catch (error) {
      addNotification('Failed to reject request', 'error');
    }
  };

  const handleScheduleSession = async () => {
    if (!sessionForm.date || !sessionForm.time) {
      addNotification('Please select a date and time.', 'warning');
      return;
    }

    try {
      setScheduling(true);
      
      const scheduledAt = new Date(`${sessionForm.date}T${sessionForm.time}`).toISOString();
      
      const response = await mentorApi.scheduleSession({
        mentorship_id: schedulingStudent.request_id,
        student_id: schedulingStudent.student_id,
        title: sessionForm.title,
        description: sessionForm.description,
        scheduled_at: scheduledAt,
        duration_minutes: sessionForm.duration,
        meeting_platform: 'webrtc'
      });

      addNotification('Session scheduled successfully!', 'success');
      // The API should return the session with meeting_link
      const baseUrl = window.location.origin;
      const link = response.session?.meeting_link || `${baseUrl}/video-call/${response.session?.id || Math.floor(Math.random() * 10000)}`;
      setGeneratedLink(link);
      
    } catch (error) {
      addNotification('Failed to schedule session', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const closeSchedulingModal = () => {
    setSchedulingStudent(null);
    setGeneratedLink('');
  };

  const pendingStudents = students.filter(s => s.status === 'pending');
  const activeStudents = students.filter(s => s.status === 'confirmed');

  return (
    <div className="mentor-students-container">
      <div className="mentor-page-header">
        <h1>
          <Users size={28} /> My Students
        </h1>
        <p>Manage your mentees and schedule sessions.</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading students...</div>
      ) : (
        <div>
          {/* Pending Requests */}
          {pendingStudents.length > 0 && (
            <div className="section-card">
              <div className="section-header warning-header">
                <h2>Pending Requests ({pendingStudents.length})</h2>
              </div>
              <div className="students-grid">
                {pendingStudents.map(student => (
                  <div key={student.request_id} className="student-card">
                    <div className="student-header">
                      <img 
                        src={student.profile_picture || `https://ui-avatars.com/api/?name=${student.first_name}+${student.last_name}`} 
                        alt={student.first_name} 
                        className="student-avatar"
                      />
                      <div>
                        <h3 className="student-name">{student.first_name} {student.last_name}</h3>
                        <span className="status-badge pending">Pending</span>
                      </div>
                    </div>
                    <div className="student-info">
                      <div className="info-row">
                        <span className="info-label">Topic:</span> {student.topic}
                      </div>
                      <div className="info-row">
                        <Mail size={14} style={{marginTop: '2px'}}/> {student.email}
                      </div>
                    </div>
                    <div className="student-actions">
                      <button 
                        onClick={() => handleAcceptRequest(student)}
                        className="btn btn-success"
                      >
                        <CheckCircle size={16} /> Accept
                      </button>
                      <button 
                        onClick={() => handleRejectRequest(student.request_id)}
                        className="btn btn-danger"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Students */}
          <div className="section-card">
            <div className="section-header">
              <h2>Active Students ({activeStudents.length})</h2>
            </div>
            {activeStudents.length === 0 ? (
              <div className="empty-state">
                <Users size={48} />
                <p>No active students yet.</p>
              </div>
            ) : (
              <div className="students-grid">
                {activeStudents.map(student => (
                  <div key={student.student_id} className="student-card">
                    <div className="student-header">
                      <img 
                        src={student.profile_picture || `https://ui-avatars.com/api/?name=${student.first_name}+${student.last_name}`} 
                        alt={student.first_name} 
                        className="student-avatar"
                      />
                      <div>
                        <h3 className="student-name">{student.first_name} {student.last_name}</h3>
                        <span className="status-badge active">Active</span>
                      </div>
                    </div>
                    <div className="student-info">
                      <div className="info-row">
                        <span className="info-label">Topic:</span> {student.topic}
                      </div>
                      <div className="info-row">
                        <Mail size={14} style={{marginTop: '2px'}}/> {student.email}
                      </div>
                    </div>
                    <div className="student-actions">
                      <button 
                        onClick={() => {
                          setSchedulingStudent(student);
                          setGeneratedLink('');
                        }}
                        className="btn btn-primary"
                      >
                        <Video size={16} /> Schedule Session
                      </button>
                    </div>
                    <div className="student-actions" style={{ marginTop: '8px' }}>
                      <button 
                        onClick={() => navigate(`/mentor/progress?studentId=${student.student_id}`)}
                        className="btn btn-secondary"
                      >
                        <BookOpen size={14} /> View Progress
                      </button>
                      <button 
                        onClick={() => navigate(`/mentor/ai-insights?studentId=${student.student_id}`)}
                        className="btn btn-secondary"
                      >
                        <Activity size={14} /> AI Insights
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Session Modal */}
      {schedulingStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <Calendar size={20} color="#5677fc" />
                Schedule Session
              </h3>
              <button onClick={closeSchedulingModal} className="modal-close-btn">
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              {!generatedLink ? (
                <>
                  <p className="modal-description">
                    Schedule a video session for <strong>{schedulingStudent.first_name} {schedulingStudent.last_name}</strong>.
                  </p>

                  <div className="form-grid">
                    <div className="form-field full-width">
                      <label>Session Title</label>
                      <input 
                        type="text" 
                        value={sessionForm.title}
                        onChange={e => setSessionForm({...sessionForm, title: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Date</label>
                      <input 
                        type="date" 
                        value={sessionForm.date}
                        onChange={e => setSessionForm({...sessionForm, date: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Time</label>
                      <input 
                        type="time" 
                        value={sessionForm.time}
                        onChange={e => setSessionForm({...sessionForm, time: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-field full-width">
                      <label>Duration (minutes)</label>
                      <select 
                        value={sessionForm.duration}
                        onChange={e => setSessionForm({...sessionForm, duration: parseInt(e.target.value)})}
                        className="form-select"
                      >
                        <option value={30}>30 mins</option>
                        <option value={60}>60 mins</option>
                        <option value={90}>90 mins</option>
                        <option value={120}>120 mins</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="success-container">
                  <div className="success-icon-wrap">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="success-title">Session Created!</h3>
                  <p className="success-desc">Share this link with your student.</p>
                  
                  <div className="link-container">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedLink} 
                      className="link-input"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        addNotification('Link copied to clipboard!', 'success');
                      }}
                      className="copy-btn"
                      title="Copy Link"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {!generatedLink ? (
                <>
                  <button 
                    onClick={closeSchedulingModal}
                    className="modal-btn secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleScheduleSession}
                    disabled={scheduling}
                    className="modal-btn primary"
                  >
                    {scheduling ? 'Scheduling...' : 'Generate Session Link'}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={closeSchedulingModal}
                    className="modal-btn secondary"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      navigate('/chat', { 
                        state: { 
                          targetUserId: schedulingStudent.student_id, 
                          prefillMessage: `Here is the link for our upcoming session: ${generatedLink}`
                        } 
                      });
                    }}
                    className="modal-btn primary"
                  >
                    <MessageCircle size={18} /> Share in Chat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorStudents;
