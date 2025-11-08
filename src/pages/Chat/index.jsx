import { Send, Phone, Video, UserPlus, Users, Search, Settings, MoreVertical, X, Plus, Check, CheckCheck } from 'lucide-react'
import { useState, useEffect, useRef, useLayoutEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchUserProfile, respondToFriendRequestApi, fetchUserById } from '../../utils/profile'
import {
  initSocket, onMessageReceived, sendMessage, sendTyping, onUserTyping, onUserStatusChange, onMessageRead, sendReadReceipt, onOnlineUsers,
  sendGroupMessage, sendGroupTyping, onGroupMessageReceived, onGroupTyping, onGroupError
} from '../../utils/socket'
import './Chat.css'
import './CreateGroup.css'
import MessageBubble from './MessageBubble'
import { useUserContext } from '../../contexts/UserContext'

const Chat = () => {
  const navigate = useNavigate()
  const userContext = useUserContext();
  const activeCall = userContext?.activeCall;
  const setActiveCall = userContext?.setActiveCall;
  const [profile, setProfile] = useState(null)
  const profileRef = useRef(profile)
  const [friendsList, setFriendsList] = useState([])
  const [friendRequests, setFriendRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const selectedUserRef = useRef(selectedUser)
  const [messages, setMessages] = useState({})
  const [userChatIdMap, setUserChatIdMap] = useState({})
  const [typingUsers, setTypingUsers] = useState(new Set())
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const socketRef = useRef(null)

  const [showChatList, setShowChatList] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [showFriendRequests, setShowFriendRequests] = useState(false)
  const [showNewGroupModal, setShowNewGroupModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [selectedFriends, setSelectedFriends] = useState([])

  const createGroupApi = async (groupName, participantIds) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('No auth token found')
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/create-group`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: groupName,
          participantIds
        })
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to create group: ${errorText}`)
      }
      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      console.error('Error creating group:', error)
      return { success: false, error: error.message }
    }
  }
  const [friendRequestStatus, setFriendRequestStatus] = useState({ type: '', message: '' })
  const [createGroupSearch, setCreateGroupSearch] = useState('')
  const [chatSearch, setChatSearch] = useState('')
  const [messageStatuses, setMessageStatuses] = useState({})
  const [groupChats, setGroupChats] = useState([])
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const scrollRef = useRef({ oldScrollHeight: 0, oldScrollTop: 0, shouldAdjust: false })

  const loadGroupChatsApi = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setGroupChats([])
        return
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/group-chats`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch group chats')
      }
      const data = await response.json()
      const sortedGroups = (data.groups || []).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
      setGroupChats(sortedGroups)
    } catch (error) {
      console.error('Error loading group chats from API:', error)
      setGroupChats([])
    }
  }

  // Modified to fetch all messages for a group chat at once
  const fetchAllGroupMessages = async (groupId) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/group-messages/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch group messages')
      }

      const data = await response.json()
      const currentUserId = profileRef.current?.id || profileRef.current?._id
      let messagesArray = []
      if (Array.isArray(data.messages)) {
        messagesArray = data.messages
      } else if (data.messages && typeof data.messages === 'object') {
        messagesArray = [data.messages]
      }
      const allMessages = (messagesArray || []).map(message => ({
        id: message.id,
        text: message.content,
        sender: String(message.sender_id) === String(currentUserId) ? 'me' : 'other',
        senderId: message.sender_id,
        timestamp: new Date(message.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(message.delivered_at).toDateString(),
        status: message.read ? 'read' : 'delivered'
      }))

      setMessages(prev => ({
        ...prev,
        [groupId]: allMessages
      }))
    } catch (error) {
      console.error('Error fetching group messages:', error)
      setMessages(prev => ({
        ...prev,
        [groupId]: prev[groupId] || []
      }))
    }
  }

  // Removed handleScroll function since pagination on scroll is removed

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])



  const loadProfile = async () => {
    setLoading(true)
    setError(null)
    const result = await fetchUserProfile()
    if (result.success) {
      console.log('Debug: Loaded profile:', result.profile)
      setProfile(result.profile)
    } else {
      setError(result.error || 'Failed to fetch profile.')
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!profile) return
    const token = localStorage.getItem('authToken')
    if (!token) return

    if (!socketRef.current) {
      socketRef.current = initSocket(token)

      // Emit join event to notify server of current user presence or join room
      socketRef.current.emit('join', { token })

      socketRef.current.on('reconnect', () => {
        socketRef.current.emit('join', { token })
      })

      socketRef.current.emit('get:online:users')

      socketRef.current.on('online:users', (userIds) => {
        setOnlineUsers(new Set(userIds));
      });

      onMessageReceived((message) => {
        const currentUserId = profileRef.current?.id || profileRef.current?._id || null
        const selectedUser = selectedUserRef.current

        setMessageStatuses(prev => ({
          ...prev,
          [message.id]: 'delivered'
        }))

        // Update friendsList with last message and unread count
        setFriendsList(prevFriends => {
          const currentUserId = profileRef.current?.id || profileRef.current?._id
          const senderId = message.sender_id
          const selectedUser = selectedUserRef.current

          let friendIdToUpdate = null
          if (String(senderId) !== String(currentUserId)) {
            // Message from another user
            friendIdToUpdate = senderId
          } else if (selectedUser && !selectedUser.isGroup) {
            // Message from me (echo) to a friend, update the person I'm talking to
            friendIdToUpdate = selectedUser.id
          }

          if (!friendIdToUpdate) {
            return prevFriends // Not enough info to update
          }

          const updatedFriends = prevFriends.map(friend => {
            if (String(friend.id) === String(friendIdToUpdate)) {
              const isSelectedChat = selectedUser && String(friend.id) === String(selectedUser.id)

              const unreadCount = isSelectedChat || String(senderId) === String(currentUserId)
                ? 0 // Don't increment for current chat or for my own messages
                : (Number(friend.unread_messages) || 0) + 1

              return {
                ...friend,
                last_message: message.content,
                last_message_time: message.delivered_at,
                unread_messages: unreadCount
              }
            }
            return friend
          })

          return updatedFriends.sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
        })

        setGroupChats(prevGroups => {
          const chatId = String(message.chat_id)
          const currentUserId = profileRef.current?.id || profileRef.current?._id
          const senderId = message.sender_id
          const selectedUser = selectedUserRef.current

          const updatedGroups = prevGroups.map(group => {
            if (String(group.group_id) === chatId) {
              const isSelectedChat = selectedUser && selectedUser.isGroup && String(group.group_id) === String(selectedUser.id)
              const unreadCount = isSelectedChat || String(senderId) === String(currentUserId)
                ? 0
                : (Number(group.unread_count) || 0) + 1

              return {
                ...group,
                last_message: message.content,
                last_message_time: message.delivered_at,
                unread_count: unreadCount
              }
            }
            return group
          })

          return updatedGroups.sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
        })

        // If a message comes in, it must have a chat_id. If we are in a chat but
        // don't have the chat_id yet (i.e. a new chat), let's update our map.
        if (selectedUser) {
          const chatId = String(message.chat_id)
          const senderId = message.sender_id
          const selectedUserId = selectedUser.id

          if (senderId === selectedUserId || senderId === currentUserId) {
            setUserChatIdMap(prevMap => {
              if (prevMap[String(selectedUserId)] !== chatId) {
                return { ...prevMap, [String(selectedUserId)]: chatId }
              }
              return prevMap
            })
          }
        }

        console.log('Debug: currentUserId:', currentUserId, 'message.sender_id:', message.sender_id)
        const formattedMessage = {
          id: message.id,
          text: message.content,
          sender: String(message.sender_id) === String(currentUserId) ? 'me' : 'other',
          senderId: message.sender_id,
          // Convert UTC time to local time for display
          // Parse delivered_at as UTC and convert to local time
          // Fix: Use Date constructor directly to parse ISO string with timezone
          timestamp: new Date(message.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(message.delivered_at).toDateString(),
          status: 'delivered'
        }

        // Check if chatId is known in userChatIdMap before updating messages
        // Remove the skip check to avoid missing first messages
        // Instead, always update userChatIdMap with chatId from message
        const chatIdFromMessage = String(message.chat_id)
        const selectedUserId = String(selectedUser?.id)

        if (selectedUserId) {
          setUserChatIdMap(prevMap => {
            if (prevMap[selectedUserId] !== chatIdFromMessage) {
              return { ...prevMap, [selectedUserId]: chatIdFromMessage }
            }
            return prevMap
          })
        }

        const isGroupMessage = groupChats.some(g => String(g.group_id) === String(message.chat_id))

        if (!isGroupMessage) {
          setMessages(prev => {
            const newChatId = chatIdFromMessage
            // Use chat ID as the key for messages state to unify keys
            const newState = { ...prev }
            const existingMessages = newState[newChatId] || []

            // Check if the message already exists by ID
            const messageExists = existingMessages.some(m => m.id === formattedMessage.id)

            if (!messageExists) {
              const optimisticIndex = existingMessages.findIndex(m =>
                typeof m.id === 'string' &&
                m.id.startsWith('temp-') &&
                m.text === formattedMessage.text
              )
              if (optimisticIndex !== -1) {
                const updatedMessages = [...existingMessages]
                updatedMessages[optimisticIndex] = formattedMessage
                newState[newChatId] = updatedMessages
              } else {
                newState[newChatId] = [...existingMessages, formattedMessage]
              }
            } else {
              newState[newChatId] = [...existingMessages] // to preserve reference
            }

            return newState
          })
        }
      })

      onUserTyping((fromUserId) => {
        if (selectedUserRef.current && !selectedUserRef.current.isGroup && String(selectedUserRef.current.id) === String(fromUserId)) {
          setTypingUsers(prev => new Set(prev).add(fromUserId))
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(fromUserId)
              return newSet
            })
          }, 3000)
        }
      })

      onUserStatusChange((userId, isOnline) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          if (isOnline) {
            newSet.add(userId)
          } else {
            newSet.delete(userId)
          }
          return newSet
        })
      })

      onMessageRead((messageId) => {
        setMessageStatuses(prev => ({ ...prev, [messageId]: 'read' }))
      })

      onGroupMessageReceived((message) => {
        const currentUserId = profileRef.current?.id || profileRef.current?._id
        const formattedMessage = {
          id: message.id,
          text: message.content,
          sender: String(message.sender_id) === String(currentUserId) ? 'me' : 'other',
          senderId: message.sender_id,
          timestamp: new Date(message.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: new Date(message.delivered_at).toDateString(),
          status: 'delivered'
        }

        setMessages(prev => {
          const chatId = String(message.chat_id)
          const newState = { ...prev }
          const existingMessages = newState[chatId] || []

          // Check if the message already exists by ID
          const messageExists = existingMessages.some(m => m.id === formattedMessage.id)

          if (!messageExists) {
            const optimisticIndex = existingMessages.findIndex(m =>
              typeof m.id === 'string' &&
              m.id.startsWith('temp-') &&
              m.text === formattedMessage.text
            )
            if (optimisticIndex !== -1) {
              const updatedMessages = [...existingMessages]
              updatedMessages[optimisticIndex] = formattedMessage
              newState[chatId] = updatedMessages
            } else {
              newState[chatId] = [...existingMessages, formattedMessage]
            }
          } else {
            newState[chatId] = [...existingMessages] // to preserve reference
          }

          return newState
        })

        // Update groupMembers state to include sender if missing
        setGroupMembers(prevMembers => {
          const senderIdStr = String(message.sender_id)
          const exists = prevMembers.some(m => String(m.id) === senderIdStr)
          if (!exists) {
            // Add sender with placeholder username (could be improved by fetching user info)
            return [...prevMembers, { id: message.sender_id, username: 'Unknown' }]
          }
          return prevMembers
        })

        // Update groupChats with last message and unread count
        setGroupChats(prevGroups => {
          const chatId = String(message.chat_id)
          const currentUserId = profileRef.current?.id || profileRef.current?._id
          const senderId = message.sender_id
          const selectedUser = selectedUserRef.current

          const updatedGroups = prevGroups.map(group => {
            if (String(group.group_id) === chatId) {
              const isSelectedChat = selectedUser && selectedUser.isGroup && String(group.group_id) === String(selectedUser.id)
              const unreadCount = isSelectedChat || String(senderId) === String(currentUserId)
                ? 0
                : (Number(group.unread_count) || 0) + 1

              return {
                ...group,
                last_message: message.content,
                last_message_time: message.delivered_at,
                unread_count: unreadCount
              }
            }
            return group
          })

          return updatedGroups.sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
        })
      })

      onGroupTyping(({ fromUserId, groupId }) => {
        if (selectedUserRef.current?.isGroup && String(selectedUserRef.current.id) === String(groupId)) {
          setTypingUsers(prev => new Set(prev).add(fromUserId))
          setTimeout(() => {
            setTypingUsers(prev => {
              const newSet = new Set(prev)
              newSet.delete(fromUserId)
              return newSet
            })
          }, 3000)
        }
      })

      onGroupError(({ message }) => {
        alert(`Group chat error: ${message}`)
      })
    }
  }, [profile])

  useEffect(() => {
    loadProfile()
    loadFriendsListApi()
    loadFriendRequestsApi()
    loadGroupChatsApi()
  }, [])

  // Remove duplicate declaration of handleUserSelect if exists

  const loadFriendRequestsApi = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setFriendRequests([])
        return
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/friend-requests`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch friend requests')
      }
      const text = await response.text()
      const data = text ? JSON.parse(text) : []
      const requests = Array.isArray(data) ? data : data.requests
      setFriendRequests(requests || [])
    } catch (error) {
      console.error('Error loading friend requests from API:', error)
      setFriendRequests([])
    }
  }

  const loadFriendsListApi = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        setFriendsList([])
        return
      }
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/friends`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch friends list')
      }
      const data = await response.json()
      console.log('Debug: Friends API response:', data)
      const sortedFriends = (data.friends || []).sort((a, b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0))
      setFriendsList(sortedFriends)
    } catch (error) {
      console.error('Error loading friends list from API:', error)
      setFriendsList([])
    }
  }

  const currentChatId = selectedUser?.isGroup
    ? selectedUser.id
    : userChatIdMap[String(selectedUser?.id)]
  const currentMessages = (currentChatId && messages[currentChatId]) || []

  const [activeChatTab, setActiveChatTab] = useState('friends')

  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false)
  const [groupMembers, setGroupMembers] = useState([])
  const [groupAdmins, setGroupAdmins] = useState([])
  const [userColors, setUserColors] = useState({})

  const nameColors = [
    '#e51c23', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#5677fc', '#03a9f4', '#00bcd4', '#009688', '#259b24',
    '#8bc34a', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#607d8b'
  ]

  const assignUserColors = (members) => {
    const newColors = {}
    members.forEach((member, index) => {
      newColors[String(member.id)] = nameColors[index % nameColors.length]
    })
    setUserColors(newColors)
  }

  const fetchGroupMembers = async (groupId) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/group-details/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch group details')
      }

      const data = await response.json()
      setGroupMembers(data.members || [])
      setGroupAdmins(data.admins || [])
      assignUserColors(data.members || [])
      // Do not auto-open group members modal on fetch
      // setShowGroupMembersModal(true)
    } catch (error) {
      console.error('Error fetching group members:', error)
      setGroupMembers([])
      setGroupAdmins([])
      setShowGroupMembersModal(false)
    }
  }

  const handleGroupSelect = (group) => {
    setSelectedUser({
      id: group.group_id,
      username: group.group_name,
      isGroup: true
    })
    setShowChatList(false)
    setGroupMembers([])
    setUserColors({})

    // Clear unread count for selected group
    setGroupChats(prevGroups =>
      prevGroups.map(g =>
        g.group_id === group.group_id ? { ...g, unread_count: 0 } : g
      )
    )

    // Fetch group members on group select to populate groupMembers for sender name display
    fetchGroupMembers(group.group_id)
  }


  const initialLoadRef = useRef(true)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = (smooth = true) => {
    if (smooth) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' })
      } else if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
      }
    }
  }

  useEffect(() => {
    if (initialLoadRef.current) {
      scrollToBottom(false) // instant scroll on initial load
      initialLoadRef.current = false
    } else {
      scrollToBottom(true) // smooth scroll on subsequent message changes
    }
  }, [currentMessages])

  useEffect(() => {
    scrollToBottom(true)
  }, [typingUsers])

  useLayoutEffect(() => {
    if (scrollRef.current.shouldAdjust && chatContainerRef.current) {
      const { oldScrollHeight, oldScrollTop } = scrollRef.current
      const newScrollHeight = chatContainerRef.current.scrollHeight
      // Adjust scroll position to keep view stable
      chatContainerRef.current.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight)
      scrollRef.current.shouldAdjust = false
    }
  }, [currentMessages])

  useEffect(() => {
    if (profile && selectedUser) {
      if (selectedUser.isGroup) {
        // For group chats, clear previous messages and fetch them.
        setMessages(prev => ({ ...prev, [selectedUser.id]: [] }))
        fetchAllGroupMessages(selectedUser.id)
      } else {
        // For one-on-one chats, fetch the entire initial history.
        const fetchChatHistory = async () => {
          try {
            const token = localStorage.getItem('authToken')
            if (!token) return

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/chat/messages/${selectedUser.id}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })

            if (!response.ok) {
              throw new Error('Failed to fetch chat history')
            }

            const data = await response.json()
            console.log('Fetched chat history for user:', selectedUser.id, data)
            const currentUserId = profile?.id || profile?._id || null
            console.log('Debug: handleUserSelect currentUserId:', currentUserId)
            if (!currentUserId) {
              console.warn('Warning: currentUserId is null or undefined in handleUserSelect')
            }
            const formattedMessages = (data.messages || []).map(message => {
              const sender = String(message.sender_id) === String(currentUserId) ? 'me' : 'other'
              console.log('Debug: message id:', message.id, 'sender:', sender)
              return {
                id: message.id,
                text: message.content,
                sender,
                senderId: message.sender_id,
                timestamp: new Date(message.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                date: new Date(message.delivered_at).toDateString(),
                status: message.read ? 'read' : 'delivered'
              }
            })
            setMessages(prev => {
              const chatIdStr = String(data.chat_id)
              const existingMessagesForChatId = prev[chatIdStr] || []

              // Add newly fetched messages, avoiding duplicates
              const mergedMessages = [...existingMessagesForChatId]

              formattedMessages.forEach(msg => {
                if (!mergedMessages.some(m => m.id === msg.id)) {
                  mergedMessages.push(msg)
                }
              })

              return {
                ...prev,
                [chatIdStr]: mergedMessages,
              }
            })
            setUserChatIdMap(prev => ({
              ...prev,
              [selectedUser.id]: String(data.chat_id)
            }))
          } catch (error) {
            console.error('Error fetching chat history:', error)
            const key = selectedUser.isGroup ? selectedUser.id : userChatIdMap[String(selectedUser.id)]
            if (key) {
              setMessages(prev => ({ ...prev, [key]: prev[key] || [] }))
            }
          }
        }
        fetchChatHistory()
      }
    }
  }, [profile, selectedUser])

  const handleUserSelect = (user) => {
    // For one-on-one chats, no pagination state needed
    setSelectedUser(user)
    setShowChatList(false)
    setGroupMembers([])
    setUserColors({})

    // Clear unread messages count for selected user
    setFriendsList(prevFriends =>
      prevFriends.map(friend =>
        friend.id === user.id ? { ...friend, unread_messages: 0 } : friend
      )
    )

    // Send read receipts for all unread messages in selected chat
    const chatId = userChatIdMap[String(user.id)]
    if (chatId && messages[chatId]) {
      messages[chatId].forEach(message => {
        if (message.sender !== 'me' && message.status !== 'read') {
          sendReadReceipt(message.id, message.senderId)
        }
      })
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const messageDate = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const grouped = []
    let currentDate = null

    messages.forEach((message) => {
      if (currentDate !== message.date) {
        currentDate = message.date
        grouped.push({
          type: 'date-separator',
          date: message.date,
          id: `date-${message.date}`
        })
      }
      grouped.push(message)
    })

    return grouped
  }

  const groupedMessages = groupMessagesByDate(currentMessages)

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser && selectedUser.id) {
      const isGroup = selectedUser.isGroup
      const chatId = isGroup ? selectedUser.id : userChatIdMap[String(selectedUser.id)]

      if (!chatId) {
        console.warn('Chat ID not known, message sending delayed')
        return
      }

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        text: newMessage,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toDateString(),
        status: 'sent'
      }

      setMessages(prev => {
        const existingMessages = prev[chatId] || []
        return {
          ...prev,
          [chatId]: [...existingMessages, optimisticMessage]
        }
      })

      if (isGroup) {
        sendGroupMessage(chatId, newMessage)
      } else {
        sendMessage(String(selectedUser.id), newMessage)
      }

      setNewMessage('')
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleFriendRequestAction = async (requestId, action) => {
    const result = await respondToFriendRequestApi(requestId, action)
    setFriendRequestStatus({
      type: result.success ? 'success' : 'error',
      message: result.message || result.error
    })

    if (result.success) {
      // Refresh friends list and friend requests after action
      loadFriendsListApi()
      loadFriendRequestsApi()
    }

    // Clear the message after a few seconds
    setTimeout(() => {
      setFriendRequestStatus({ type: '', message: '' })
    }, 5000)
  }

  const formatLastMessage = (message) => {
    if (typeof message === 'string' && message.startsWith('[call_link]')) {
      return 'Video call started';
    }
    return message || 'Start chatting...';
  };

  if (loading) {
    return <div className="chat-page"><div>Loading...</div></div>
  }

  if (error) {
    return <div className="chat-page"><div>Error: {error}</div></div>
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Chat List Sidebar */}
        <div className={`chat-sidebar ${showChatList ? 'show' : 'hide'}`}>
          <div className="chat-sidebar-header">
            <h2 className="card-title">Messages</h2>
          <div className="chat-header-actions">
              <button
                className="chat-action-btn"
                onClick={() => setShowFriendRequests(!showFriendRequests)}
                title="Friend Requests"
              >
                <UserPlus size={18} />
                {profile?.incomingFriendRequests?.length > 0 && (
                  <span className="notification-badge">{profile.incomingFriendRequests.length}</span>
                )}
              </button>
              <button
                className="chat-action-btn"
                onClick={() => setShowNewGroupModal(true)}
                title="Create Group"
              >
                <Users size={18} />
              </button>
            </div>
          </div>

          {/* Group Members Modal */}
          {showGroupMembersModal && (
            <div className="group-members-modal-overlay" onClick={() => setShowGroupMembersModal(false)}>
              <div className="group-members-modal-content" onClick={e => e.stopPropagation()}>
                <div className="group-members-modal-header">
                  <h3>Group Members</h3>
                  <button
                    className="group-members-modal-close-btn"
                    onClick={() => setShowGroupMembersModal(false)}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="modal-body">
                  {(groupMembers.length === 0) ? (
                    <p>No members found.</p>
                  ) : (
                    <>
                      <ul>
                        {groupMembers.filter(m => groupAdmins.some(a => a.id === m.id)).map((admin) => (
                          <li key={`admin-${admin.id}`}>
                            {admin.username} <span style={{ fontWeight: 'bold', color: 'var(--teams-accent)', marginLeft: '8px' }}>admin</span>
                          </li>
                        ))}
                      </ul>
                      <ul>
                        {groupMembers.filter(m => !groupAdmins.some(a => a.id === m.id)).map((member) => (
                          <li key={`member-${member.id}`}>
                            {member.username}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="chat-search-container">
            <input
              type="text"
              placeholder="Search or start a new chat"
              className="chat-search-input"
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
            />
          </div>

          {showFriendRequests && (
            <div className="friend-requests-section" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <h3>Friend Requests</h3>
              {friendRequestStatus.message && (
                <div className={`request-status-message ${friendRequestStatus.type}`}>
                  {friendRequestStatus.message}
                </div>
              )}
              {(friendRequests.length ?? 0) > 0
                ? (
                    friendRequests.map(request => (
                <div key={request._id || request.friendship_id} className="friend-request-item">
                  <div className="friend-info">
                    <div className="friend-avatar">{(request.from_user?.username || request.username)?.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="friend-name">{request.from_user?.username || request.username}</p>
                    </div>
                  </div>
                  <div className="friend-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleFriendRequestAction(request._id || request.friendship_id, 'accept')}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleFriendRequestAction(request._id || request.friendship_id, 'reject')}
                    >
                      Reject
                    </button>
                  </div>
                </div>
                    ))
                  )
                : (
                <p>No new friend requests.</p>
                  )}
            </div>
          )}
          <div className="chat-tabs">
            <button
              className={`chat-tab-button ${activeChatTab === 'groups' ? 'active' : ''}`}
              onClick={() => setActiveChatTab('groups')}
              style={{ position: 'relative' }}
            >
              Groups
              {groupChats.reduce((acc, group) => acc + (Number(group.unread_count) || 0), 0) > 0 && (
                <span className="unread-badge total-unread-badge">
                  {groupChats.reduce((acc, group) => acc + (Number(group.unread_count) || 0), 0) > 99
                    ? '99+'
                    : groupChats.reduce((acc, group) => acc + (Number(group.unread_count) || 0), 0)}
                </span>
              )}
            </button>
            <button
              className={`chat-tab-button ${activeChatTab === 'friends' ? 'active' : ''}`}
              onClick={() => setActiveChatTab('friends')}
              style={{ position: 'relative' }}
            >
              Friends
              {friendsList.reduce((acc, friend) => acc + (Number(friend.unread_messages) || 0), 0) > 0 && (
                <span className="unread-badge total-unread-badge">
                  {friendsList.reduce((acc, friend) => acc + (Number(friend.unread_messages) || 0), 0) > 99
                    ? '99+'
                    : friendsList.reduce((acc, friend) => acc + (Number(friend.unread_messages) || 0), 0)}
                </span>
              )}
            </button>
          </div>
          {activeChatTab === 'groups' && (
            <div className="chat-contacts">
              {groupChats.length === 0 ? (
                <div className="empty-friends-animation" style={{ textAlign: 'center', padding: '20px', color: 'var(--teams-text-muted)' }}>
                  <p>You have no group chats yet.</p>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '10px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12" y2="16" />
                  </svg>
                </div>
              ) : (
                (groupChats || [])
                  .filter(group =>
                    group.group_name.toLowerCase().includes(chatSearch.toLowerCase())
                  )
                  .map((group) => (
                  <div
                    key={group.group_id}
                    className={`chat-contact ${selectedUser?.id === group.group_id ? 'active' : ''}`}
                    onClick={() => handleGroupSelect(group)}
                  >
                    <div className="user-avatar" style={{ width: '40px', height: '40px', fontSize: '14px' }}>
                      {group.group_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="chat-contact-info">
                      <div className="chat-contact-header">
                        <h4 className="chat-contact-name">{group.group_name}</h4>
                        {group.last_message_time && (
                          <span className="chat-last-message-time">
                            {new Date(group.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="chat-last-message-container">
                        <p className="chat-last-message">
                          {formatLastMessage(group.last_message)}
                        </p>
                        {group.unread_count > 0 && (
                          <span className="unread-badge">
                            {Number(group.unread_count) > 99 ? '99+' : Number(group.unread_count)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
              )}
            </div>
          )}
          {activeChatTab === 'friends' && (
            <div className="chat-contacts">
              {friendsList.length === 0 ? (
                <div className="empty-friends-animation" style={{ textAlign: 'center', padding: '20px', color: 'var(--teams-text-muted)' }}>
                  <p>You have no friends yet.</p>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '10px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12" y2="16" />
                  </svg>
                </div>
              ) : (
                (friendsList || [])
                  .filter(friend =>
                    friend.username.toLowerCase().includes(chatSearch.toLowerCase())
                  )
                  .map((friend) => (
                  <div
                    key={friend.id}
                    className={`chat-contact ${selectedUser?.id === friend.id ? 'active' : ''}`}
                    onClick={() => handleUserSelect(friend)}
                  >
                    <div className="user-avatar" style={{ position: 'relative', width: '40px', height: '40px', fontSize: '14px' }}>
                      {friend.username.charAt(0).toUpperCase()}
                      {onlineUsers.has(friend.id) && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#28a745',
                            borderRadius: '50%',
                            border: '2px solid white'
                          }}
                        />
                      )}
                    </div>
                    <div className="chat-contact-info">
                      <div className="chat-contact-header">
                        <h4 className="chat-contact-name">{friend.username}</h4>
                        {friend.last_message_time && (
                          <span className="chat-last-message-time">
                            {new Date(friend.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="chat-last-message-container">
                        <p className="chat-last-message">
                          {formatLastMessage(friend.last_message)}
                        </p>
                        {friend.unread_messages > 0 && (
                          <span className="unread-badge">
                            {Number(friend.unread_messages) > 99 ? '99+' : Number(friend.unread_messages)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  ))
              )}
            </div>
          )}
        </div>
        {/* Chat Area */}
        <div className={`chat-area ${!showChatList ? 'show' : 'hide'}`}>
          {selectedUser
            ? (
            <>
          {/* Chat Header */}
          <div className="chat-header">
            <button
              className="mobile-back-btn"
              onClick={() => setShowChatList(true)}
            >
              ←
            </button>
            <div className="chat-header-info">
              <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>
                {selectedUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3
                  className="chat-contact-name"
                  style={{ cursor: selectedUser?.isGroup ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (selectedUser?.isGroup) {
                      fetchGroupMembers(selectedUser.id)
                      setShowGroupMembersModal(true)
                    }
                  }}
                >
                  {selectedUser.username}
                </h3>
                {!selectedUser.isGroup && (
                  <p className={`chat-status ${onlineUsers.has(selectedUser.id) ? 'online' : ''}`}>
                    {onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}
                  </p>
                )}
              </div>
            </div>
            <div className="chat-actions">
              <button className="material-action-btn">
                <Phone size={16} />
              </button>
              {selectedUser.isGroup ? (
                <button
                  className="material-action-btn"
                  onClick={() => {
                    const callId = selectedUser.id;
                    const callURL = `${window.location.origin}/call/${callId}`;
                    const messageText = `[call_link]${JSON.stringify({ url: callURL, text: 'Join Group Call' })}`;
                    sendGroupMessage(callId, messageText);
                    setActiveCall({ callId, type: 'group' });
                    navigate(`/call/${callId}`, { state: { callType: 'group' } });
                  }}
                >
                  <Video size={16} />
                </button>
              ) : (
                <button
                  className="material-action-btn"
                  onClick={() => {
                    if (!profile?.id) {
                      return;
                    }
                    const callId = [profile.id, selectedUser.id].sort().join('-');
                    const callURL = `${window.location.origin}/call/${callId}`;
                    const messageText = `[call_link]${JSON.stringify({ url: callURL, text: 'Join Call' })}`;
                    sendMessage(String(selectedUser.id), messageText);
                    setActiveCall({ callId, otherUserId: selectedUser.id, type: 'one-to-one' });
                    navigate(`/call/${callId}`, { state: { otherUserId: selectedUser.id, callType: 'one-to-one' } });

                  }}
                >
                  <Video size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-messages" ref={chatContainerRef} >
            <div className="messages-scroll-container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="messages-container">
          {console.log('Chat rendering groupMembers:', groupMembers)}
          {groupedMessages.map((item, index) => {
            if (item.type === 'date-separator') {
              return (
                <div key={item.id} className="date-separator">
                  <span className="date-text">{formatDate(item.date)}</span>
                </div>
              )
            }

            // Determine if sender name should be shown: show only if first message or sender differs from previous message
            const showSenderName = index === 0 || groupedMessages[index - 1].senderId !== item.senderId

            // Determine if this is the first message in a group (for CSS styling)
            const isFirstInGroup = showSenderName

            return (
              <MessageBubble
                key={item.id}
                item={item}
                messageStatuses={messageStatuses}
                sendReadReceipt={sendReadReceipt}
                groupMembers={groupMembers}
                showSenderName={showSenderName}
                isFirstInGroup={isFirstInGroup}
                userColors={userColors}
                isGroupChat={selectedUser?.isGroup}
              />
            )
          })}
              {currentMessages.length === 0 && (
                <div className="empty-chat" style={{ textAlign: 'center', padding: '40px', color: 'var(--teams-text-muted)' }}>
                  <p style={{ fontSize: '16px', marginBottom: '20px' }}>Start chatting with {selectedUser.username}</p>
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              )}
              {selectedUser && !selectedUser.isGroup && typingUsers.has(selectedUser.id) && (
                <div className="typing-indicator" style={{ margin: '8px 0', color: '#888', fontStyle: 'italic' }}>
                  {selectedUser.username} is typing...
                </div>
              )}
              {selectedUser && selectedUser.isGroup && typingUsers.size > 0 && (
                <div className="typing-indicator" style={{ margin: '8px 0', color: '#888', fontStyle: 'italic' }}>
                  Someone is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          </div>

          {/* Message Input */}
          <div className="chat-input">
            <div className="input-container">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="message-input"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                    if (selectedUser.isGroup) {
                      sendGroupTyping(selectedUser.id)
                    } else {
                      sendTyping(String(selectedUser.id))
                    }
                  }}
                />
              <button
                className="send-btn"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
            </>
              )
            : (
            <div className="empty-chat-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p>Select a chat to start messaging</p>
            </div>
              )}
        </div>
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="modal-overlay" onClick={() => setShowNewGroupModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Group Chat</h3>
              <button
                className="modal-close-btn"
                onClick={() => setShowNewGroupModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="form-input"
                />
              </div>
              <div className="create-group-form-group">
                <label>Add Members</label>
                <input
                  type="text"
                  placeholder="Search friends..."
                  className="create-group-search"
                  value={createGroupSearch}
                  onChange={(e) => setCreateGroupSearch(e.target.value)}
                />
                <div className="create-group-friends-selection">
                  {(friendsList || [])
                    .filter(friend =>
                      friend.username.toLowerCase().includes(createGroupSearch.toLowerCase())
                    )
                    .map(friend => (
                      <div
                        key={friend.id}
                        className={`create-group-friend-checkbox ${
                          selectedFriends.includes(friend.username) ? 'selected' : ''
                        }`}
                        onClick={() => {
                          if (selectedFriends.includes(friend.username)) {
                            setSelectedFriends(prev => prev.filter(f => f !== friend.username))
                          } else {
                            setSelectedFriends(prev => [...prev, friend.username])
                          }
                        }}
                      >
                        <div className="create-group-friend-avatar">{friend.username.charAt(0).toUpperCase()}</div>
                        <label>{friend.username}</label>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowNewGroupModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (newGroupName.trim() && selectedFriends.length > 0) {
                    // Map selectedFriends usernames to their IDs
                    const participantIds = friendsList
                      .filter(friend => selectedFriends.includes(friend.username))
                      .map(friend => friend.id)

                    const result = await createGroupApi(newGroupName.trim(), participantIds)
                    if (result.success) {
                      const newGroupId = result.data.groupId || `group-${Date.now()}`
                      setMessages(prev => ({
                        ...prev,
                        [newGroupId]: [{
                          id: 1,
                          text: `${profile.displayName || 'You'} created the group`,
                          sender: 'system',
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        }]
                      }))

                      // TODO: Update chat list or selected chat to new group if applicable
                      // setSelectedChat(newGroupId)

                      setShowNewGroupModal(false)
                      setNewGroupName('')
                      setSelectedFriends([])
                      setShowChatList(false)
                    } else {
                      alert(`Failed to create group: ${result.error}`)
                    }
                  }
                }}
                disabled={!newGroupName.trim() || selectedFriends.length === 0}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


export default Chat
