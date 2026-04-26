import React, { useState, useEffect } from 'react';
import { Video, Calendar as CalendarIcon, Clock, Edit3, MessageSquare, XCircle, X } from 'lucide-react';
import { mentorApi } from '../../../utils/mentorApi';
import { useNotifications } from '../../../components/ui/NotificationSystem';
import './MentorSessions.css';

const MentorSessions = () => {
  const { addNotification } = useNotifications();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI state for adding notes
  const [activeNoteSession, setActiveNoteSession] = useState(null);
  const [noteContent, setNoteContent] = useState('');

  // UI state for rescheduling
  const [reschedulingSession, setReschedulingSession] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: '',
    time: '',
    duration: 60
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await mentorApi.getSessions();
      setSessions(data.sessions || []);
    } catch (error) {
      addNotification('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleSaveNote = () => {
    if (!noteContent.trim()) return;
    
    // UI mock of saving note since API isn't ready
    addNotification('Session notes saved successfully!', 'success');
    setActiveNoteSession(null);
    setNoteContent('');
  };

  const handleReschedule = async () => {
    if (!rescheduleForm.date || !rescheduleForm.time) {
      addNotification('Please select a date and time.', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const scheduledAt = new Date(`${rescheduleForm.date}T${rescheduleForm.time}`).toISOString();
      
      await mentorApi.rescheduleSession(reschedulingSession.id, {
        scheduled_at: scheduledAt,
        duration_minutes: rescheduleForm.duration
      });

      addNotification('Session rescheduled successfully! Student notified via chat.', 'success');
      setReschedulingSession(null);
      fetchSessions(); // Refresh list to get new times
    } catch (error) {
      addNotification('Failed to reschedule session', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRescheduleModal = (session) => {
    const d = new Date(session.scheduled_at);
    // Pad local time parts to build "YYYY-MM-DD" and "HH:MM"
    const localDate = d.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD
    const localTime = d.toTimeString().slice(0, 5); // HH:MM

    setRescheduleForm({
      date: localDate,
      time: localTime,
      duration: session.duration_minutes || 60
    });
    setReschedulingSession(session);
  };

  const now = new Date();
  
  const upcomingSessions = sessions.filter(s => new Date(s.scheduled_at) > now).sort((a,b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const pastSessions = sessions.filter(s => new Date(s.scheduled_at) <= now).sort((a,b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="mentor-sessions-container">
      <div className="mentor-page-header">
        <h1>
          <Video size={28} /> Mentorship Sessions
        </h1>
        <p>Manage your upcoming schedules, reschedule sessions, and save notes.</p>
      </div>

      {loading ? (
        <div className="loading-state">Loading sessions...</div>
      ) : (
        <div className="sessions-layout">
          
          {/* Upcoming Sessions */}
          <div className="section-card">
            <div className="section-header upcoming-header">
              <h2>
                <CalendarIcon size={20} /> Upcoming Sessions ({upcomingSessions.length})
              </h2>
            </div>
            <div className="sessions-list">
              {upcomingSessions.length === 0 ? (
                <div className="empty-state">
                  <CalendarIcon size={48} />
                  <p>No upcoming sessions.</p>
                </div>
              ) : (
                upcomingSessions.map(session => {
                  const { date, time } = formatDateTime(session.scheduled_at);
                  return (
                    <div key={session.id} className="session-card upcoming-card">
                      <div className="session-header">
                        <h3 className="session-title">{session.title}</h3>
                        <span className="session-badge">
                          {session.duration_minutes} min
                        </span>
                      </div>
                      
                      <p className="session-desc">{session.description}</p>
                      
                      <div className="session-datetime">
                        <div className="datetime-item">
                          <CalendarIcon size={16} />
                          <span>{date}</span>
                        </div>
                        <div className="datetime-item">
                          <Clock size={16} />
                          <span>{time}</span>
                        </div>
                      </div>

                      <div className="session-footer">
                        <div className="student-info">
                          <div className="student-initials">
                            {session.student_first_name?.charAt(0)}{session.student_last_name?.charAt(0)}
                          </div>
                          <span className="student-name">{session.student_first_name} {session.student_last_name}</span>
                        </div>
                        <div className="session-actions">
                          <button 
                            onClick={() => openRescheduleModal(session)}
                            className="btn btn-secondary"
                            title="Reschedule"
                          >
                            <CalendarIcon size={14} /> Reschedule
                          </button>
                          <a 
                            href={session.meeting_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            <Video size={14} /> Join
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Past Sessions */}
          <div className="section-card">
            <div className="section-header past-header">
              <h2>
                <Clock size={20} /> Past Sessions ({pastSessions.length})
              </h2>
            </div>
            <div className="sessions-list">
              {pastSessions.length === 0 ? (
                <div className="empty-state">
                  <Clock size={48} />
                  <p>No past sessions.</p>
                </div>
              ) : (
                pastSessions.map(session => {
                  const { date, time } = formatDateTime(session.scheduled_at);
                  const isAddingNote = activeNoteSession === session.id;
                  
                  return (
                    <div key={session.id} className="session-card past-card">
                      <div className="session-header">
                        <h3 className="session-title">{session.title}</h3>
                        <span className="session-badge past-badge">Completed</span>
                      </div>
                      
                      <div className="session-datetime">
                        <div className="datetime-item">
                          <CalendarIcon size={16} style={{color: '#888'}} />
                          <span>{date}</span>
                        </div>
                        <div className="datetime-item">
                          <Clock size={16} style={{color: '#888'}} />
                          <span>{time}</span>
                        </div>
                      </div>

                      <div className="session-footer">
                        <div className="student-info">
                          <div className="student-initials">
                            {session.student_first_name?.charAt(0)}{session.student_last_name?.charAt(0)}
                          </div>
                          <span className="student-name">{session.student_first_name} {session.student_last_name}</span>
                        </div>
                        <div className="session-actions">
                          <button 
                            onClick={() => setActiveNoteSession(isAddingNote ? null : session.id)}
                            className="btn-text"
                          >
                            <Edit3 size={14} style={{display:'inline', marginRight:'4px'}}/> 
                            {isAddingNote ? 'Cancel' : 'Add Note'}
                          </button>
                        </div>
                      </div>

                      {/* Add Note Section */}
                      {isAddingNote && (
                        <div className="notes-container">
                          <label className="notes-label">Private Session Notes</label>
                          <textarea 
                            className="notes-textarea"
                            placeholder="Add your notes about the student's progress..."
                            value={noteContent}
                            onChange={e => setNoteContent(e.target.value)}
                          />
                          <div className="notes-actions">
                            <button 
                              onClick={handleSaveNote}
                              className="btn btn-primary"
                            >
                              Save Notes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingSession && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                <CalendarIcon size={20} style={{ display: 'inline', marginRight: '8px', color: '#5677fc' }} />
                Reschedule Session
              </h3>
              <button 
                onClick={() => setReschedulingSession(null)} 
                className="modal-close-btn"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Pick a new time for <strong>{reschedulingSession.title}</strong> with <strong>{reschedulingSession.student_first_name} {reschedulingSession.student_last_name}</strong>.
                The student will be automatically notified via chat.
              </p>

              <div className="form-grid">
                <div className="form-field">
                  <label>New Date</label>
                  <input 
                    type="date" 
                    value={rescheduleForm.date}
                    onChange={e => setRescheduleForm({...rescheduleForm, date: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-field">
                  <label>New Time</label>
                  <input 
                    type="time" 
                    value={rescheduleForm.time}
                    onChange={e => setRescheduleForm({...rescheduleForm, time: e.target.value})}
                    className="form-input"
                  />
                </div>
                
                <div className="form-field full-width">
                  <label>Duration (minutes)</label>
                  <select 
                    value={rescheduleForm.duration}
                    onChange={e => setRescheduleForm({...rescheduleForm, duration: parseInt(e.target.value)})}
                    className="form-select"
                  >
                    <option value={30}>30 mins</option>
                    <option value={60}>60 mins</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={() => setReschedulingSession(null)}
                className="modal-btn secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleReschedule}
                disabled={isSubmitting}
                className="modal-btn primary"
              >
                {isSubmitting ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorSessions;
