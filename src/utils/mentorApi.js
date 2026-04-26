const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const mentorApi = {
  getDashboardStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/dashboard`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  getStudents: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/students`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch students');
    return response.json();
  },

  acceptRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/accept-request/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to accept request');
    return response.json();
  },

  rejectRequest: async (id) => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/reject-request/${id}`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to reject request');
    return response.json();
  },

  scheduleSession: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/schedule-session`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to schedule session');
    return response.json();
  },

  getSessions: async () => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/sessions`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
  },

  rescheduleSession: async (sessionId, data) => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/reschedule-session/${sessionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to reschedule session');
    return response.json();
  },

  getStudentProgress: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/student-progress/${studentId}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch student progress');
    return response.json();
  },

  getAiInsights: async (studentId) => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/ai-insights`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ student_id: studentId })
    });
    if (!response.ok) throw new Error('Failed to fetch AI insights');
    return response.json();
  },

  updateProfile: async (data) => {
    const response = await fetch(`${API_BASE_URL}/api/mentor/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update profile');
    return response.json();
  }
};
