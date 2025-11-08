import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

let socket = null;

// Connect to socket server
export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(URL, {
    auth: { token },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 5,
    transports: ['websocket']
  });

  // ✅ Listeners
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Socket connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket disconnected:', reason);
  });

  return socket;
};

// =======================
// ✅ Emitters
// =======================

// Send a message
export const sendMessage = (toUserId, content) => {
  if (!socket) return;
  socket.emit('message:send', { toUserId, content });
};

// Notify typing
export const sendTyping = (toUserId) => {
  if (!socket) return;
  socket.emit('typing', { toUserId });
};

// Notify read receipt
export const sendReadReceipt = (messageId, toUserId) => {
  if (!socket) return;
  socket.emit('message:read', { messageId, toUserId });
};

// Send a group message
export const sendGroupMessage = (groupId, content) => {
  if (!socket) return;
  socket.emit('group:message:send', { groupId, content });
};

// Notify group typing
export const sendGroupTyping = (groupId) => {
  if (!socket) return;
  socket.emit('group:typing', { groupId });
};

// Notify group read receipt
export const sendGroupReadReceipt = (messageId) => {
  if (!socket) return;
  socket.emit('group:message:read', { messageId });
};

// =======================
// ✅ Set Callbacks
// =======================

export const onMessageReceived = (cb) => {
  if (!socket) return;
  socket.on('message:receive', cb);
};

export const onUserTyping = (cb) => {
  if (!socket) return;
  socket.on('user:typing', ({ fromUserId }) => cb(fromUserId));
};

export const onMessageRead = (cb) => {
  if (!socket) return;
  socket.on('message:read', ({ messageId }) => cb(messageId));
};

export const onUserStatusChange = (cb) => {
  if (!socket) return;
  socket.on('user:online', (userId) => cb(userId, true));
  socket.on('user:offline', (userId) => cb(userId, false));
};

export const onOnlineUsers = (cb) => {
  if (!socket) return;
  socket.on('online:users', cb);
};

export const onGroupMessageReceived = (cb) => {
  if (!socket) return;
  socket.on('group:message:receive', cb);
};

export const onGroupTyping = (cb) => {
  if (!socket) return;
  socket.on('group:typing', ({ fromUserId, groupId }) => cb({ fromUserId, groupId }));
};

export const onGroupError = (cb) => {
  if (!socket) return;
  socket.on('group:error', cb);
};
