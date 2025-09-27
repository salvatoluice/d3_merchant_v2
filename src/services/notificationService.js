// services/notificationService.js - Fixed for merchant authentication
import axiosInstance from "./axiosInstance";
import merchantAuthService from "./merchantAuthService";

// Enhanced helper function to get auth headers
const getAuthHeaders = () => {
    const token = merchantAuthService.getToken();
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add debug info
    console.log('Auth headers for notifications:', {
        hasToken: !!token,
        tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });

    return headers;
};

// Enhanced error handler with merchant-specific logic
const handleApiError = (error, context = '') => {
    console.error(`Notification API Error ${context}:`, error);

    // Handle authentication errors
    if (error.response?.status === 401) {
        console.log('401 error - merchant auth failed, attempting logout...');
        merchantAuthService.logout();
        throw new Error('Merchant session expired. Please log in again.');
    }

    // Handle other HTTP errors
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    }

    // Handle network errors
    if (error.message === 'Network Error') {
        throw new Error('Network error. Please check your connection.');
    }

    throw error;
};

class NotificationService {
    constructor() {
        this.baseURL = '/api/v1/notifications'; // Fixed: Added full path
        this.cache = new Map();
        this.cacheTimeout = 30000;
        this.wsConnected = false;
    }

    // Simplified merchant authentication check
    isAuthenticated() {
        const isAuth = merchantAuthService.isAuthenticated();
        const merchant = merchantAuthService.getCurrentMerchant();
        
        console.log('Notification service auth check:', {
            isAuthenticated: isAuth,
            hasMerchant: !!merchant,
            merchantId: merchant?.id
        });
        
        // Simplified check - if merchant auth service says we're authenticated and we have merchant data, we're good
        return isAuth && !!merchant && !!merchant.id;
    }

    // Enhanced get notifications with better error handling
    async getNotifications(params = {}) {
        try {
            if (!this.isAuthenticated()) {
                console.warn('Not authenticated for notifications');
                return {
                    success: true,
                    data: {
                        notifications: [],
                        pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
                    }
                };
            }

            console.log('Fetching notifications with params:', params);

            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.type && params.type !== 'all') queryParams.append('type', params.type);
            if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
            if (params.storeId) queryParams.append('storeId', params.storeId);
            if (params.priority) queryParams.append('priority', params.priority);

            const url = `${this.baseURL}${queryParams.toString() ? `?${queryParams}` : ''}`;
            console.log('Making request to:', url);

            const response = await axiosInstance.get(url, {
                headers: getAuthHeaders(),
                timeout: 10000 // 10 second timeout
            });

            console.log('Notifications response:', response.data);

            // Handle different response structures
            if (response.data.success && response.data.data) {
                return {
                    success: true,
                    data: {
                        notifications: response.data.data.notifications.map(this.transformNotification.bind(this)),
                        pagination: response.data.data.pagination
                    }
                };
            }

            // Fallback for different response structures
            if (Array.isArray(response.data)) {
                return {
                    success: true,
                    data: {
                        notifications: response.data.map(this.transformNotification.bind(this)),
                        pagination: { currentPage: 1, totalPages: 1, totalCount: response.data.length }
                    }
                };
            }

            // Default empty response
            return {
                success: true,
                data: {
                    notifications: [],
                    pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
                }
            };

        } catch (error) {
            console.error('Error fetching notifications:', error);
            
            // Return empty data instead of throwing for better UX
            return {
                success: false,
                error: error.message,
                data: {
                    notifications: [],
                    pagination: { currentPage: 1, totalPages: 1, totalCount: 0 }
                }
            };
        }
    }

    // Enhanced get notification counts with better fallbacks
    async getNotificationCounts(storeId = null) {
        try {
            if (!this.isAuthenticated()) {
                console.warn('Not authenticated for notification counts');
                return this.getDefaultCounts();
            }

            const cacheKey = `counts_${storeId || 'all'}`;
            
            // Check cache first
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log('Returning cached notification counts');
                    return cached.data;
                }
            }

            console.log('Fetching fresh notification counts...');

            const params = storeId ? `?storeId=${storeId}` : '';
            const response = await axiosInstance.get(`${this.baseURL}/counts${params}`, {
                headers: getAuthHeaders(),
                timeout: 8000
            });

            console.log('Notification counts response:', response.data);

            let counts = response.data.success ? response.data.data : response.data;

            // Ensure all required fields exist with enhanced defaults
            counts = {
                total: counts.total || 0,
                unread: counts.unread || 0,
                urgent: counts.urgent || 0,
                scheduled: counts.scheduled || 0,
                byType: {
                    new_message: 0,
                    booking_created: 0,
                    booking_confirmed: 0,
                    booking_cancelled: 0,
                    offer_accepted: 0,
                    offer_rejected: 0,
                    new_review: 0,
                    store_follow: 0,
                    payment_received: 0,
                    service_request_offer: 0,
                    system_announcement: 0,
                    ...counts.byType
                },
                byPriority: {
                    low: 0,
                    normal: 0,
                    high: 0,
                    urgent: 0,
                    ...counts.byPriority
                }
            };

            const result = { success: true, data: counts };

            // Cache the result
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;

        } catch (error) {
            console.error('Error fetching notification counts:', error);
            return this.getDefaultCounts();
        }
    }

    // Helper method for default counts
    getDefaultCounts() {
        return {
            success: true,
            data: {
                total: 0,
                unread: 0,
                urgent: 0,
                scheduled: 0,
                byType: {
                    new_message: 0,
                    booking_created: 0,
                    booking_confirmed: 0,
                    booking_cancelled: 0,
                    offer_accepted: 0,
                    offer_rejected: 0,
                    new_review: 0,
                    store_follow: 0,
                    payment_received: 0,
                    service_request_offer: 0,
                    system_announcement: 0
                },
                byPriority: {
                    low: 0,
                    normal: 0,
                    high: 0,
                    urgent: 0
                }
            }
        };
    }

    // Enhanced mark as read with proper error handling
    async markAsRead(notificationId) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            console.log('Marking notification as read:', notificationId);

            const response = await axiosInstance.put(`${this.baseURL}/${notificationId}/read`, {}, {
                headers: getAuthHeaders(),
                timeout: 5000
            });

            console.log('Mark as read response:', response.data);
            this.clearCountsCache();

            return response.data.success ? response.data : { success: true };

        } catch (error) {
            console.error('Error marking notification as read:', error);
            handleApiError(error, 'marking notification as read');
        }
    }

    // Enhanced mark all as read
    async markAllAsRead(filters = {}) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            console.log('Marking all notifications as read with filters:', filters);

            const queryParams = new URLSearchParams();
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.storeId) queryParams.append('storeId', filters.storeId);
            if (filters.priority) queryParams.append('priority', filters.priority);

            const url = `${this.baseURL}/mark-all-read${queryParams.toString() ? `?${queryParams}` : ''}`;

            const response = await axiosInstance.put(url, {}, {
                headers: getAuthHeaders(),
                timeout: 8000
            });

            console.log('Mark all as read response:', response.data);
            this.clearCountsCache();

            return response.data.success ? response.data : { success: true };

        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            handleApiError(error, 'marking all notifications as read');
        }
    }

    // Enhanced transformation with better defaults
    transformNotification(notification) {
        return {
            id: notification.id,
            userId: notification.userId,
            senderId: notification.senderId,
            storeId: notification.storeId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data || notification.metadata || {},
            read: notification.read || notification.isRead || false,
            readAt: notification.readAt,
            actionUrl: notification.actionUrl,
            actionType: notification.actionType || 'navigate',
            priority: notification.priority || 'normal',
            channels: notification.channels || {},
            deliveryStatus: notification.deliveryStatus || {},
            relatedEntityType: notification.relatedEntityType,
            relatedEntityId: notification.relatedEntityId,
            groupKey: notification.groupKey,
            scheduledFor: notification.scheduledFor,
            expiresAt: notification.expiresAt,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
            // Enhanced fields with better fallbacks
            sender: notification.sender ? {
                id: notification.sender.id,
                name: notification.sender.name || 
                     `${notification.sender.firstName || ''} ${notification.sender.lastName || ''}`.trim() ||
                     notification.sender.firstName || 'Unknown User',
                avatar: notification.sender.avatar,
                userType: notification.sender.userType
            } : null,
            store: notification.store ? {
                id: notification.store.id,
                name: notification.store.name,
                logo: notification.store.logo_url || notification.store.logo,
                category: notification.store.category,
                location: notification.store.location
            } : null,
            // Computed fields
            timeAgo: notification.timeAgo || this.formatTimeAgo(notification.createdAt),
            isNew: notification.isNew !== undefined ? notification.isNew : this.isNewNotification(notification.createdAt),
            isRead: notification.read || notification.isRead || false
        };
    }

    // Rest of the methods remain the same...
    formatTimeAgo(timestamp) {
        if (!timestamp) return 'Unknown';
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return time.toLocaleDateString();
    }

    isNewNotification(timestamp) {
        if (!timestamp) return false;
        
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / (1000 * 60));
        return diffInMinutes < 60;
    }

    clearCountsCache() {
        for (const key of this.cache.keys()) {
            if (key.startsWith('counts_')) {
                this.cache.delete(key);
            }
        }
    }

    // Test connection method
    async testConnection() {
        try {
            if (!this.isAuthenticated()) {
                return { success: false, error: 'Not authenticated' };
            }

            console.log('Testing notification service connection...');
            
            const response = await axiosInstance.get(`${this.baseURL}/health`, {
                headers: getAuthHeaders(),
                timeout: 5000
            });
            
            console.log('Notification service test successful:', response.data);
            return { success: true, data: response.data };
            
        } catch (error) {
            console.error('Notification service test failed:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create and export singleton instance
const notificationService = new NotificationService();

export default notificationService;