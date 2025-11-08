// localStorage utility for data persistence
import { updateUserProfile } from './profile'

const STORAGE_KEYS = {
  USER_SETTINGS: 'plm_user_settings',
  USER_PROFILE: 'plm_user_profile',
  STUDY_EVENTS: 'plm_study_events',
  STUDY_SESSIONS: 'plm_study_sessions',
  BOOKED_SESSIONS: 'plm_booked_sessions',
  TEST_RESULTS: 'plm_test_results',
  BOOKMARKED_MATERIALS: 'plm_bookmarked_materials',
  NOTES: 'plm_notes',
  PROGRESS_DATA: 'plm_progress_data',
  AI_CHAT_HISTORY: 'plm_ai_chat_history',
  STUDY_GOALS: 'plm_study_goals',
  COURSE_PROGRESS: 'plm_course_progress',
  USER_MODULES: 'plm_user_modules',
  CHAT_MESSAGES: 'plm_chat_messages',
  FRIEND_REQUESTS: 'plm_friend_requests',
  FRIENDS_LIST: 'plm_friends_list',
  SUBJECT_CATEGORIES: 'plm_subject_categories'
}

// Generic localStorage functions
export const saveToStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data)
    localStorage.setItem(key, serializedData)
    return true
  } catch (error) {
    console.error('Error saving to localStorage:', error)
    return false
  }
}

export const loadFromStorage = (key, defaultValue = null) => {
  try {
    const serializedData = localStorage.getItem(key)
    if (serializedData === null || serializedData === 'undefined') {
      return defaultValue
    }
    return JSON.parse(serializedData)
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return defaultValue
  }
}

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error removing from localStorage:', error)
    return false
  }
}

export const clearAllStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}

// Auth Token
export const saveToken = (token) => {
  // The login function in auth.js sets this directly.
  // This function is for consistency.
  try {
    localStorage.setItem('authToken', token)
    return true
  } catch (error) {
    console.error('Error saving token to localStorage:', error)
    return false
  }
}

export const getToken = () => {
  try {
    // Token is stored directly as a string, not JSON.
    return localStorage.getItem('authToken')
  } catch (error) {
    console.error('Error getting token from localStorage:', error)
    return null
  }
}

export const removeToken = () => {
  try {
    localStorage.removeItem('authToken')
    return true
  } catch (error) {
    console.error('Error removing token from localStorage:', error)
    return false
  }
}

// Specific data management functions

// User Settings


// Study Events
export const saveStudyEvents = (events) => {
  return saveToStorage(STORAGE_KEYS.STUDY_EVENTS, events)
}

export const loadStudyEvents = () => {
  const events = loadFromStorage(STORAGE_KEYS.STUDY_EVENTS, [])
  return Array.isArray(events) ? events : []
}

// Booked Sessions
export const saveBookedSessions = (sessions) => {
  return saveToStorage(STORAGE_KEYS.BOOKED_SESSIONS, sessions)
}

export const loadBookedSessions = () => {
  return loadFromStorage(STORAGE_KEYS.BOOKED_SESSIONS, [])
}

// Test Results
export const saveTestResult = (testResult) => {
  const existingResults = loadTestResults()
  const updatedResults = [...existingResults, testResult]
  return saveToStorage(STORAGE_KEYS.TEST_RESULTS, updatedResults)
}

export const loadTestResults = () => {
  return loadFromStorage(STORAGE_KEYS.TEST_RESULTS, [])
}

export const getTestResultsByTestId = (testId) => {
  const allResults = loadTestResults()
  return allResults.filter(result => result.testId === testId)
}

// Bookmarked Materials
export const saveBookmarkedMaterials = (bookmarks) => {
  return saveToStorage(STORAGE_KEYS.BOOKMARKED_MATERIALS, Array.from(bookmarks))
}

export const loadBookmarkedMaterials = () => {
  const bookmarks = loadFromStorage(STORAGE_KEYS.BOOKMARKED_MATERIALS, [])
  return new Set(bookmarks)
}

// Notes
export const saveNotes = (notes) => {
  return saveToStorage(STORAGE_KEYS.NOTES, notes)
}

export const loadNotes = () => {
  return loadFromStorage(STORAGE_KEYS.NOTES, {})
}

// Progress Data
export const saveProgressData = (progressData) => {
  return saveToStorage(STORAGE_KEYS.PROGRESS_DATA, progressData)
}

export const loadProgressData = () => {
  return loadFromStorage(STORAGE_KEYS.PROGRESS_DATA, {
    weeklyHours: [],
    completedTasks: [],
    testScores: [],
    studyStreak: 0,
    totalStudyTime: 0,
    goalsCompleted: 0
  })
}

// AI Chat History
export const saveAIChatHistory = (chatHistory) => {
  return saveToStorage(STORAGE_KEYS.AI_CHAT_HISTORY, chatHistory)
}

export const loadAIChatHistory = () => {
  return loadFromStorage(STORAGE_KEYS.AI_CHAT_HISTORY, [])
}

// Study Goals
export const saveStudyGoals = (goals) => {
  return saveToStorage(STORAGE_KEYS.STUDY_GOALS, goals)
}

export const loadStudyGoals = () => {
  return loadFromStorage(STORAGE_KEYS.STUDY_GOALS, [])
}

// Course Progress
export const saveCourseProgress = (courseProgress) => {
  return saveToStorage(STORAGE_KEYS.COURSE_PROGRESS, courseProgress)
}

export const loadCourseProgress = () => {
  return loadFromStorage(STORAGE_KEYS.COURSE_PROGRESS, {})
}

// User Profile Management
export const saveUserProfile = (profile) => {
  return saveToStorage(STORAGE_KEYS.USER_PROFILE, profile)
}

export const loadUserProfile = () => {
  return loadFromStorage(STORAGE_KEYS.USER_PROFILE, null)
}

// Get available study fields with hierarchical structure
export const getAvailableStudyFields = () => {
  return [
    {
      id: 'engineering',
      name: 'Engineering',
      subFields: [
        { id: 'computer_science', name: 'Computer Science' },
        { id: 'electrical', name: 'Electrical Engineering' },
        { id: 'mechanical', name: 'Mechanical Engineering' },
        { id: 'civil', name: 'Civil Engineering' },
        { id: 'chemical', name: 'Chemical Engineering' }
      ]
    },
    {
      id: 'medical',
      name: 'Medical',
      subFields: [
        { id: 'medicine', name: 'Medicine' },
        { id: 'nursing', name: 'Nursing' },
        { id: 'pharmacy', name: 'Pharmacy' },
        { id: 'dentistry', name: 'Dentistry' },
        { id: 'physiotherapy', name: 'Physiotherapy' }
      ]
    },
    {
      id: 'business',
      name: 'Business',
      subFields: [
        { id: 'finance', name: 'Finance' },
        { id: 'marketing', name: 'Marketing' },
        { id: 'management', name: 'Management' },
        { id: 'accounting', name: 'Accounting' },
        { id: 'economics', name: 'Economics' }
      ]
    },
    {
      id: 'arts',
      name: 'Arts & Humanities',
      subFields: [
        { id: 'literature', name: 'Literature' },
        { id: 'history', name: 'History' },
        { id: 'philosophy', name: 'Philosophy' },
        { id: 'languages', name: 'Languages' },
        { id: 'fine_arts', name: 'Fine Arts' }
      ]
    },
    {
      id: 'science',
      name: 'Science',
      subFields: [
        { id: 'physics', name: 'Physics' },
        { id: 'chemistry', name: 'Chemistry' },
        { id: 'biology', name: 'Biology' },
        { id: 'mathematics', name: 'Mathematics' },
        { id: 'environmental_science', name: 'Environmental Science' }
      ]
    },
    {
      id: 'school',
      name: 'School Education',
      subFields: [
        { id: 'elementary', name: 'Elementary' },
        { id: 'middle_school', name: 'Middle School' },
        { id: 'high_school', name: 'High School' },
        { id: 'test_prep', name: 'Test Preparation' }
      ]
    }
  ]
}

// User Settings Management (separate from profile for different concerns)
export const saveUserSettings = (settings) => {
  return saveToStorage(STORAGE_KEYS.USER_SETTINGS, settings)
}

export const loadUserSettings = () => {
  return loadFromStorage(STORAGE_KEYS.USER_SETTINGS, {
    theme: 'dark',
    notifications: true,
    language: 'en',
    timezone: 'UTC',
    studyReminders: true,
    emailNotifications: false,
    pushNotifications: true,
    courseReminders: true,
    assignmentDeadlines: true,
    weeklyProgress: false,
    marketingEmails: false,
    soundEnabled: true,
    profileVisibility: 'public',
    showProgress: true,
    showAchievements: true,
    dataSharing: false,
    analyticsTracking: true,
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    compactMode: false,
    autoBackup: true,
    maxFileSize: 50,
    allowedFileTypes: ['pdf', 'doc', 'video', 'image', 'audio'],
    defaultCategory: 'general',
    autoTagging: true,
    storageLimit: 1000
  })
}

// Sync user profile data across components
export const syncUserProfile = async (profileData) => {
  // First try to update via API
  const apiResult = await updateUserProfile(profileData);
  
  if (apiResult.success) {
    // If API update successful, save the returned profile
    saveUserProfile(apiResult.profile);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('userProfileUpdated', {
      detail: apiResult.profile
    }));
    
    // Also update any cached user display info
    window.dispatchEvent(new CustomEvent('userDisplayInfoUpdated', {
      detail: getUserDisplayInfo()
    }));
    
    return apiResult.profile;
  } else {
    // Fallback to local storage if API fails
    const currentProfile = loadUserProfile();
    const updatedProfile = {
      ...currentProfile,
      ...profileData,
      lastModified: new Date().toISOString(),
      // Ensure we don't lose important metadata
      joinDate: currentProfile.joinDate || new Date().toISOString()
    };

    saveUserProfile(updatedProfile);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('userProfileUpdated', {
      detail: updatedProfile
    }));

    // Also update any cached user display info
    window.dispatchEvent(new CustomEvent('userDisplayInfoUpdated', {
      detail: getUserDisplayInfo()
    }));

    return updatedProfile;
  }
}

// Update specific profile field
export const updateProfileField = (field, value) => {
  const currentProfile = loadUserProfile()
  const updatedProfile = {
    ...currentProfile,
    [field]: value,
    lastModified: new Date().toISOString()
  }

  return syncUserProfile(updatedProfile)
}

// Validate user profile data
export const validateProfile = (profile) => {
  const errors = {}
  
  // Username validation
  if (!profile.username) {
    errors.username = 'Username is required'
  } else if (profile.username.length < 3) {
    errors.username = 'Username must be at least 3 characters'
  } else if (!/^[a-zA-Z0-9_]+$/.test(profile.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores'
  }
  
  // Email validation
  if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Get user display info for UI components
export const getUserDisplayInfo = () => {
  const profile = loadUserProfile()
  const firstName = profile.firstName || profile.first_name || ''
  const lastName = profile.lastName || profile.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const displayName = profile.displayName || fullName || profile.username || 'User'

  return {
    displayName,
    username: profile.username || '',
    initials: getInitials(displayName),
    email: profile.email,
    avatar: profile.avatar,
    isOnline: profile.isOnline
  }
}

// Helper function to get initials
const getInitials = (name) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// User Modules Management
export const saveUserModules = (modules) => {
  return saveToStorage(STORAGE_KEYS.USER_MODULES, modules)
}

export const loadUserModules = () => {
  return loadFromStorage(STORAGE_KEYS.USER_MODULES, [])
}

// Study Sessions Tracking
export const saveStudySession = (session) => {
  const existingSessions = loadStudySessions()
  const updatedSessions = [...existingSessions, {
    ...session,
    id: Date.now().toString(),
    timestamp: new Date().toISOString()
  }]
  return saveToStorage(STORAGE_KEYS.STUDY_SESSIONS, updatedSessions)
}

export const loadStudySessions = () => {
  return loadFromStorage(STORAGE_KEYS.STUDY_SESSIONS, [])
}

export const calculateTotalStudyHours = (timeframe = 'all') => {
  const sessions = loadStudySessions()
  const now = new Date()

  let filteredSessions = sessions

  if (timeframe === 'week') {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    filteredSessions = sessions.filter(session => new Date(session.timestamp) >= weekAgo)
  } else if (timeframe === 'month') {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    filteredSessions = sessions.filter(session => new Date(session.timestamp) >= monthAgo)
  } else if (timeframe === 'year') {
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    filteredSessions = sessions.filter(session => new Date(session.timestamp) >= yearAgo)
  }

  return filteredSessions.reduce((total, session) => total + (session.duration || 0), 0)
}

export const calculateStudyStreak = (studySessions = [], studyEvents = []) => {
  const allActivities = [
    ...studySessions.map(s => ({ date: s.timestamp, type: 'session' })),
    ...studyEvents.map(e => ({ date: e.date, type: 'event' }))
  ]

  if (allActivities.length === 0) return 0

  // Sort by date descending
  allActivities.sort((a, b) => new Date(b.date) - new Date(a.date))

  let streak = 0
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  for (const activity of allActivities) {
    const activityDate = new Date(activity.date)
    activityDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((currentDate - activityDate) / (1000 * 60 * 60 * 24))

    if (daysDiff === streak) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (daysDiff > streak) {
      break
    }
  }

  return streak
}

// Subject Categories Management
export const saveSubjectCategories = (categories) => {
  return saveToStorage(STORAGE_KEYS.SUBJECT_CATEGORIES, categories)
}

export const loadSubjectCategories = () => {
  return loadFromStorage(STORAGE_KEYS.SUBJECT_CATEGORIES, [
    { id: 'mathematics', name: 'Mathematics', color: '#6366f1', icon: 'Calculator' },
    { id: 'science', name: 'Science', color: '#10b981', icon: 'Atom' },
    { id: 'literature', name: 'Literature', color: '#f59e0b', icon: 'BookOpen' },
    { id: 'history', name: 'History', color: '#ef4444', icon: 'Clock' },
    { id: 'languages', name: 'Languages', color: '#8b5cf6', icon: 'Globe' },
    { id: 'technology', name: 'Technology', color: '#06b6d4', icon: 'Monitor' },
    { id: 'arts', name: 'Arts', color: '#ec4899', icon: 'Palette' },
    { id: 'general', name: 'General', color: '#6b7280', icon: 'FileText' }
  ])
}

// Chat Management
export const saveChatMessages = (messages) => {
  return saveToStorage(STORAGE_KEYS.CHAT_MESSAGES, messages)
}

export const loadChatMessages = () => {
  return loadFromStorage(STORAGE_KEYS.CHAT_MESSAGES, [])
}

export const addChatMessage = (message) => {
  const existingMessages = loadChatMessages()
  const newMessage = {
    ...message,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    status: 'sent'
  }
  const updatedMessages = [...existingMessages, newMessage]
  saveChatMessages(updatedMessages)
  return newMessage
}

// Friends Management
export const saveFriendsList = (friends) => {
  return saveToStorage(STORAGE_KEYS.FRIENDS_LIST, friends)
}

export const loadFriendsList = () => {
  const defaultFriends = [
    {
      username: 'sarah_math',
      displayName: 'Sarah Johnson',
      bio: 'Math enthusiast',
      studyPreferences: ['Mathematics', 'Physics'],
      addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      status: 'online',
      lastActive: new Date().toISOString()
    }
  ]

  // Check if we need to reset with new data structure
  const stored = loadFromStorage(STORAGE_KEYS.FRIENDS_LIST, null)
  if (!stored || (stored.length > 0 && !stored[0].displayName)) {
    // Reset with new structure
    saveToStorage(STORAGE_KEYS.FRIENDS_LIST, defaultFriends)
    return defaultFriends
  }

  return stored.length === 0 ? defaultFriends : stored
}

export const saveFriendRequests = (requests) => {
  return saveToStorage(STORAGE_KEYS.FRIEND_REQUESTS, requests)
}

export const loadFriendRequests = () => {
  const defaultRequests = [
    {
      id: 'req_1',
      from: 'alex_science',
      fromDisplayName: 'Alex Chen',
      fromBio: 'Science lover',
      fromStudyPreferences: ['Chemistry', 'Biology'],
      to: 'current_user',
      timestamp: new Date().toISOString(),
      status: 'pending'
    }
  ]

  // Check if we need to reset with new data structure
  const stored = loadFromStorage(STORAGE_KEYS.FRIEND_REQUESTS, null)
  if (!stored || (stored.length > 0 && !stored[0].fromDisplayName)) {
    // Reset with new structure
    saveToStorage(STORAGE_KEYS.FRIEND_REQUESTS, defaultRequests)
    return defaultRequests
  }

  return stored.length === 0 ? defaultRequests : stored
}

export const sendFriendRequest = (toUsername, toUserInfo = {}) => {
  const currentUser = loadUserProfile()
  const existingRequests = loadFriendRequests()

  const newRequest = {
    id: Date.now().toString(),
    from: currentUser.username,
    fromDisplayName: currentUser.displayName || currentUser.username,
    fromBio: currentUser.bio || '',
    fromStudyPreferences: currentUser.studyPreferences || [],
    to: toUsername,
    toDisplayName: toUserInfo.displayName || toUsername,
    toBio: toUserInfo.bio || '',
    toStudyPreferences: toUserInfo.studyPreferences || [],
    timestamp: new Date().toISOString(),
    status: 'pending'
  }
  const updatedRequests = [...existingRequests, newRequest]
  saveFriendRequests(updatedRequests)
  return newRequest
}

export const respondToFriendRequest = async (requestId, action) => {
  const token = getToken()
  if (!token) {
    return { success: false, message: 'User not authenticated' }
  }

  if (!requestId) {
    return { success: false, message: 'Invalid or missing friendship ID' }
  }

  try {
    const response = await fetch(`/api/chat/friend-requests/respond/${requestId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action })
    })

    const data = await response.json()

    if (response.ok) {
      // Update local storage on success
      const requests = loadFriendRequests()
      const updatedRequests = requests.filter(r => r.id !== requestId)
      saveFriendRequests(updatedRequests)

      if (action === 'accept') {
        const friends = loadFriendsList()
        const request = requests.find(r => r.id === requestId)
        if (request) {
          const newFriend = {
            username: request.from,
            displayName: request.fromDisplayName || request.from,
            bio: request.fromBio || '',
            studyPreferences: request.fromStudyPreferences || [],
            addedDate: new Date().toISOString(),
            status: 'online',
            lastActive: new Date().toISOString()
          }
          const updatedFriends = [...friends, newFriend]
          saveFriendsList(updatedFriends)
        }
      }
      return { success: true, message: data.message }
    } else {
      return { success: false, message: data.message || 'An error occurred' }
    }
  } catch (error) {
    console.error('Error responding to friend request:', error)
    return { success: false, message: 'A network error occurred. Please check your connection.' }
  }
}

// Reset friends data with new structure (for development/testing)
export const resetFriendsData = () => {
  removeFromStorage(STORAGE_KEYS.FRIENDS_LIST)
  removeFromStorage(STORAGE_KEYS.FRIEND_REQUESTS)
  // This will trigger the default data to be loaded
  loadFriendsList()
  loadFriendRequests()
}

// Utility functions for data migration and cleanup
export const migrateData = () => {
  // Function to handle data migration between app versions
  const version = loadFromStorage('app_version', '1.0.0')
  
  // Add migration logic here as needed
  if (version === '1.0.0') {
    // Perform any necessary data transformations
    saveToStorage('app_version', '1.1.0')
  }
}

export const getStorageUsage = () => {
  let totalSize = 0
  const usage = {}
  
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const data = localStorage.getItem(key)
    const size = data ? new Blob([data]).size : 0
    usage[name] = size
    totalSize += size
  })
  
  return {
    total: totalSize,
    breakdown: usage,
    totalMB: (totalSize / (1024 * 1024)).toFixed(2)
  }
}

export const exportUserData = () => {
  const userData = {}
  
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const data = loadFromStorage(key)
    if (data !== null) {
      userData[name] = data
    }
  })
  
  return {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    data: userData
  }
}

export const importUserData = (importData) => {
  try {
    if (!importData.data) {
      throw new Error('Invalid import data format')
    }
    
    Object.entries(importData.data).forEach(([name, data]) => {
      const key = STORAGE_KEYS[name]
      if (key) {
        saveToStorage(key, data)
      }
    })
    
    return true
  } catch (error) {
    console.error('Error importing user data:', error)
    return false
  }
}

export default {
  saveToStorage,
  loadFromStorage,
  removeFromStorage,
  clearAllStorage,
  saveUserSettings,
  loadUserSettings,
  saveStudyEvents,
  loadStudyEvents,
  saveBookedSessions,
  loadBookedSessions,
  saveTestResult,
  loadTestResults,
  getTestResultsByTestId,
  saveBookmarkedMaterials,
  loadBookmarkedMaterials,
  saveNotes,
  loadNotes,
  saveProgressData,
  loadProgressData,
  saveAIChatHistory,
  loadAIChatHistory,
  saveStudyGoals,
  loadStudyGoals,
  saveCourseProgress,
  loadCourseProgress,
  migrateData,
  getStorageUsage,
  exportUserData,
  importUserData
}
