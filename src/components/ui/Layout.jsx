import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import UserProfile from './UserProfile'
import { getUserDisplayInfo } from '../../utils/localStorage'
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
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Assignment Due', message: 'Calculus homework due tomorrow', time: '2 hours ago', unread: true },
    { id: 2, title: 'New Course Available', message: 'Advanced React Development', time: '1 day ago', unread: true },
    { id: 3, title: 'Study Reminder', message: 'Time for your daily study session', time: '2 days ago', unread: false }
  ])

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

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId
          ? { ...notif, unread: false }
          : notif
      )
    )
  }

  const clearAllNotifications = () => {
    setNotifications([])
    setShowNotifications(false)
  }

  const unreadCount = notifications.filter(n => n.unread).length

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Materials', href: '/my-materials', icon: BookOpen },
    { name: 'Study Planner', href: '/planner', icon: Calendar },
    { name: 'Progress Tracker', href: '/progress', icon: TrendingUp },
    { name: 'Mock Tests', href: '/tests', icon: FileText },
    { name: 'Mentorship', href: '/mentorship', icon: Users },
    { name: 'Chat', href: '/chat', icon: MessageCircle },
    { name: 'Career', href: '/career', icon: Briefcase },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Bot },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

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
              <div className="logo-subtitle">Learning Hub</div>
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
                  {unreadCount > 0 && (
                    <span className="header-notification-badge">{unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notifications-dropdown">
                    <div className="notifications-header">
                      <h3>Notifications</h3>
                      {notifications.length > 0 && (
                        <button
                          className="clear-all-btn"
                          onClick={clearAllNotifications}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                    <div className="notifications-list">
                      {notifications.length === 0 ? (
                        <div className="no-notifications">
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            onClick={() => markNotificationAsRead(notification.id)}
                            style={{
                              backgroundColor: notification.unread ? 'rgba(98, 100, 167, 0.1)' : 'transparent',
                              padding: '16px 20px',
                              borderBottom: '1px solid var(--teams-border)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              position: 'relative',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = 'var(--teams-hover)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = notification.unread ? 'rgba(98, 100, 167, 0.1)' : 'transparent'
                            }}
                          >
                            <div style={{
                              flex: 1,
                              minWidth: 0,
                              display: 'block'
                            }}>
                              <h4 style={{
                                color: 'var(--teams-text-primary)',
                                fontSize: '14px',
                                fontWeight: '600',
                                margin: '0 0 4px 0',
                                lineHeight: '1.3'
                              }}>
                                {notification.title}
                              </h4>
                              <p style={{
                                color: 'var(--teams-text-secondary)',
                                fontSize: '13px',
                                margin: '0 0 4px 0',
                                lineHeight: '1.4'
                              }}>
                                {notification.message}
                              </p>
                              <span style={{
                                color: 'var(--teams-text-muted)',
                                fontSize: '12px',
                                lineHeight: '1.2'
                              }}>
                                {notification.time}
                              </span>
                            </div>
                            {notification.unread && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#6264a7',
                                borderRadius: '50%',
                                flexShrink: 0,
                                marginTop: '6px'
                              }}></div>
                            )}
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



