import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, Award, CheckCircle, XCircle } from 'lucide-react';
import { mentorApi } from '../../../utils/mentorApi';
import { useNotifications } from '../../../components/ui/NotificationSystem';
import './MentorDashboard.css';

const MentorDashboard = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [stats, setStats] = useState({
    total_students: 0,
    upcoming_sessions: 0,
    completed_sessions: 0,
    avg_rating: '0.0'
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats
      const statsData = await mentorApi.getDashboardStats();
      setStats(statsData);

      // Fetch students to get pending requests
      const studentsData = await mentorApi.getStudents();
      if (studentsData.students) {
        setPendingRequests(studentsData.students.filter(s => s.status === 'pending'));
      }
    } catch (error) {
      console.error('Error fetching mentor dashboard data:', error);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAcceptRequest = async (requestId) => {
    try {
      await mentorApi.acceptRequest(requestId);
      addNotification('Mentorship request accepted!', 'success');
      fetchDashboardData(); // Refresh list
    } catch (error) {
      addNotification('Failed to accept request', 'error');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await mentorApi.rejectRequest(requestId);
      addNotification('Mentorship request rejected.', 'info');
      fetchDashboardData(); // Refresh list
    } catch (error) {
      addNotification('Failed to reject request', 'error');
    }
  };

  const statCards = [
    {
      name: 'Total Students',
      value: stats.total_students,
      icon: Users,
      color: 'blue',
      description: 'Assigned to you'
    },
    {
      name: 'Upcoming Sessions',
      value: stats.upcoming_sessions,
      icon: Calendar,
      color: 'orange',
      description: 'Scheduled'
    },
    {
      name: 'Completed Sessions',
      value: stats.completed_sessions,
      icon: CheckCircle,
      color: 'green',
      description: 'Done'
    },
    {
      name: 'Average Rating',
      value: stats.avg_rating,
      icon: Award,
      color: 'purple',
      description: 'From students'
    }
  ];

  return (
    <div className="mentor-dashboard-container">
      <div className="welcome-banner">
        <h1 className="welcome-title">Mentor Dashboard</h1>
        <p className="welcome-subtitle">
          Overview of your students, sessions, and pending requests.
        </p>
      </div>

      {loading ? (
        <div className="loading-state">Loading dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            {statCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.name} className="stat-card">
                  <div className="stat-header">
                    <div className={`stat-icon ${stat.color}`}>
                      <Icon size={24} />
                    </div>
                    <span className="stat-value">{stat.value}</span>
                  </div>
                  <div>
                    <p className="stat-label">{stat.name}</p>
                    <p className="stat-change">{stat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="content-grid">
            {/* Pending Requests Section */}
            <div className="section-card">
              <div className="section-header">
                <h2>Pending Requests</h2>
                <p className="section-subtitle">Students waiting for your approval</p>
              </div>
              <div className="section-body">
                {pendingRequests.length === 0 ? (
                  <div className="empty-state">
                    <Users size={48} />
                    <p>No pending requests.</p>
                  </div>
                ) : (
                  <div>
                    {pendingRequests.map((req) => (
                      <div key={req.request_id} className="request-card">
                        <div className="request-info">
                          <img 
                            src={req.profile_picture || `https://ui-avatars.com/api/?name=${req.first_name}+${req.last_name}`} 
                            alt={req.first_name} 
                            className="request-avatar"
                          />
                          <div>
                            <h4 className="request-name">{req.first_name} {req.last_name}</h4>
                            <p className="request-topic">Topic: {req.topic}</p>
                          </div>
                        </div>
                        <div className="request-actions">
                          <button 
                            onClick={() => handleAcceptRequest(req.request_id)}
                            className="action-btn-small accept"
                            title="Accept"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(req.request_id)}
                            className="action-btn-small reject"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions / Navigation */}
            <div className="section-card">
              <div className="section-header">
                <h2>Quick Navigation</h2>
              </div>
              <div className="section-body">
                <div className="quick-nav-grid">
                  <button
                    className="nav-card"
                    onClick={() => navigate('/mentor/students')}
                  >
                    <Users size={28} />
                    <span>My Students</span>
                  </button>
                  <button
                    className="nav-card"
                    onClick={() => navigate('/mentor/sessions')}
                  >
                    <Calendar size={28} />
                    <span>Sessions</span>
                  </button>
                  <button
                    className="nav-card"
                    onClick={() => navigate('/mentor/progress')}
                  >
                    <Award size={28} />
                    <span>Track Progress</span>
                  </button>
                  <button
                    className="nav-card"
                    onClick={() => navigate('/mentor/profile')}
                  >
                    <CheckCircle size={28} />
                    <span>Update Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MentorDashboard;
