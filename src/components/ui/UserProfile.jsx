import React, { useState, useEffect } from 'react'
import { User, Edit3, Save, X, Search, UserPlus, MessageCircle, Users } from 'lucide-react'
import './styles.css'
import {
  loadUserProfile,
  saveUserProfile,
  loadFriendsList,
  loadFriendRequests,
  resetFriendsData
} from '../../utils/localStorage'
import { fetchUserProfile, updateUserProfile, sendFriendRequestApi, respondToFriendRequestApi } from '../../utils/profile'
import { useCommonNotifications } from './NotificationSystem'

const UserProfile = ({ isOpen, onClose }) => {
  const [userProfile, setUserProfile] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'friends', 'discover'
  const [searchQuery, setSearchQuery] = useState('')
  const [friendsList, setFriendsList] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [discoverUsers, setDiscoverUsers] = useState([])

  useEffect(() => {
    const controller = new AbortController()
    const token = localStorage.getItem('authToken')

    console.log('UserProfile useEffect triggered with searchQuery:', searchQuery)

    const fetchSearchResults = async () => {
      if (!searchQuery || !token) {
        console.log('No searchQuery or token, skipping fetch')
        setDiscoverUsers([])
        return
      }

      try {
        console.log('Fetching search results for query:', searchQuery)
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/search-users?query=${encodeURIComponent(searchQuery)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          }
        )

        if (!response.ok) throw new Error('Search failed')

        const data = await response.json()
        console.log('Search results received:', data)
        setDiscoverUsers(data.results || [])
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Live user search error:', err.message)
        }
        setDiscoverUsers([])
      }
    }

    fetchSearchResults()

    return () => controller.abort()
  }, [searchQuery])

  useEffect(() => {
    if (isOpen) {
      const loadProfile = async () => {
        const result = await fetchUserProfile();
        if (result.success) {
          console.log('UserProfile component loaded profile:', result.profile);
          setUserProfile(result.profile);
          setEditForm(result.profile);
        } else {
          console.error('Failed to load profile in UserProfile:', result.error);
          // Fallback to localStorage
          const profile = loadUserProfile();
          setUserProfile(profile);
          setEditForm(profile);
        }
      };

      // New function to load friends list from API
      const loadFriendsListApi = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            setFriendsList([]);
            return;
          }
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/friends`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch friends list');
          }
          const data = await response.json();
          setFriendsList(data.friends || []);
        } catch (error) {
          console.error('Error loading friends list from API:', error);
          // Fallback to localStorage
          setFriendsList(loadFriendsList());
        }
      };

      // Load friend requests from API
      const loadFriendRequestsApi = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            setFriendRequests([]);
            return;
          }
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/friend-requests`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (!response.ok) {
            throw new Error('Failed to fetch friend requests');
          }
          const text = await response.text();
          const data = text ? JSON.parse(text) : [];
          const requests = Array.isArray(data) ? data : data.requests;
          setFriendRequests(requests || []);
        } catch (error) {
          console.error('Error loading friend requests from API:', error);
          // Fallback to localStorage
          setFriendRequests(loadFriendRequests());
        }
      };

      loadProfile();
      loadFriendsListApi();
      loadFriendRequestsApi();
    }
  }, [isOpen])

  // Listen for profile updates from other components
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (isOpen) {
        setUserProfile(event.detail)
        setEditForm(event.detail)
      }
    }

    window.addEventListener('userProfileUpdated', handleProfileUpdate)

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate)
    }
  }, [isOpen])

  const handleSaveProfile = () => {
    saveUserProfile(editForm)
    setUserProfile(editForm)
    setIsEditing(false)

    // Dispatch update event to sync with other components
    window.dispatchEvent(new CustomEvent('userProfileUpdated', {
      detail: editForm
    }))
  }

  const handleSendFriendRequest = async (username) => {
    if (username && username !== userProfile.username) {
      try {
        const result = await sendFriendRequestApi(username)
        if (result.success) {
          alert(result.message)
          // Update discoverUsers state to show "Request Sent" immediately
          setDiscoverUsers(prevUsers =>
            prevUsers.map(user =>
              user.username === username
                ? { ...user, friendship_status: 'pending' }
                : user
            )
          )
        } else {
          alert(`Failed to send friend request: ${result.error}`)
        }
      } catch (error) {
        alert('An unexpected error occurred while sending friend request.')
      }
    }
  }

  const handleFriendRequestResponse = async (request, action) => {
    console.log('Responding to friend request:', request, 'with action:', action)
    const requestId = request.friendship_id
    if (!requestId) {
      alert('Cannot respond to request: Invalid ID.')
      console.error('Invalid request object, missing ID:', request)
      return
    }

    try {
      const result = await respondToFriendRequestApi(requestId, action)
      if (result.success) {
        // Refresh friend requests and friends list after responding
        const token = localStorage.getItem('authToken')
        if (token) {
          // Refresh friend requests
          const friendRequestsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/friend-requests`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          if (friendRequestsResponse.ok) {
            const friendRequestsText = await friendRequestsResponse.text()
            const friendRequestsData = friendRequestsText ? JSON.parse(friendRequestsText) : []
            const requests = Array.isArray(friendRequestsData) ? friendRequestsData : friendRequestsData.requests
            setFriendRequests(requests || [])
          }

          // If accepted, also refresh friends list
          if (action === 'accept') {
            const friendsListResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/friends`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            if (friendsListResponse.ok) {
              const friendsListData = await friendsListResponse.json()
              setFriendsList(friendsListData.friends || [])
            }
          }
        }
      } else {
        alert(`Failed to ${action} friend request: ${result.error}`)
      }
    } catch (error) {
      alert(`An unexpected error occurred while trying to ${action} friend request.`)
    }
  }

  const renderFriendshipStatusButton = (user) => {
    switch (user.friendship_status) {
      case 'accepted':
        return <button className="btn btn-secondary btn-sm" disabled>Friends</button>;
      case 'pending':
        return <button className="btn btn-secondary btn-sm" disabled>Request Sent</button>;
      case 'none':
      default:
        return (
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => handleSendFriendRequest(user.username)}
          >
            <UserPlus size={16} />
            Add Friend
          </button>
        );
    }
  };

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Profile</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            <p>
            Profile</p>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <Users size={16} />
            <p>
            Friends</p> ({friendsList.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            <Search size={16} />
            <p>
            Discover</p>
          </button>
        </div>

        <div className="modal-bodyy">
          {activeTab === 'profile' && (
            <div className="profile-content">
              <div className="profile-avatar">
                <div className="avatar-circle">
                  {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                {isEditing && (
                  <button className="avatar-edit-btn">
                    <Edit3 size={16} />
                  </button>
                )}
              </div>

              <div className="profile-form">
                <div className="form-group">
                  <label>Username</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.username || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      className="form-input"
                      placeholder="Enter username"
                    />
                  ) : (
                    <p className="profile-value">@{userProfile.username || 'Not set'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Display Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.displayName || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="form-input"
                      placeholder="Enter display name"
                    />
                  ) : (
                    <p className="profile-value">{userProfile.displayName || 'Not set'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={editForm.email || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="form-input"
                      placeholder="Enter email"
                    />
                  ) : (
                    <p className="profile-value">{userProfile.email || 'Not set'}</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.bio || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="form-textarea"
                      placeholder="Tell others about yourself"
                      rows="3"
                    />
                  ) : (
                    <p className="profile-value">{userProfile.bio || 'No bio yet'}</p>
                  )}
                </div>

                
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="friends-content">
          {friendRequests.length > 0 && (
            <div className="friend-requests">
              <h3>Friend Requests</h3>
                {friendRequests.map(request => (
                  <div key={request.friendship_id} className="friend-request-item">
                    <div className="friend-info">
                      <div className="friend-avatar">
                        {(request.display_name || request.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="friend-name">{request.display_name || request.username}</p>
                        <p className="friend-time">{new Date(request.sent_at).toLocaleDateString()}</p>
                        {request.bio && <p className="friend-bio">{request.bio}</p>}
                      </div>
                    </div>
                    <div className="friend-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleFriendRequestResponse(request, 'accept')}
                      >
                        Accept
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleFriendRequestResponse(request, 'decline')}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

              <div className="friends-list">
                <h3>Friends ({friendsList.length})</h3>
                {friendsList.length === 0 ? (
                  <p className="empty-state">No friends yet. Discover users to connect with!</p>
                ) : (
                  friendsList.map(friend => (
                    <div key={friend.username} className="friend-item">
                      <div className="friend-info">
                        <div className="friend-avatar">
                          {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="friend-name">{friend.displayName || friend.username}</p>
                          <p className="friend-status">{friend.status}</p>
                          {friend.bio && <p className="friend-bio">{friend.bio}</p>}
                        </div>
                      </div>
                      <button className="btn btn-secondary btn-sm">
                        <MessageCircle size={16} />
                        Chat
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="discover-content">
              <div className="search-bar">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search users by name or interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="users-list">
               {discoverUsers.map(user => (
  <div key={user.username} className="user-item">
    <div className="user-info">
      <div className="friend-avatar">{(user.display_name || user.username)?.charAt(0).toUpperCase()}</div>
      <div>
        <p className="user-name">{user.display_name}</p>
        <p className="user-username">@{user.username}</p>
        <p className="user-bio">{user.bio || 'No bio'}</p>
      </div>
    </div>
    <div>
      {renderFriendshipStatusButton(user)}
    </div>
  </div>
))}

              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
