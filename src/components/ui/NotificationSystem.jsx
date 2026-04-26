import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X, Bell } from 'lucide-react'
import { onNotificationReceived } from '../../utils/socket'
import './NotificationSystem.css'

// Notification Context
const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [appNotifications, setAppNotifications] = useState([])
  const [appUnreadCount, setAppUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAppNotifications(data.notifications || [])
        setAppUnreadCount((data.notifications || []).filter(n => !n.read).length)
      }
    } catch (err) {
      console.error("Error fetching app notifications:", err)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    onNotificationReceived((notification) => {
      setAppNotifications(prev => [notification, ...prev])
      setAppUnreadCount(prev => prev + 1)
      // Also show a toast for the new persistent notification
      showInfo(notification.message, notification.title || 'New Notification')
    })
  }, [fetchNotifications])

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      if (!token) return

      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      setAppNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setAppUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Error marking as read", err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token')
      if (!token) return

      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/notifications/read-all`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      setAppNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setAppUnreadCount(0)
    } catch (err) {
      console.error("Error marking all as read", err)
    }
  }

  const addNotification = (notificationObjOrMessage, typeIfString) => {
    const options = typeof notificationObjOrMessage === 'string'
      ? { message: notificationObjOrMessage, type: typeIfString || 'info' }
      : notificationObjOrMessage;

    const id = Date.now()
    const newNotification = {
      id,
      type: 'info', // 'success', 'error', 'warning', 'info'
      title: '',
      message: '',
      duration: 5000, // 5 seconds default
      ...options
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Predefined notification types
  const showSuccess = (message, title = 'Success') => {
    return addNotification({ type: 'success', title, message })
  }

  const showError = (message, title = 'Error') => {
    return addNotification({ type: 'error', title, message, duration: 7000 })
  }

  const showWarning = (message, title = 'Warning') => {
    return addNotification({ type: 'warning', title, message, duration: 6000 })
  }

  const showInfo = (message, title = 'Info') => {
    return addNotification({ type: 'info', title, message })
  }

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    appNotifications,
    appUnreadCount,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

// Notification Container Component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Individual Notification Component
const NotificationItem = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(onRemove, 300) // Wait for exit animation
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle size={20} />
      case 'error':
        return <AlertCircle size={20} />
      case 'warning':
        return <AlertCircle size={20} />
      case 'info':
      default:
        return <Info size={20} />
    }
  }

  return (
    <div 
      className={`notification-item ${notification.type} ${isVisible ? 'visible' : ''} ${isRemoving ? 'removing' : ''}`}
    >
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        {notification.title && (
          <div className="notification-title">{notification.title}</div>
        )}
        <div className="notification-message">{notification.message}</div>
      </div>

      <button 
        className="notification-close"
        onClick={handleRemove}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// Hook for common notification patterns
export const useCommonNotifications = () => {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications()

  const notifySessionBooked = (mentorName, date, time) => {
    showSuccess(
      `Your session with ${mentorName} has been booked for ${date} at ${time}`,
      'Session Booked!'
    )
  }

  const notifyTestCompleted = (score, testName) => {
    const message = `You scored ${score}% on ${testName}`
    if (score >= 80) {
      showSuccess(message, 'Great Job!')
    } else if (score >= 60) {
      showWarning(message, 'Good Effort!')
    } else {
      showInfo(message, 'Keep Practicing!')
    }
  }

  const notifyStudyGoalCompleted = (goalName) => {
    showSuccess(`Congratulations! You've completed "${goalName}"`, 'Goal Achieved!')
  }

  const notifyEventAdded = (eventName, date) => {
    showSuccess(`"${eventName}" has been added to your schedule for ${date}`, 'Event Added!')
  }

  const notifyGroupJoined = (groupName) => {
    showSuccess(`You've successfully joined "${groupName}"`, 'Welcome to the Group!')
  }

  const notifyError = (message) => {
    showError(message, 'Something went wrong')
  }

  const notifyNetworkError = () => {
    showError('Please check your internet connection and try again', 'Connection Error')
  }

  const notifyFormValidationError = (field) => {
    showWarning(`Please check the ${field} field`, 'Validation Error')
  }

  const notifyDataSaved = () => {
    showSuccess('Your changes have been saved successfully', 'Saved!')
  }

  const notifyFeatureComingSoon = (feature) => {
    showInfo(`${feature} feature is coming soon!`, 'Stay Tuned')
  }

  const notifyModuleUploaded = (title, date) => {
    showSuccess(`"${title}" has been uploaded successfully on ${date}`, 'Material Uploaded!')
  }

  return {
    notifySessionBooked,
    notifyTestCompleted,
    notifyStudyGoalCompleted,
    notifyEventAdded,
    notifyGroupJoined,
    notifyError,
    notifyNetworkError,
    notifyFormValidationError,
    notifyDataSaved,
    notifyFeatureComingSoon,
    notifyModuleUploaded
  }
}

export default NotificationProvider
