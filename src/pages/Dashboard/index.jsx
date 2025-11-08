import {
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  Calendar,
  Users,
  Award,
  FileText,
  Video,
  Image,
  Music,
  Archive,
  File,
  Eye,
  Bell,
  ArrowRight
} from 'lucide-react'
import {
  MdSchool,
  MdAssignment,
  MdQuiz,
  MdScience,
  MdEvent,
  MdAccessTime,
  MdBook,
  MdCalendarToday
} from 'react-icons/md'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  calculateTotalStudyHours, 
  loadStudyEvents, 
  loadUserProfile,
  loadTestResults,
  getAvailableStudyFields
} from '../../utils/localStorage'
import StudySessionTracker from '../../components/ui/StudySessionTracker'
import './Dashboard.css'
import "tailwindcss";

const Dashboard = () => {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [userModules, setUserModules] = useState([])
  const [totalStudyHours, setTotalStudyHours] = useState(0)
  const [showStudyTracker, setShowStudyTracker] = useState(false)
  const [studyEvents, setStudyEvents] = useState([])
  const [userProfile, setUserProfile] = useState({})
  const [recommendedTests, setRecommendedTests] = useState([])
  const [savedTestResults, setSavedTestResults] = useState([])
  const [availableStudyFields, setAvailableStudyFields] = useState([])

  // Function to load events
  const loadEvents = () => {
    const events = loadStudyEvents()
    if (events.length > 0) {
      const eventsWithDates = events
        .map(event => ({
          ...event,
          date: new Date(event.date)
        }))
        .filter(event => event.date instanceof Date && !isNaN(event.date.getTime()))
      setStudyEvents(eventsWithDates)
    } else {
      setStudyEvents([])
    }
  }

  // Load user modules and calculate study hours on component mount
  useEffect(() => {
    // Load user profile
    const profile = loadUserProfile()
    setUserProfile(profile)
    
    // Load saved test results
    const results = loadTestResults()
    setSavedTestResults(results)
    
    // Fetch user modules from backend API
    const fetchModules = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found. User must be logged in to see materials.');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/materials/documents`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch materials');
        }

        const data = await response.json();
        const formattedModules = data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          category: doc.category_id,
          tags: doc.tags || [],
          fileName: doc.file_name,
          fileSize: doc.file_size,
          fileType: doc.file_type,
          uploadDate: doc.upload_date,
          lastAccessed: doc.last_accessed,
          bookmarked: doc.bookmarked,
          fileUrl: doc.file_url,
        }));
        setUserModules(formattedModules);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchModules();

    // Load available study fields
    setAvailableStudyFields(getAvailableStudyFields())
    
    // Calculate total study hours
    const hours = calculateTotalStudyHours('all')
    setTotalStudyHours(hours)

    // Load study events
    loadEvents()

    // Get tests from the mock tests component
    // This is a simplified version - in a real app, you'd use a shared service
    const allTests = [
      {
        id: 1,
        title: 'Mathematics Mock Test - Calculus',
        subject: 'Mathematics',
        difficulty: 'Medium',
      },
      {
        id: 2,
        title: 'Physics Comprehensive Test',
        subject: 'Physics',
        difficulty: 'Hard',
      },
      {
        id: 3,
        title: 'Computer Science Quiz',
        subject: 'Computer Science',
        difficulty: 'Easy',
      }
    ]
    
    // Filter tests based on user's study fields
    if (profile.studyFields && profile.studyFields.length > 0) {
      const filtered = allTests.filter(test => {
        const testSubjectId = test.subject.toLowerCase().replace(/\s+/g, '_')
        return profile.studyFields.includes(testSubjectId)
      })
      setRecommendedTests(filtered.slice(0, 2)) // Show only 2 recommended tests
    }
  }, [])

  // Add interval to check for updated events every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadEvents()
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }
    setNotifications(prev => [...prev, notification])

    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 3000)
  }

  const handleContinueCourse = (courseTitle) => {
    addNotification(`Continuing ${courseTitle}...`, 'success')
    // Simulate progress update
    setTimeout(() => {
      setCourseProgress(prev => ({
        ...prev,
        [courseTitle]: Math.min(prev[courseTitle] + 5, 100)
      }))
      addNotification(`Progress updated for ${courseTitle}!`, 'success')
    }, 1000)
  }

  const handleQuickAction = (action) => {
    const actions = {
      'Schedule Study': () => {
        addNotification('Redirecting to Study Planner...', 'info')
        setTimeout(() => navigate('/planner'), 1000)
      },
      'Find Mentor': () => {
        addNotification('Redirecting to Mentorship...', 'info')
        setTimeout(() => navigate('/mentorship'), 1000)
      },
      'Take Test': () => {
        addNotification('Redirecting to Mock Tests...', 'info')
        setTimeout(() => navigate('/tests'), 1000)
      },
      'View Progress': () => {
        addNotification('Redirecting to Progress Tracker...', 'info')
        setTimeout(() => navigate('/progress'), 1000)
      }
    }

    if (actions[action]) {
      actions[action]()
    }
  }

  const handleEventAction = (eventTitle) => {
    addNotification(`Reminder set for ${eventTitle}`, 'success')
  }
  // Helper function to get file icon
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return FileText
    if (fileType.includes('video')) return Video
    if (fileType.includes('image')) return Image
    if (fileType.includes('audio')) return Music
    if (fileType.includes('zip') || fileType.includes('rar')) return Archive
    return File
  }

  const [stats, setStats] = useState([])

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.error('No auth token found. User must be logged in to fetch dashboard stats.')
        return
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats')
        }

        const data = await response.json()

        const mappedStats = [
          {
            name: 'Materials Uploaded',
            value: data.total_material_uploads.toString(),
            change: `${data.uploaded_this_week} this week`,
            icon: BookOpen,
            color: 'bg-blue-500',
          },
          {
            name: 'Study Hours',
            value: data.total_study_hours,
            change: data.study_time_difference_this_week,
            icon: Clock,
            color: 'bg-green-500',
          },
          {
            name: 'Bookmarked',
            value: data.total_bookmarked_materials.toString(),
            change: 'Important materials',
            icon: TrendingUp,
            color: 'bg-purple-500',
          },
          {
            name: 'Categories',
            value: data.total_material_categories.toString(),
            change: 'Different subjects',
            icon: Target,
            color: 'bg-orange-500',
          },
        ]

        setStats(mappedStats)
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      }
    }

    fetchDashboardStats()
  }, [])

  // Get recent user modules (last 3 uploaded or accessed)
  const recentModules = userModules
    .sort((a, b) => {
      const dateA = new Date(a.lastAccessed || a.uploadDate)
      const dateB = new Date(b.lastAccessed || b.uploadDate)
      return dateB - dateA
    })
    .slice(0, 3)

  // Helper function to get event type icon
  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'study': return <MdSchool size={16} />
      case 'assignment': return <MdAssignment size={16} />
      case 'exam': return <MdQuiz size={16} />
      case 'preparation': return <MdScience size={16} />
      default: return <MdEvent size={16} />
    }
  }

  // Get upcoming events from study events
  const getUpcomingEvents = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Start of today
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days from today

    return studyEvents
      .filter(event => {
        const eventDate = event.date
        if (!eventDate || !(eventDate instanceof Date) || isNaN(eventDate.getTime())) return false
        
        const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
        return eventDay >= today && eventDay < nextWeek
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3)
      .map(event => {
        const eventDate = new Date(event.date)
        const todayDate = new Date()
        const tomorrowDate = new Date()
        tomorrowDate.setDate(todayDate.getDate() + 1)

        const isToday = eventDate.toDateString() === todayDate.toDateString()
        const isTomorrow = eventDate.toDateString() === tomorrowDate.toDateString()

        let timeDisplay = ''
        if (isToday) {
          timeDisplay = `Today, ${event.time.split(' - ')[0]}`
        } else if (isTomorrow) {
          timeDisplay = `Tomorrow, ${event.time.split(' - ')[0]}`
        } else {
          timeDisplay = `${eventDate.toLocaleDateString('en-US', { weekday: 'long' })}, ${event.time.split(' - ')[0]}`
        }

        return {
          title: event.title,
          time: timeDisplay,
          type: event.type || 'study',
          subject: event.subject,
          priority: event.priority
        }
      })
  }

  const upcomingEvents = getUpcomingEvents()

  const todaysEvents = studyEvents.filter(event => {
    const eventDate = event.date
    if (!eventDate || !(eventDate instanceof Date) || isNaN(eventDate.getTime())) return false

    const today = new Date()
    return new Date(event.date).toDateString() === today.toDateString()
  })

  // Function to filter test scores based on user's field of study
  const getRelevantTestScores = () => {
    // If no user profile or field of study, return empty array
    if (!userProfile || !userProfile.fieldOfStudy) {
      return []
    }
    
    // Get user's field and subfields
    const fieldOfStudy = userProfile.fieldOfStudy
    const subFields = userProfile.subFieldsOfStudy || []
    
    // Filter test scores based on field and subfields
    const relevantScores = []
    
    // Map field IDs to subject names (this should be more robust in a real app)
    const fieldToSubjectMap = {
      'science': ['Physics', 'Chemistry', 'Biology'],
      'mathematics': ['Mathematics', 'Statistics', 'Calculus'],
      'engineering': ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering'],
      'medical': ['Anatomy', 'Physiology', 'Biochemistry'],
      'business': ['Economics', 'Finance', 'Marketing']
    }
    
    // Get relevant subjects based on user's field and subfields
    const relevantSubjects = fieldToSubjectMap[fieldOfStudy] || []
    
    // Filter test scores to only include relevant subjects
    savedTestResults.forEach(result => {
      if (relevantSubjects.includes(result.subject)) {
        // Check if we already have this subject
        const existingScore = relevantScores.find(score => score.subject === result.subject)
        
        if (existingScore) {
          // Update existing score if this result is newer
          if (new Date(result.date) > new Date(existingScore.date)) {
            existingScore.score = result.score
            existingScore.change = result.change
            existingScore.date = result.date
          }
        } else {
          // Add new score
          relevantScores.push({
            subject: result.subject,
            score: result.score,
            change: result.change || 0,
            date: result.date
          })
        }
      }
    })
    
    return relevantScores
  }

  return (
    <div className="dashboard-page">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="dashboard-notifications">
          {notifications.map((notification) => (
            <div key={notification.id} className={`dashboard-notification ${notification.type}`}>
              <span>{notification.message}</span>
              <span className="notification-time">{notification.timestamp}</span>
            </div>
          ))}
        </div>
      )}

      {/* Welcome Section */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <h1 className="welcome-title">Welcome back !</h1>
          <p className="welcome-subtitle">
            Ready to continue your learning journey? You have {todaysEvents.length} upcoming {todaysEvents.length === 1 ? 'event' : 'events'} today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.name} className="stat-card">
              <div className="stat-header">
                <div className={`stat-icon ${stat.color}`}>
                  <Icon size={24} color="white" />
                </div>
                <span className="stat-value">{stat.value}</span>
              </div>
              <div>
                <p className="stat-label">{stat.name}</p>
                <p className="stat-change">{stat.change}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="content-grid">
        {/* Recent Materials */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Materials</h2>
            <p className="card-subtitle">Your recently uploaded or accessed content</p>
          </div>
          <div className="card-content">
            {recentModules.length === 0 ? (
              <div className="empty-recent-materials">
                <BookOpen size={48} color="var(--teams-text-muted)" />
                <p>No materials uploaded yet</p>
                <button
                  className="action-btn primary"
                  onClick={() => navigate('/my-materials')}
                >
                  Upload Your First Material
                </button>
              </div>
            ) : (
              recentModules.map((module) => {
                const Icon = getFileIcon(module.fileType)
                return (
                  <div key={module.id} className="course-item">
                    <div className="course-info">
                      <div className="course-icon">
                        <Icon size={24} color="white" />
                      </div>
                      <div className="course-details">
                        <h3>{module.title}</h3>
                        <p>{typeof module.category === 'string' ? module.category.charAt(0).toUpperCase() + module.category.slice(1) : ''}</p>
                        <p>Uploaded: {new Date(module.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="course-actions">
                      <div className="progress-info">
                        <p className="progress-value">{module.bookmarked ? '⭐' : ' '}</p>
                        <div className="file-size-info">
                          <span>{(module.fileSize / (1024 * 1024)).toFixed(1)} MB</span>
                        </div>
                      </div>
                      <button
                        className="play-button"
                        onClick={() => navigate('/my-materials')}
                        title={`View ${module.title}`}
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Upcoming Events</h2>
            <p className="card-subtitle">Your schedule for the next 7 days</p>
          </div>
          <div className="card-content">
            {upcomingEvents.length > 0 ? (
              <div className="upcoming-events-list">
                {upcomingEvents.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="upcoming-event-card">
                    <div className="event-priority-indicator">
                      <div
                        className={`priority-dot priority-${event.priority || 'medium'}`}
                        title={`${event.priority || 'medium'} priority`}
                      ></div>
                    </div>
                    <div className="event-content">
                      <div className="event-header">
                        <h4 className="event-title">{event.title}</h4>
                        <span className={`event-type-badge ${event.type}`}>
                          {getEventTypeIcon(event.type)}
                        </span>
                      </div>
                      <div className="event-meta">
                        <span className="event-time">
                          <MdAccessTime size={14} />
                          {event.time}
                        </span>
                        {event.subject && (
                          <span className="event-subject">
                            <MdBook size={14} />
                            {event.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="event-actions">
                      <button
                        className="event-action-btn"
                        onClick={() => handleEventAction(event.title)}
                        title="Set reminder"
                      >
                        <Bell size={14} />
                      </button>
                      <button
                        className="event-action-btn"
                        onClick={() => navigate('/study-planner')}
                        title="View in planner"
                      >
                        <MdCalendarToday size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-events">
                <div className="empty-events-icon">
                  <Calendar size={48} />
                </div>
                <h4>No upcoming events</h4>
                <p>You don't have any events scheduled for the next 7 days</p>
                <button
                  className="action-btn primary"
                  onClick={() => navigate('/planner')}
                >
                  <Calendar size={16} />
                  Schedule Your First Event
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="card-content">
          <div className="quick-actions">
            <button
              className="action-btn primary"
              onClick={() => setShowStudyTracker(true)}
            >
              <div className="action-icon">
                <Clock size={24} color="white" />
              </div>
              <span className="action-label">Study Session</span>
            </button>
            <button
              className="action-btn primary"
              onClick={() => handleQuickAction('Schedule Study')}
            >
              <div className="action-icon">
                <Calendar size={24} color="white" />
              </div>
              <span className="action-label">Schedule Study</span>
            </button>
            <button
              className="action-btn primary"
              onClick={() => handleQuickAction('Find Mentor')}
            >
              <div className="action-icon">
                <Users size={24} color="white" />
              </div>
              <span className="action-label">Find Mentor</span>
            </button>
            <button
              className="action-btn primary"
              onClick={() => handleQuickAction('Take Test')}
            >
              <div className="action-icon">
                <Award size={24} color="white" />
              </div>
              <span className="action-label">Take Test</span>
            </button>
            <button
              className="action-btn primary"
              onClick={() => handleQuickAction('View Progress')}
            >
              <div className="action-icon">
                <TrendingUp size={24} color="white" />
              </div>
              <span className="action-label">View Progress</span>
            </button>
          </div>
        </div>
      </div>

      {/* Study Session Tracker Modal */}
      <StudySessionTracker
        isOpen={showStudyTracker}
        onClose={() => {
          setShowStudyTracker(false)
          // Refresh study hours after session
          const hours = calculateTotalStudyHours('all')
          setTotalStudyHours(hours)
        }}
      />

      {/* Test Performance Section */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Test Performance</h2>
          <p className="card-subtitle">Your recent test scores in your field of study</p>
        </div>
        
        {/* Show empty state if no relevant test scores */}
        {getRelevantTestScores().length === 0 ? (
          <div className="empty-state">
            <TrendingUp size={48} className="empty-icon" />
            <h3>No test scores yet</h3>
            <p>Complete some tests in your field to see your performance here</p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/mock-tests'}
            >
              Take a Test
            </button>
          </div>
        ) : (
          <div className="score-cards">
            {getRelevantTestScores().map((score, index) => (
              <div key={index} className="score-card">
                <div className="score-change">
                  {score.change > 0 ? '+' : ''}{score.change}%
                </div>
                <h3 className="score-subject">{score.subject}</h3>
                <div className="score-value">{score.score}%</div>
                <div className="score-label">Average Score</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Tests */}
      {recommendedTests.length > 0 && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2 className="card-title">Recommended Tests</h2>
            <p className="card-subtitle">Based on your study fields</p>
          </div>
          <div className="card-content">
            <div className="recommended-tests">
              {recommendedTests.map(test => (
                <div key={test.id} className="recommended-test-card">
                  <div className="test-info">
                    <h3>{test.title}</h3>
                    <div className="test-meta">
                      <span className="test-subject">{test.subject}</span>
                      <span className={`test-difficulty ${test.difficulty.toLowerCase()}`}>
                        {test.difficulty}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => window.location.href = `/mock-tests?test=${test.id}`}
                  >
                    Take Test
                  </button>
                </div>
              ))}
            </div>
            <div className="card-footer">
              <a href="/mock-tests" className="view-all-link">
                View all tests <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
