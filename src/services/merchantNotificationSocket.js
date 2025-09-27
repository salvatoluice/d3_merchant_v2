// services/merchantNotificationSocket.js - Fixed Socket.IO import
import merchantAuthService from './merchantAuthService';

class MerchantNotificationSocket {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.notificationCallbacks = new Set();
    this.messageCallbacks = new Set();
  }

  // Initialize socket connection for merchant
  init() {
    if (!merchantAuthService.isAuthenticated()) {
      console.log('Merchant not authenticated, skipping socket init');
      return;
    }

    try {
      const merchant = merchantAuthService.getCurrentMerchant();
      const token = merchantAuthService.getToken();

      if (!merchant || !token) {
        console.error('Missing merchant data or token for socket connection');
        return;
      }

      console.log('Initializing merchant notification socket for:', merchant.id);

      // Check if Socket.IO is available
      if (typeof window === 'undefined' || !window.io) {
        console.error('Socket.IO not available on window object');
        
        // Try to get from global io if available
        if (typeof io !== 'undefined') {
          window.io = io;
        } else {
          console.error('Socket.IO not found globally either');
          return;
        }
      }

      // Initialize socket with authentication
      this.socket = window.io({
        auth: {
          token: token,
          userId: merchant.id,
          userType: 'merchant',
          merchantId: merchant.id
        },
        transports: ['websocket', 'polling']
      });

      this.setupEventListeners();

    } catch (error) {
      console.error('Failed to initialize merchant notification socket:', error);
    }
  }

  // Setup all socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Merchant notification socket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      const merchant = merchantAuthService.getCurrentMerchant();
      if (merchant) {
        // Join merchant-specific rooms
        this.socket.emit('join_merchant_rooms', {
          merchantId: merchant.id,
          storeIds: merchant.storeIds || []
        });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Merchant notification socket disconnected:', reason);
      this.connected = false;
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Merchant notification socket connection error:', error);
      this.handleReconnect();
    });

    // Notification events
    this.socket.on('new_notification', (notification) => {
      console.log('🔔 New notification received via socket:', notification);
      this.handleNewNotification(notification);
    });

    // Chat message events (for immediate notification updates)
    this.socket.on('new_customer_to_store_message', (messageData) => {
      console.log('💬 New customer message via socket:', messageData);
      this.handleNewCustomerMessage(messageData);
    });

    this.socket.on('new_message', (messageData) => {
      console.log('📨 New message via socket:', messageData);
      this.handleNewMessage(messageData);
    });

    // Notification state updates
    this.socket.on('notification_read', (data) => {
      console.log('📖 Notification marked as read via socket:', data);
      this.handleNotificationRead(data);
    });

    this.socket.on('notifications_bulk_read', (data) => {
      console.log('📖 Bulk notifications read via socket:', data);
      this.handleBulkNotificationsRead(data);
    });

    // Store-specific events
    this.socket.on('store_notification', (notification) => {
      console.log('🏪 Store-specific notification:', notification);
      this.handleStoreNotification(notification);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Merchant notification socket error:', error);
    });

    // Authentication events
    this.socket.on('auth_error', (error) => {
      console.error('Merchant socket authentication error:', error);
      // Try to refresh token and reconnect
      this.handleAuthError();
    });
  }

  // Handle new notification received via socket
  handleNewNotification(notification) {
    // Notify all registered callbacks
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification, 'new_notification');
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  // Handle new customer message
  handleNewCustomerMessage(messageData) {
    // Convert message to notification format
    const notification = {
      id: `msg_${messageData.id || Date.now()}`,
      type: 'new_message',
      title: 'New Customer Message',
      message: `${messageData.customer?.name || 'Customer'}: ${messageData.initialMessage || messageData.content || 'New message'}`,
      priority: 'high',
      createdAt: new Date(),
      read: false,
      isNew: true,
      sender: messageData.customer,
      store: messageData.store,
      data: {
        conversationId: messageData.conversationId,
        messageId: messageData.id,
        chatType: 'customer_to_store'
      },
      actionUrl: `/dashboard/chat/${messageData.conversationId}`,
      actionType: 'navigate'
    };

    // Notify callbacks
    this.messageCallbacks.forEach(callback => {
      try {
        callback(notification, 'new_customer_message');
      } catch (error) {
        console.error('Error in message callback:', error);
      }
    });

    this.notificationCallbacks.forEach(callback => {
      try {
        callback(notification, 'new_customer_message');
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  // Handle general new message
  handleNewMessage(messageData) {
    // Only process messages TO the merchant (from customers)
    if (messageData.sender === 'user' || messageData.sender_type === 'user') {
      this.handleNewCustomerMessage(messageData);
    }
  }

  // Handle notification read events
  handleNotificationRead(data) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(data, 'notification_read');
      } catch (error) {
        console.error('Error in notification read callback:', error);
      }
    });
  }

  // Handle bulk notifications read
  handleBulkNotificationsRead(data) {
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(data, 'notifications_bulk_read');
      } catch (error) {
        console.error('Error in bulk read callback:', error);
      }
    });
  }

  // Handle store-specific notifications
  handleStoreNotification(notification) {
    this.handleNewNotification({
      ...notification,
      isStoreSpecific: true
    });
  }

  // Handle authentication errors
  handleAuthError() {
    console.log('Handling merchant socket auth error...');
    
    // Try to refresh merchant session
    if (merchantAuthService.isAuthenticated()) {
      console.log('Attempting to reconnect with fresh token...');
      this.disconnect();
      setTimeout(() => this.init(), 2000);
    } else {
      console.log('Merchant no longer authenticated, cleaning up socket');
      this.disconnect();
    }
  }

  // Handle reconnection logic
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached for merchant socket');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect merchant socket in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (merchantAuthService.isAuthenticated()) {
        this.init();
      }
    }, delay);
  }

  // Subscribe to notification updates
  onNotification(callback) {
    if (typeof callback === 'function') {
      this.notificationCallbacks.add(callback);
      console.log('Notification callback registered for merchant');
    }
    
    return () => {
      this.notificationCallbacks.delete(callback);
    };
  }

  // Subscribe to message updates
  onMessage(callback) {
    if (typeof callback === 'function') {
      this.messageCallbacks.add(callback);
      console.log('Message callback registered for merchant');
    }
    
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  // Emit notification read event
  markNotificationAsRead(notificationId) {
    if (this.socket && this.connected) {
      this.socket.emit('mark_notification_read', { notificationId });
    }
  }

  // Emit bulk notifications read event
  markAllNotificationsAsRead(filters = {}) {
    if (this.socket && this.connected) {
      this.socket.emit('mark_all_notifications_read', filters);
    }
  }

  // Join specific store rooms
  joinStoreRooms(storeIds) {
    if (this.socket && this.connected && Array.isArray(storeIds)) {
      this.socket.emit('join_store_rooms', { storeIds });
      console.log('Joined store rooms:', storeIds);
    }
  }

  // Leave store rooms
  leaveStoreRooms(storeIds) {
    if (this.socket && this.connected && Array.isArray(storeIds)) {
      this.socket.emit('leave_store_rooms', { storeIds });
      console.log('Left store rooms:', storeIds);
    }
  }

  // Check connection status
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  // Get socket ID
  getSocketId() {
    return this.socket?.id || null;
  }

  // Disconnect socket
  disconnect() {
    console.log('Disconnecting merchant notification socket');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connected = false;
    this.reconnectAttempts = 0;
    
    // Clear callbacks
    this.notificationCallbacks.clear();
    this.messageCallbacks.clear();
  }

  // Test socket connection
  testConnection() {
    if (this.socket && this.connected) {
      this.socket.emit('ping', { timestamp: Date.now() });
      
      this.socket.once('pong', (data) => {
        console.log('Merchant socket ping/pong successful:', data);
      });
      
      return true;
    }
    
    console.log('Merchant socket not connected for test');
    return false;
  }

  // Send custom event
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
      return true;
    }
    
    console.warn(`Cannot emit ${event}: merchant socket not connected`);
    return false;
  }

  // Listen for custom event
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      return () => this.socket.off(event, callback);
    }
    
    console.warn(`Cannot listen for ${event}: merchant socket not initialized`);
    return () => {};
  }
}

// Create singleton instance
const merchantNotificationSocket = new MerchantNotificationSocket();

// Enhanced initialization with better Socket.IO detection
if (typeof window !== 'undefined') {
  // Wait for DOM and Socket.IO to be ready
  const initWhenReady = () => {
    if (window.io && merchantAuthService.isAuthenticated()) {
      console.log('Socket.IO available, initializing merchant notification socket');
      merchantNotificationSocket.init();
    } else if (!window.io) {
      console.log('Socket.IO not yet available, retrying in 1 second...');
      setTimeout(initWhenReady, 1000);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initWhenReady, 1000);
    });
  } else {
    setTimeout(initWhenReady, 1000);
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    merchantNotificationSocket.disconnect();
  });

  // Reconnect when merchant logs in
  window.addEventListener('merchant-login', () => {
    console.log('Merchant login detected, initializing notification socket');
    setTimeout(initWhenReady, 500);
  });

  // Disconnect when merchant logs out
  window.addEventListener('merchant-logout', () => {
    console.log('Merchant logout detected, disconnecting notification socket');
    merchantNotificationSocket.disconnect();
  });
}

export default merchantNotificationSocket;