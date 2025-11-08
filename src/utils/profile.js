 
// Profile API utilities

export async function fetchUserProfile() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.log('No auth token found');
      return { success: false, error: 'No authentication token found' };
    }

    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/settings/profile`;
    console.log('Fetching profile from:', apiUrl);
    console.log('Using token:', token.substring(0, 10) + '...');
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('API response data:', data);
    
    if (!response.ok) {
      console.error('API error:', data);
      return { success: false, error: data.message || 'Failed to fetch profile' };
    }

    return { success: true, profile: data.profile };
  } catch (err) {
    console.error('Fetch error details:', err.message);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

export async function updateUserProfile(profileData) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/settings/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('Update profile API error:', data);
      return { success: false, error: data.message || 'Failed to update profile' };
    }
    await response.json();
    console.log('Profile updated successfully');
    return { success: true };
  } catch (err) {
    console.error('Update profile error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// New function to send friend request via API
export async function sendFriendRequestApi(toUsername) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/send-request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ to_username: toUsername })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Send friend request API error:', data);
      return { success: false, error: data.message || 'Failed to send friend request' };
    }

    return { success: true, message: data.message };
  } catch (err) {
    console.error('Send friend request error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// New function to respond to friend request (accept or decline)
export async function respondToFriendRequestApi(requestId, action) {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return { success: false, error: 'No authentication token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/friend-requests/respond/${requestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Respond to friend request API error:', data);
      return { success: false, error: data.message || 'Failed to respond to friend request' };
    }

    return { success: true, message: data.message };
  } catch (err) {
    console.error('Respond to friend request error:', err);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Fetch user info by user ID
export async function fetchUserById(userId) {
  try {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw new Error('No auth token found')
    }
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    if (!response.ok) {
      throw new Error('Failed to fetch user by ID')
    }
    const data = await response.json()
    return data.user || null
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    return null
  }
}