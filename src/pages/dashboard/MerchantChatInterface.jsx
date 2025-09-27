// pages/MerchantChatInterface.jsx - Design Improvements
import React, { useState, useRef, useEffect } from 'react';
import { Send, Search, Phone, Video, MoreVertical, ArrowLeft, User, Clock, Check, CheckCheck, AlertCircle, Star, Loader2, MessageCircle, RefreshCw, Store, Users, Plus, Filter } from 'lucide-react';
import Layout from '../../elements/Layout';
import merchantChatService from '../services/merchantChatService';
import merchantAuthService from '../../services/merchantAuthService';
import useSocket from '../hooks/useSocket';

const MerchantChatInterface = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const messagesEndRef = useRef(null);

  // Enhanced merchant initialization
  useEffect(() => {
    const initializeMerchant = async () => {
      try {
        setLoading(true);
        
        if (!merchantAuthService.isAuthenticated()) {
          setError('Please log in as a merchant to access store chat');
          setTimeout(() => {
            window.location.href = '/accounts/sign-in';
          }, 2000);
          return;
        }

        const merchantToken = merchantAuthService.getToken();
        if (!merchantToken) {
          setError('No valid merchant session found. Please log in as a merchant.');
          return;
        }

        // Verify token is merchant type
        try {
          const tokenPayload = JSON.parse(atob(merchantToken.split('.')[1]));
          
          if (tokenPayload.type !== 'merchant') {
            setError('Invalid session type. Please log in as a merchant.');
            merchantAuthService.logout();
            return;
          }
        } catch (tokenError) {
          setError('Invalid authentication token. Please log in again.');
          merchantAuthService.logout();
          return;
        }

        const profileResponse = await merchantAuthService.getCurrentMerchantProfile();
        
        if (profileResponse && profileResponse.success && profileResponse.merchantProfile) {
          const merchantProfile = profileResponse.merchantProfile;
          
          const merchantUserData = {
            id: merchantProfile.id || merchantProfile.merchant_id,
            name: `${merchantProfile.first_name || 'Merchant'} ${merchantProfile.last_name || ''}`.trim(),
            email: merchantProfile.email_address,
            role: 'merchant',
            userType: 'merchant',
            type: 'merchant',
            avatar: merchantProfile.avatar,
            storeId: merchantProfile.store?.id,
            storeName: merchantProfile.store?.name,
            merchantId: merchantProfile.id || merchantProfile.merchant_id,
            merchantProfile: merchantProfile,
            storeInfo: merchantProfile.store ? {
              id: merchantProfile.store.id,
              name: merchantProfile.store.name,
              logo: merchantProfile.store.logo_url,
              category: merchantProfile.store.category
            } : null
          };

          setUser(merchantUserData);
          localStorage.setItem('currentMerchant', JSON.stringify(merchantUserData));
          
        } else {
          const storedMerchant = localStorage.getItem('currentMerchant');
          if (storedMerchant) {
            try {
              const parsedMerchant = JSON.parse(storedMerchant);
              if (parsedMerchant && parsedMerchant.id && parsedMerchant.userType === 'merchant') {
                setUser(parsedMerchant);
                return;
              }
            } catch (e) {
              console.error('Error parsing stored merchant:', e);
            }
          }

          const token = merchantAuthService.getToken();
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              
              if (payload.type === 'merchant') {
                const basicMerchant = {
                  id: payload.id || payload.merchantId,
                  name: payload.name || 'Merchant User',
                  email: payload.email,
                  role: 'merchant',
                  userType: 'merchant',
                  type: 'merchant',
                  merchantId: payload.id || payload.merchantId
                };
                
                if (basicMerchant.id) {
                  setUser(basicMerchant);
                  localStorage.setItem('currentMerchant', JSON.stringify(basicMerchant));
                  return;
                }
              } else {
                throw new Error(`Invalid token type: ${payload.type}. Expected 'merchant'.`);
              }
            } catch (tokenError) {
              console.error('Error parsing merchant token:', tokenError);
            }
          }

          throw new Error('Failed to initialize merchant data - no valid merchant token found');
        }

      } catch (error) {
        console.error('Error in merchant initialization:', error);
        setError('Failed to initialize merchant store chat: ' + error.message);
        
        if (error.message?.includes('Authentication') || 
            error.message?.includes('401') || 
            error.message?.includes('403') ||
            error.message?.includes('merchant')) {
          setTimeout(() => {
            window.location.href = '/accounts/sign-in';
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    initializeMerchant();
  }, []);

  // Initialize socket with merchant user data
  const {
    socket,
    isConnected,
    joinConversation,
    leaveConversation,
    handleTyping,
    on,
    off,
    isUserOnline,
    getTypingUsers,
    connectionError
  } = useSocket(user && user.id && user.userType === 'merchant' ? user : null);

  // Socket event handlers for merchant handling customer↔store messages
  useEffect(() => {
    if (!socket || !user || !isConnected || user.userType !== 'merchant') {
      return;
    }
  
    const handleCustomerToStoreMessage = (messageData) => {
      if ((messageData.sender === 'user' || messageData.sender === 'customer' || messageData.sender_type === 'user')) {
        
        if (selectedCustomer && messageData.conversationId === selectedCustomer.conversationId) {
          setMessages(prev => {
            const exists = prev.find(msg => msg.id === messageData.id);
            if (exists) return prev;
            
            return [...prev, messageData];
          });
          scrollToBottom();
        }
        
        setCustomers(prev => {
          return prev.map(customer => {
            if (customer.id === messageData.conversationId) {
              return {
                ...customer,
                lastMessage: messageData.text || messageData.content,
                lastMessageTime: messageData.timestamp || 'now',
                unreadCount: (customer.unreadCount || 0) + 1
              };
            }
            return customer;
          });
        });

        setTimeout(() => {
          setRefreshing(true);
          setTimeout(() => setRefreshing(false), 100);
        }, 100);
      }
    };
    
    const handleNewMessage = (messageData) => {
      handleCustomerToStoreMessage(messageData);
    };

    const handleNewCustomerStoreConversation = (conversationData) => {
      if (conversationData.store?.merchantId === user.merchantId || 
          conversationData.merchantId === user.merchantId) {
        
        const newCustomerChat = {
          id: conversationData.chatId || conversationData.conversationId,
          conversationId: conversationData.chatId || conversationData.conversationId,
          customer: {
            id: conversationData.customer.id,
            name: conversationData.customer.name,
            avatar: conversationData.customer.avatar,
            email: conversationData.customer.email,
            customerSince: new Date().getFullYear(),
            orderCount: 0,
            priority: 'regular'
          },
          store: {
            id: conversationData.store.id,
            name: conversationData.store.name,
            logo: conversationData.store.logo
          },
          lastMessage: conversationData.initialMessage || 'Started a conversation with your store',
          lastMessageTime: 'now',
          unreadCount: conversationData.initialMessage ? 1 : 0,
          online: true
        };

        setCustomers(prev => [newCustomerChat, ...prev]);
      }
    };

    const handleMessageStatusUpdate = ({ messageId, status }) => {
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
    };

    const handleMessagesRead = ({ readBy, chatId }) => {
      if (selectedCustomer && chatId === selectedCustomer.conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.sender === 'store' ? { ...msg, status: 'read' } : msg
        ));
      }
    };

    const unsubscribers = [
      on('new_customer_to_store_message', handleCustomerToStoreMessage),
      on('new_message', handleNewMessage),
      on('new_customer_store_conversation', handleNewCustomerStoreConversation),
      on('message_status_update', handleMessageStatusUpdate),
      on('messages_read', handleMessagesRead)
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [socket, user, isConnected, on, selectedCustomer, setCustomers, setMessages]);

  // Load customer↔store conversations for merchant
  const loadConversations = async () => {
    if (!user || !user.id || user.userType !== 'merchant') {
      setError('Merchant user not initialized');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (!merchantAuthService.isAuthenticated()) {
        throw new Error('Merchant authentication expired. Please log in again.');
      }

      const response = await merchantChatService.getCustomerConversations();
      
      if (response && response.success) {
        setCustomers(response.data || []);
      } else {
        setError(response?.message || 'Failed to load customer↔store conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      
      if (error.message?.includes('Authentication') || 
          error.message?.includes('401') || 
          error.message?.includes('403')) {
        setError('Merchant session expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/accounts/sign-in';
        }, 2000);
      } else {
        setError('Failed to load store conversations: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load conversations when merchant is ready and connected
  useEffect(() => {
    if (user && user.id && user.userType === 'merchant' && isConnected) {
      loadConversations();
    }
  }, [user, isConnected]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadConversations();
      
      if (selectedCustomer) {
        await loadMessages(selectedCustomer.conversationId);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setError(null);
      
      const response = await merchantChatService.getCustomerMessages(conversationId);
      
      if (response.success) {
        setMessages(response.data);
        scrollToBottom();
      } else {
        setError('Failed to load messages');
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    }
  };

  const handleCustomerSelect = (customer) => {
    if (selectedCustomer) {
      leaveConversation(selectedCustomer.conversationId);
    }

    const customerData = {
      ...customer,
      conversationId: customer.id
    };
    
    setSelectedCustomer(customerData);
    joinConversation(customer.id);
    loadMessages(customer.id);
    markAsRead(customer.id);
  };

  const markAsRead = async (conversationId) => {
    try {
      await merchantChatService.markCustomerMessagesAsRead(conversationId);
      
      setCustomers(prev => prev.map(customer =>
        customer.id === conversationId
          ? { ...customer, unreadCount: 0 }
          : customer
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedCustomer || sendingMessage) return;

    const messageText = message.trim();
    
    try {
      setSendingMessage(true);
      setError(null);
      setMessage('');

      const response = await merchantChatService.replyToCustomer(
        selectedCustomer.conversationId,
        messageText,
        'text'
      );

      if (response.success) {
        const newMessage = {
          id: response.data.id || `temp-${Date.now()}`,
          text: messageText,
          sender: 'store',
          sender_type: 'store',
          senderInfo: {
            id: user.storeId || user.id,
            name: user.storeName || user.name + "'s Store",
            avatar: user.storeInfo?.logo || null,
            isStore: true
          },
          timestamp: 'now',
          status: 'sent',
          messageType: 'text',
          conversationId: selectedCustomer.conversationId
        };

        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
        
        setCustomers(prev => prev.map(customer =>
          customer.id === selectedCustomer.conversationId
            ? {
              ...customer,
              lastMessage: messageText,
              lastMessageTime: 'now'
            }
            : customer
        ));
      } else {
        throw new Error(response.message || 'Failed to send store message');
      }
    } catch (error) {
      console.error('Failed to send store message to customer:', error);
      setError(`Failed to send store message: ${error.message}`);
      setMessage(messageText);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    if (selectedCustomer) {
      handleTyping(selectedCustomer.conversationId);
    }
  };

  const handleBackToSidebar = () => {
    if (selectedCustomer) {
      leaveConversation(selectedCustomer.conversationId);
    }
    setSelectedCustomer(null);
    setMessages([]);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'unread' && customer.unreadCount > 0) ||
      (filterStatus === 'vip' && customer.customer?.priority === 'vip') ||
      (filterStatus === 'online' && isUserOnline(customer.customer?.id));
    
    return matchesSearch && matchesFilter;
  });

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickResponses = [
    "Thank you for contacting our store!",
    "Your order is being processed",
    "We have that item in stock",
    "Let me check that for you",
    "Is there anything else we can help with?"
  ];

  const handleQuickResponse = (response) => {
    setMessage(response);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const totalUnreadCount = customers.reduce((total, customer) => total + (customer.unreadCount || 0), 0);
  const typingUsers = selectedCustomer ? getTypingUsers(selectedCustomer.conversationId) : [];

  // Connection status component
  const ConnectionStatus = () => {
    const getStatus = () => {
      if (!user?.id) return { color: 'text-yellow-600', bg: 'bg-yellow-500', text: 'Initializing...' };
      if (user?.userType !== 'merchant') return { color: 'text-red-600', bg: 'bg-red-500', text: 'Invalid User Type' };
      if (!isConnected && connectionError) return { color: 'text-red-600', bg: 'bg-red-500', text: 'Connection Failed' };
      if (!isConnected) return { color: 'text-orange-600', bg: 'bg-orange-500', text: 'Connecting...' };
      return { color: 'text-green-600', bg: 'bg-green-500', text: 'Store Online' };
    };

    const status = getStatus();
    
    return (
      <div className={`flex items-center gap-2 text-sm ${status.color}`}>
        <div className={`w-2 h-2 rounded-full ${status.bg}`}></div>
        {status.text}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading merchant store chat...</p>
            {user && (
              <div className="text-sm text-gray-500 mt-2">
                <p>Merchant: {user.name}</p>
                <p>Store: {user.storeName || 'Loading...'}</p>
                <p>Type: {user.userType}</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  if (user && user.userType !== 'merchant') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Store Access Required</h2>
            <p className="text-gray-600 mb-4">
              This page is only accessible to store merchants.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Current user type: {user.userType || 'unknown'}
            </p>
            <button
              onClick={() => window.location.href = '/accounts/sign-in'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Merchant Login
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Customer Chat"
      subtitle={`Store customer support - ${customers.length} conversations`}
      showSearch={false}
    >
      {/* Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Store Customer Support
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-600">
                  Managing conversations for {user?.storeName || 'your store'}
                </p>
                <ConnectionStatus />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalUnreadCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  {totalUnreadCount} unread
                </span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing || !user?.id || user?.userType !== 'merchant'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              {error}
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm" style={{ height: '700px' }}>
        <div className="flex h-full">
          {/* Customer List Sidebar */}
          <div className={`${selectedCustomer
              ? 'hidden lg:flex'
              : 'flex'
            } w-full lg:w-96 flex-col bg-gray-50`}>
            
            {/* Search and Filter */}
            <div className="p-4 bg-white border-b border-gray-100">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="all">All Customers</option>
                    <option value="unread">Unread ({customers.filter(c => c.unreadCount > 0).length})</option>
                    <option value="vip">VIP Customers</option>
                    <option value="online">Online Now</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Customer List */}
            <div className="flex-1 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">
                      {searchTerm || filterStatus !== 'all' ? 'No matching customers' : 'No customer conversations'}
                    </p>
                    <p className="text-sm">
                      {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'Customer messages will appear here'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`flex items-start p-3 hover:bg-white cursor-pointer transition-all border-b border-gray-100 ${selectedCustomer?.conversationId === customer.id ? 'bg-white border-r-2 border-r-blue-500' : ''
                      }`}
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={customer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.customer?.name || 'Customer')}&background=random`}
                        alt={customer.customer?.name || 'Customer'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {isUserOnline(customer.customer?.id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      {customer.customer?.priority === 'vip' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">{customer.customer?.name || 'Unknown'}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{customer.lastMessageTime}</span>
                          {customer.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                              {customer.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-1">{customer.lastMessage}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{customer.customer?.orderCount || 0} orders</span>
                        <div className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          <span className="truncate max-w-20">{customer.store?.name || 'Store'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${selectedCustomer
              ? 'flex w-full'
              : 'hidden lg:flex lg:flex-1'
            } flex-col`}>
            {selectedCustomer ? (
              <>
                {/* Customer Chat Header */}
                <div className="bg-white p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center">
                    <button
                      onClick={handleBackToSidebar}
                      className="lg:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="relative">
                      <img
                        src={selectedCustomer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer?.name || 'Customer')}&background=random`}
                        alt={selectedCustomer.customer?.name || 'Customer'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      {selectedCustomer.customer?.priority === 'vip' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Star className="w-2 h-2 text-yellow-800" />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900">{selectedCustomer.customer?.name || 'Customer'}</h2>
                        {selectedCustomer.customer?.priority === 'vip' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">VIP</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {isUserOnline(selectedCustomer.customer?.id) ? 'Online' : 'Last seen recently'} • 
                        {selectedCustomer.customer?.orderCount || 0} orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-gray-400">
                      <div className="font-medium text-blue-500 flex items-center gap-1">
                        <Store className="w-3 h-3" />
                        {selectedCustomer.store?.name || user?.storeName || 'Store'}
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-lg font-medium mb-2">Customer Service Chat</p>
                        <p className="text-sm">Respond as {selectedCustomer.store?.name || 'your store'} to help {selectedCustomer.customer?.name || 'this customer'}</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isStore = msg.sender === 'store';
                      const isFirstInGroup = index === 0 || messages[index - 1].sender !== msg.sender;
                      const isLastInGroup = index === messages.length - 1 || messages[index + 1].sender !== msg.sender;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isStore ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-3' : 'mt-1'}`}
                        >
                          <div className="flex items-end space-x-2 max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
                            {/* Customer avatar for customer messages - only on last message in group */}
                            {!isStore && isLastInGroup && (
                              <img
                                src={selectedCustomer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer?.name || 'Customer')}&background=random`}
                                alt="Customer"
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            
                            {/* Spacer for grouped messages */}
                            {!isStore && !isLastInGroup && <div className="w-6"></div>}
                            
                            <div
                              className={`px-3 py-2 rounded-2xl shadow-sm ${
                                isStore
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                                } ${isStore && isLastInGroup ? 'rounded-br-md' : ''} ${!isStore && isLastInGroup ? 'rounded-bl-md' : ''}`}
                            >
                              {/* Store/Customer name - only on first message in group */}
                              {isFirstInGroup && (
                                <div className="flex items-center gap-1 mb-1">
                                  {isStore ? (
                                    <>
                                      <Store className="w-3 h-3 text-blue-200" />
                                      <span className="text-xs font-medium text-blue-200">
                                        {selectedCustomer.store?.name || user?.storeName || 'Store'}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <User className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs font-medium text-gray-500">
                                        {selectedCustomer.customer?.name || 'Customer'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-sm leading-relaxed">{msg.text}</p>
                              
                              {/* Timestamp and status - only on last message in group */}
                              {isLastInGroup && (
                                <div className={`flex items-center justify-end mt-1 space-x-1 ${
                                  isStore ? 'text-blue-200' : 'text-gray-400'
                                }`}>
                                  <span className="text-xs">{msg.timestamp}</span>
                                  {isStore && (
                                    <div className="ml-1">
                                      {msg.status === 'read' ? (
                                        <CheckCheck className="w-3 h-3" />
                                      ) : (
                                        <Check className="w-3 h-3" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Store avatar for store messages - only on last message in group */}
                            {isStore && isLastInGroup && (
                              <img
                                src={selectedCustomer.store?.logo || user?.storeInfo?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.store?.name || 'Store')}&background=2563eb&color=ffffff`}
                                alt="Store"
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            
                            {/* Spacer for grouped messages */}
                            {isStore && !isLastInGroup && <div className="w-6"></div>}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {typingUsers.length > 0 && (
                    <div className="flex justify-start mt-3">
                      <div className="flex items-end space-x-2">
                        <img
                          src={selectedCustomer.customer?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedCustomer.customer?.name || 'Customer')}&background=random`}
                          alt="Customer"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="bg-white px-3 py-2 rounded-2xl border border-gray-200 rounded-bl-md shadow-sm">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Responses */}
                <div className="bg-white p-3 border-t border-gray-100">
                  <div className="flex space-x-2 overflow-x-auto pb-1">
                    {quickResponses.map((response, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickResponse(response)}
                        className="flex-shrink-0 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs rounded-md transition-colors whitespace-nowrap"
                        title="Store quick response"
                      >
                        {response}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <div className="bg-white p-3 border-t border-gray-100">
                  <div className="flex items-end space-x-3">
                    <div className="flex-1 relative">
                      <div className="absolute top-1 left-3 flex items-center gap-1 text-xs text-gray-400">
                        <Store className="w-3 h-3" />
                        <span>{selectedCustomer.store?.name || user?.storeName || 'Store'}</span>
                      </div>
                      <textarea
                        value={message}
                        onChange={handleMessageChange}
                        onKeyPress={handleKeyPress}
                        placeholder={`Reply to ${selectedCustomer.customer?.name || 'customer'}...`}
                        rows={1}
                        disabled={sendingMessage || !isConnected}
                        className="w-full px-3 pt-6 pb-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32 disabled:bg-gray-50 text-sm"
                        style={{ minHeight: '50px' }}
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendingMessage || !isConnected}
                      className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      title={!isConnected ? 'Store offline' : 'Send store response'}
                    >
                      {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {!isConnected && (
                    <p className="text-xs text-orange-600 mt-2">Store is offline - reconnecting...</p>
                  )}
                </div>
              </>
            ) : (
              /* Welcome Screen */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Store className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Store Customer Support</h2>
                  <p className="text-gray-600 mb-6">
                    Select a customer from the sidebar to start providing store support. You'll be responding as your store to help customers.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-700">{totalUnreadCount} unread</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-gray-700">{customers.filter(c => c.customer?.priority === 'vip').length} VIP</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-700">{customers.length} total</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg border border-gray-100">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-700">{customers.filter(c => isUserOnline(c.customer?.id)).length} online</span>
                    </div>
                  </div>
                  
                  {user?.storeName && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <p className="text-sm text-blue-700">
                        Managing conversations for: <span className="font-semibold">{user.storeName}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MerchantChatInterface;