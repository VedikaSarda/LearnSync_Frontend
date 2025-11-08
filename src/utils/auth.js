// Authentication utilities for login, register, and session management

const AUTH_STORAGE_KEYS = {
  USER_SESSION: 'plm_user_session',
  USER_CREDENTIALS: 'plm_user_credentials',
  REMEMBER_ME: 'plm_remember_me',
  LAST_LOGIN: 'plm_last_login'
}

// Mock user database (in a real app, this would be handled by a backend)
const MOCK_USERS = [
  {
    id: '1',
    email: 'demo@example.com',
    password: 'Password123', // In real app, this would be hashed
    firstName: 'Demo',
    lastName: 'User',
    createdAt: new Date().toISOString(),
    isActive: true
  }
]

// Session management
export const createUserSession = (user, rememberMe = false) => {
  const session = {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      display_name: `${user.firstName} ${user.lastName}`,
      isActive: user.isActive
    },
    loginTime: new Date().toISOString(),
    expiresAt: rememberMe 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    rememberMe
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.USER_SESSION, JSON.stringify(session))
  localStorage.setItem(AUTH_STORAGE_KEYS.LAST_LOGIN, new Date().toISOString())
  
  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_ME, 'true')
  }

  return session
}

export const getUserSession = () => {
  try {
    const sessionData = localStorage.getItem(AUTH_STORAGE_KEYS.USER_SESSION)
    if (!sessionData) return null

    const session = JSON.parse(sessionData)
    
    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      clearUserSession()
      return null
    }

    return session
  } catch (error) {
    console.error('Error getting user session:', error)
    clearUserSession()
    return null
  }
}

export const clearUserSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER_SESSION)
  localStorage.removeItem(AUTH_STORAGE_KEYS.USER_CREDENTIALS)
  localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER_ME)
  localStorage.removeItem('authToken')
}

export const isUserLoggedIn = () => {
  const token = localStorage.getItem('authToken')
  return !!token
}

// Authentication functions
export async function loginUser(email, password, remember) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || 'Login failed' };
    }

    // Store token in localStorage
    localStorage.setItem('authToken', data.token);
    
    // Store basic user info
    const userSession = {
      user: data.user,
      loginTime: new Date().toISOString(),
      expiresAt: remember 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      rememberMe: remember
    };
    
    localStorage.setItem('plm_user_session', JSON.stringify(userSession));
    
    console.log('Login successful, token stored:', data.token.substring(0, 10) + '...');
    console.log('User data stored:', data.user);
    
    return { success: true, user: data.user };
  } catch (err) {
    console.error('Login error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}


export async function registerUser(formData) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })

    const data = await response.json()
    if (!response.ok) {
      return { success: false, error: data.message || 'Registration failed' }
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: 'Network error. Please try again.' }
  }
}

export const logoutUser = () => {
  clearUserSession()
  
  // Update user profile to offline status
  try {
    const profileData = localStorage.getItem('plm_user_profile')
    if (profileData) {
      const profile = JSON.parse(profileData)
      profile.isOnline = false
      profile.lastActive = new Date().toISOString()
      localStorage.setItem('plm_user_profile', JSON.stringify(profile))
    }
  } catch (error) {
    console.error('Error updating profile on logout:', error)
  }

  return {
    success: true,
    message: 'Logged out successfully'
  }
}

// Password utilities
export const validatePassword = (password) => {
  const errors = []

  if (!password || typeof password !== 'string') {
    errors.push('Password is required')
    return {
      isValid: false,
      errors
    }
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}


export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Session refresh
export const refreshUserSession = () => {
  const session = getUserSession()
  if (!session) return null

  // Extend session expiration
  const extendedSession = {
    ...session,
    expiresAt: session.rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  }

  localStorage.setItem(AUTH_STORAGE_KEYS.USER_SESSION, JSON.stringify(extendedSession))
  return extendedSession
}

// Get user info
export const getCurrentUser = () => {
  const session = getUserSession()
  return session ? session.user : null
}

// Check if remember me was selected
export const shouldRememberUser = () => {
  return localStorage.getItem(AUTH_STORAGE_KEYS.REMEMBER_ME) === 'true'
}

// Get last login time
export const getLastLoginTime = () => {
  return localStorage.getItem(AUTH_STORAGE_KEYS.LAST_LOGIN)
}

// Demo account helper
export const getDemoCredentials = () => {
  return {
    email: 'demo@example.com',
    password: 'Password123'
  }
}
