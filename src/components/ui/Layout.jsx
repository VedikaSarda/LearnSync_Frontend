import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UserProfile from './UserProfile'
import { getUserDisplayInfo } from '../../utils/localStorage'
import { getCurrentUser } from '../../utils/auth'
import { useNotifications } from './NotificationSystem'
import './Layout.css'
import {
  Home,
  BookOpen,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  MessageCircle,
  Briefcase,
  Bot,
  Settings,
  Search,
  Bell,
  CalendarDays,
  Menu,
  X
} from 'lucide-react'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [userDisplayInfo, setUserDisplayInfo] = useState({})
  
  const { 
    appNotifications, 
    appUnreadCount, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications()

  // Load user display info on component mount and listen for updates
  useEffect(() => {
    const updateUserInfo = () => {
      setUserDisplayInfo(getUserDisplayInfo())
    }

    updateUserInfo()

    // Listen for user profile updates
    window.addEventListener('userProfileUpdated', updateUserInfo)

    return () => {
      window.removeEventListener('userProfileUpdated', updateUserInfo)
    }
  }, [])
  const location = useLocation()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Simulate search functionality
      alert(`Searching for: "${searchQuery}"`)
      setSearchQuery('')
    }
  }

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications)
  }

  const currentUser = getCurrentUser()
  const isMentor = currentUser?.role === 'mentor'

  const studentNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Materials', href: '/my-materials', icon: BookOpen },
    { name: 'Study Planner', href: '/planner', icon: Calendar },
    { name: 'Progress Tracker', href: '/progress', icon: TrendingUp },
    { name: 'Mentorship', href: '/mentorship', icon: Users },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Career', href: '/career', icon: Briefcase },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const mentorNavigation = [
    { name: 'Dashboard', href: '/mentor/dashboard', icon: Home },
    { name: 'My Students', href: '/mentor/students', icon: Users },
    { name: 'Sessions', href: '/mentor/sessions', icon: Calendar },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Progress Tracking', href: '/mentor/progress', icon: TrendingUp },
    { name: 'AI Insights', href: '/mentor/ai-insights', icon: Bot },
    { name: 'Profile Settings', href: '/mentor/profile', icon: Settings },
  ]

  const navigation = isMentor ? mentorNavigation : studentNavigation

  return (
    <div className="layout-container">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-header-left">
            <div className="logo teams-gradient">
              <BookOpen size={20} color="white" />
            </div>
            <div>
              <div className="logo-text">PLM</div>
              <div className="logo-subtitle">{isMentor ? 'Mentor Hub' : 'Learning Hub'}</div>
            </div>
          </div>
          <button
            className="header-button mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="nav-icon" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        <div className="user-profile" onClick={() => setShowUserProfile(true)}>
          <div className="user-avatar">{userDisplayInfo.initials || 'U'}</div>
          <div className="header-user-info">
            <h4> {userDisplayInfo.username || 'User'}</h4>
            <p>{userDisplayInfo.email || 'Student'}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              onClick={() => setSidebarOpen(true)}
              className="header-action-btn mobile-menu-btn"
            >
              <Menu size={20} />
            </button>



            {/* Search bar */}
            <form className="header-search" onSubmit={handleSearch}>
              <Search className="header-search-icon" size={18} />
              <input
                type="text"
                placeholder="Search materials, mentors, resources..."
                className="header-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="header-right">
            <div className="header-actions">
              <button
                className="header-action-btn"
                onClick={() => alert('Calendar feature coming soon!')}
                title="Calendar"
              >
                <CalendarDays size={20} />
              </button>

              <div className="header-notification-container">
                <button
                  className="header-action-btn"
                  onClick={handleNotificationClick}
                  title="Notifications"
                >
                  <Bell size={20} />
                  {appUnreadCount > 0 && (
                    <span className="header-notification-badge">{appUnreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h3>Notifications</h3>
                      {appNotifications.length > 0 && (
                        <button
                          className="clear-all-btn"
                          onClick={() => {
                            markAllAsRead();
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="notifications-list">
                      {appNotifications.length === 0 ? (
                        <div className="no-notifications">
                          <p>No notifications</p>
                        </div>
                      ) : (
                        appNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification.id);
                              }
                            }}
                          >
                            {!notification.read && <div className="unread-indicator" />}
                            <div className="notification-content">
                              <h4>{notification.title || 'Notification'}</h4>
                              <p>{notification.message}</p>
                              <span className="notification-time">
                                {new Date(notification.created_at || new Date()).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="header-user-profile" onClick={() => setShowUserProfile(true)}>
              <div className="header-user-avatar">{userDisplayInfo.initials || 'U'}</div>
              <div className="header-user-info">
                <div className="header-user-name">{ userDisplayInfo.username || 'User'}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* User Profile Modal */}
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </div>
  )
}

export default Layout



