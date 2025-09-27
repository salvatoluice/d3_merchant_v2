import React, { useState, useEffect } from 'react';
import Layout from '../elements/Layout';
import {
    Search,
    Filter,
    Mail,
    Phone,
    MessageCircle,
    Star,
    Calendar,
    User,
    Users,
    Send,
    ChevronDown,
    SortAsc,
    SortDesc,
    CheckSquare,
    Square,
    AlertCircle,
    RefreshCw,
    X,
    Plus,
    UserPlus,
    Heart,
    ShoppingBag,
    TrendingUp,
    Eye,
    Crown,
    Clock,
    Activity
} from 'lucide-react';

// Import existing API services
import {
    fetchMyStoreFollowers,
    fetchBookingsWithCustomers,
    sendBulkEmail,
    getMerchantStores
} from '../services/api_service';
import merchantAuthService from '../services/merchantAuthService';

const ClientsPage = () => {
    const [followers, setFollowers] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('followers');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterBookingType, setFilterBookingType] = useState('all');
    const [selectedFollowers, setSelectedFollowers] = useState(new Set());
    const [selectedCustomers, setSelectedCustomers] = useState(new Set());
    const [showBulkEmail, setShowBulkEmail] = useState(false);
    const [bulkEmailSubject, setBulkEmailSubject] = useState('');
    const [bulkEmailMessage, setBulkEmailMessage] = useState('');
    const [sendingBulkEmail, setSendingBulkEmail] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [authStatus, setAuthStatus] = useState(null);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = () => {
            const status = merchantAuthService.checkAuthenticationStatus();
            setAuthStatus(status);

            if (!status.isAuthenticated) {
                setError('Please log in to view your clients');
                setLoading(false);
                return false;
            }

            if (merchantAuthService.shouldLogout()) {
                console.log('Logout required due to authentication error');
                merchantAuthService.logout();
                return false;
            }

            return true;
        };

        if (checkAuth()) {
            loadData();
        }
    }, []);

    // Enhanced error handling for auth issues
    const handleAuthError = (error) => {
        console.error('Authentication error:', error);

        if (error.message.includes('session has expired') ||
            error.message.includes('Authentication required') ||
            error.message.includes('Please log in again')) {

            setError('Your session has expired. Please log in again.');
            setTimeout(() => {
                merchantAuthService.logout();
            }, 2000);
        } else {
            setError(error.message || 'Failed to load client data');
        }
    };

    // Process followers data
    const processFollowersData = (followersData) => {
        if (!Array.isArray(followersData)) return [];

        return followersData.map(follower => ({
            id: follower.id,
            name: `${follower.first_name || follower.firstName || ''} ${follower.last_name || follower.lastName || ''}`.trim() || 'Unknown User',
            email: follower.email || follower.email_address || 'No email provided',
            phone: follower.phone || follower.phone_number || 'No phone provided',
            avatar: follower.avatar || null,
            followedSince: follower.Follow?.createdAt || follower.followedAt || new Date().toISOString(),
            isVip: follower.isVip || false,
            lastActive: follower.lastActiveAt || follower.updatedAt || new Date().toISOString()
        }));
    };

    // Process customers data from bookings
    const processCustomersData = (bookingsData) => {
        if (!Array.isArray(bookingsData)) return [];

        const customerMap = new Map();

        bookingsData.forEach(booking => {
            const userId = booking.userId || booking.user_id;
            const user = booking.User || booking.user;

            if (!user || !userId) return;

            const userName = `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim() || 'Unknown Customer';
            const userEmail = user.email || user.email_address || 'No email provided';
            const userPhone = user.phone || user.phone_number || 'No phone provided';

            if (!customerMap.has(userId)) {
                customerMap.set(userId, {
                    id: userId,
                    name: userName,
                    email: userEmail,
                    phone: userPhone,
                    avatar: user.avatar || null,
                    bookings: [],
                    totalBookings: 0,
                    totalSpent: 0,
                    lastBookingDate: null,
                    isVip: false,
                    bookingTypes: new Set()
                });
            }

            const customer = customerMap.get(userId);
            customer.bookings.push(booking);
            customer.totalBookings += 1;

            const bookingAmount = booking.amount || booking.accessFee || 0;
            customer.totalSpent += parseFloat(bookingAmount) || 0;

            const bookingType = booking.bookingType || (booking.offerId ? 'offer' : 'service');
            customer.bookingTypes.add(bookingType);

            const bookingDate = new Date(booking.createdAt || booking.created_at);
            if (!customer.lastBookingDate || bookingDate > new Date(customer.lastBookingDate)) {
                customer.lastBookingDate = bookingDate.toISOString();
            }

            if (customer.totalBookings >= 3 || customer.totalSpent >= 200) {
                customer.isVip = true;
            }
        });

        return Array.from(customerMap.values()).map(customer => ({
            ...customer,
            totalSpent: `$${customer.totalSpent.toFixed(2)}`,
            bookingType: customer.bookingTypes.has('offer') ? 'offer' : 'service',
            bookingDetails: customer.bookingTypes.has('offer') ? 'Offer Bookings' : 'Service Bookings',
            lastBookingDate: customer.lastBookingDate
        }));
    };

    // Load all data using existing API services
    const loadData = async (showRefreshing = false) => {
        try {
            if (showRefreshing) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);

            const authCheck = merchantAuthService.checkAuthenticationStatus();
            if (!authCheck.isAuthenticated) {
                throw new Error('Authentication required. Please log in again.');
            }

            const [followersResult, customersResult] = await Promise.allSettled([
                fetchMyStoreFollowers(),
                fetchBookingsWithCustomers()
            ]);

            if (followersResult.status === 'fulfilled' && followersResult.value?.success) {
                const followersData = followersResult.value.followers || [];
                setFollowers(processFollowersData(followersData));
            } else {
                setFollowers([]);
                if (followersResult.reason?.message?.includes('Authentication') ||
                    followersResult.reason?.message?.includes('session has expired')) {
                    handleAuthError(followersResult.reason);
                    return;
                }
            }

            if (customersResult.status === 'fulfilled' && customersResult.value?.success) {
                const bookingsData = customersResult.value.bookings || [];
                setCustomers(processCustomersData(bookingsData));
            } else {
                setCustomers([]);
                if (customersResult.reason?.message?.includes('Authentication') ||
                    customersResult.reason?.message?.includes('session has expired')) {
                    handleAuthError(customersResult.reason);
                    return;
                }
            }

        } catch (error) {
            console.error('Failed to load client data:', error);
            handleAuthError(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refresh data
    const handleRefresh = () => {
        loadData(true);
    };

    // Handle individual contact actions
    const handleSendMessage = (person) => {
        console.log('Navigate to chat with:', person.name);
    };

    const handleSendEmail = (person) => {
        const subject = `Message from ${merchantAuthService.getCurrentMerchant()?.first_name || 'Your Store'}`;
        const mailtoLink = `mailto:${person.email}?subject=${encodeURIComponent(subject)}`;
        window.open(mailtoLink, '_blank');
    };

    const handlePhoneCall = (person) => {
        if (typeof window !== 'undefined') {
            window.open(`tel:${person.phone}`, '_self');
        }
    };

    // Selection handlers
    const handleSelectFollower = (followerId) => {
        setSelectedFollowers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(followerId)) {
                newSet.delete(followerId);
            } else {
                newSet.add(followerId);
            }
            return newSet;
        });
    };

    const handleSelectCustomer = (customerId) => {
        setSelectedCustomers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(customerId)) {
                newSet.delete(customerId);
            } else {
                newSet.add(customerId);
            }
            return newSet;
        });
    };

    // Filter and sort functions
    const filteredFollowers = followers
        .filter(follower =>
            follower.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            follower.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'followedSince':
                    aValue = new Date(a.followedSince);
                    bValue = new Date(b.followedSince);
                    break;
                case 'lastActive':
                    aValue = new Date(a.lastActive);
                    bValue = new Date(b.lastActive);
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    const filteredCustomers = customers
        .filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBookingType = filterBookingType === 'all' || customer.bookingType === filterBookingType;
            return matchesSearch && matchesBookingType;
        })
        .sort((a, b) => {
            let aValue, bValue;

            switch (sortBy) {
                case 'name':
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
                    break;
                case 'lastBookingDate':
                    aValue = new Date(a.lastBookingDate);
                    bValue = new Date(b.lastBookingDate);
                    break;
                case 'totalBookings':
                    aValue = a.totalBookings;
                    bValue = b.totalBookings;
                    break;
                case 'totalSpent':
                    aValue = parseFloat(a.totalSpent.replace('$', '').replace(',', ''));
                    bValue = parseFloat(b.totalSpent.replace('$', '').replace(',', ''));
                    break;
                default:
                    aValue = a.name.toLowerCase();
                    bValue = b.name.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

    const handleSelectAllFollowers = () => {
        if (selectedFollowers.size === filteredFollowers.length) {
            setSelectedFollowers(new Set());
        } else {
            setSelectedFollowers(new Set(filteredFollowers.map(f => f.id)));
        }
    };

    const handleSelectAllCustomers = () => {
        if (selectedCustomers.size === filteredCustomers.length) {
            setSelectedCustomers(new Set());
        } else {
            setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
        }
    };

    // Enhanced bulk email handler
    const handleBulkEmail = async () => {
        if (!bulkEmailSubject.trim() || !bulkEmailMessage.trim()) {
            alert('Please fill in both subject and message fields');
            return;
        }

        try {
            setSendingBulkEmail(true);

            const recipients = activeTab === 'followers'
                ? followers.filter(f => selectedFollowers.has(f.id))
                : customers.filter(c => selectedCustomers.has(c.id));

            await sendBulkEmail(
                recipients.map(r => ({
                    id: r.id,
                    email: r.email,
                    name: r.name
                })),
                bulkEmailSubject,
                bulkEmailMessage,
                'client_communication'
            );

            alert(`Bulk email sent to ${recipients.length} recipients!`);
            setShowBulkEmail(false);
            setBulkEmailSubject('');
            setBulkEmailMessage('');
            setSelectedFollowers(new Set());
            setSelectedCustomers(new Set());
        } catch (error) {
            console.error('Failed to send bulk email:', error);

            if (error.message.includes('Authentication') || error.message.includes('session has expired')) {
                handleAuthError(error);
            } else {
                alert('Failed to send bulk email. Please try again.');
            }
        } finally {
            setSendingBulkEmail(false);
        }
    };

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-16">
            <div className="text-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading your clients...</p>
            </div>
        </div>
    );

    const ContactActions = ({ person }) => (
        <div className="flex space-x-2">
            <button
                onClick={() => handleSendMessage(person)}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Send Message"
            >
                <MessageCircle className="w-4 h-4" />
            </button>
            <button
                onClick={() => handleSendEmail(person)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Send Email"
            >
                <Mail className="w-4 h-4" />
            </button>
            <button
                onClick={() => handlePhoneCall(person)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Call"
            >
                <Phone className="w-4 h-4" />
            </button>
        </div>
    );

    // Show login prompt if not authenticated
    if (authStatus && !authStatus.isAuthenticated) {
        return (
            <Layout 
                title="Client Management"
                subtitle="Connect with your customers and followers"
            >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
                        <p className="text-gray-600 mb-6">Please log in to view your clients</p>
                        <button
                            onClick={() => merchantAuthService.logout()}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    if (loading) {
        return (
            <Layout 
                title="Client Management"
                subtitle="Connect with your customers and followers"
            >
                <LoadingSpinner />
            </Layout>
        );
    }

    return (
        <Layout 
            title="Client Management"
            subtitle="Connect with your customers and followers"
        >
            <div className="space-y-8">
                {/* Header Stats Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Your Client Base</h2>
                                <p className="text-indigo-100">Build relationships and grow your business</p>
                            </div>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white font-medium rounded-xl hover:bg-opacity-30 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="flex items-center space-x-2">
                                    <Heart className="h-5 w-5 text-pink-200" />
                                    <div className="text-2xl font-bold">{followers.length}</div>
                                </div>
                                <div className="text-sm text-indigo-100">Followers</div>
                            </div>
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="flex items-center space-x-2">
                                    <ShoppingBag className="h-5 w-5 text-purple-200" />
                                    <div className="text-2xl font-bold">{customers.length}</div>
                                </div>
                                <div className="text-sm text-indigo-100">Customers</div>
                            </div>
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="flex items-center space-x-2">
                                    <Crown className="h-5 w-5 text-yellow-200" />
                                    <div className="text-2xl font-bold">
                                        {[...followers, ...customers].filter(c => c.isVip).length}
                                    </div>
                                </div>
                                <div className="text-sm text-indigo-100">VIP Clients</div>
                            </div>
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="flex items-center space-x-2">
                                    <TrendingUp className="h-5 w-5 text-green-200" />
                                    <div className="text-2xl font-bold">{followers.length + customers.length}</div>
                                </div>
                                <div className="text-sm text-indigo-100">Total Reach</div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white bg-opacity-10"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white bg-opacity-5"></div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-red-800 font-medium">{error}</p>
                            <div className="mt-2 space-x-2">
                                <button
                                    onClick={handleRefresh}
                                    className="text-red-600 hover:text-red-700 underline text-sm"
                                >
                                    Try again
                                </button>
                                {error.includes('session has expired') && (
                                    <button
                                        onClick={() => merchantAuthService.logout()}
                                        className="text-red-600 hover:text-red-700 underline text-sm"
                                    >
                                        Go to login
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('followers')}
                                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${
                                    activeTab === 'followers'
                                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <Heart className="w-4 h-4" />
                                <span>Followers ({followers.length})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('customers')}
                                className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 ${
                                    activeTab === 'customers'
                                        ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <ShoppingBag className="w-4 h-4" />
                                <span>Customers ({customers.length})</span>
                            </button>
                        </nav>
                    </div>

                    {/* Controls */}
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab}...`}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                />
                            </div>

                            {/* Sort Controls */}
                            <div className="flex gap-2">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="name">Sort by Name</option>
                                    {activeTab === 'followers' ? (
                                        <>
                                            <option value="followedSince">Followed Since</option>
                                            <option value="lastActive">Last Active</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="lastBookingDate">Last Booking</option>
                                            <option value="totalBookings">Total Bookings</option>
                                            <option value="totalSpent">Total Spent</option>
                                        </>
                                    )}
                                </select>
                                
                                <button
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
                                </button>
                            </div>

                            {/* Booking Type Filter (customers only) */}
                            {activeTab === 'customers' && (
                                <select
                                    value={filterBookingType}
                                    onChange={(e) => setFilterBookingType(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                >
                                    <option value="all">All Bookings</option>
                                    <option value="service">Service Bookings</option>
                                    <option value="offer">Offer Bookings</option>
                                </select>
                            )}
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={activeTab === 'followers' ? handleSelectAllFollowers : handleSelectAllCustomers}
                                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                >
                                    {(activeTab === 'followers' && selectedFollowers.size === filteredFollowers.length) ||
                                        (activeTab === 'customers' && selectedCustomers.size === filteredCustomers.length) ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                                    ) : (
                                        <Square className="w-4 h-4" />
                                    )}
                                    <span>Select All</span>
                                </button>
                                {((activeTab === 'followers' && selectedFollowers.size > 0) ||
                                    (activeTab === 'customers' && selectedCustomers.size > 0)) && (
                                        <span className="text-sm text-indigo-600 font-medium">
                                            {activeTab === 'followers' ? selectedFollowers.size : selectedCustomers.size} selected
                                        </span>
                                    )}
                            </div>

                            {((activeTab === 'followers' && selectedFollowers.size > 0) ||
                                (activeTab === 'customers' && selectedCustomers.size > 0)) && (
                                    <button
                                        onClick={() => setShowBulkEmail(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        <span>Bulk Email</span>
                                    </button>
                                )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {activeTab === 'followers' ? (
                            filteredFollowers.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Heart className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {followers.length === 0 ? 'No followers yet' : 'No followers found'}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {followers.length === 0 
                                            ? 'Share your store to gain followers and build your community!'
                                            : 'Try adjusting your search terms or filters.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredFollowers.map((follower) => (
                                        <div
                                            key={follower.id}
                                            className="flex items-center justify-between p-6 border border-gray-200 rounded-2xl hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => handleSelectFollower(follower.id)}
                                                    className="text-gray-600 hover:text-indigo-600 transition-colors"
                                                >
                                                    {selectedFollowers.has(follower.id) ? (
                                                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                                
                                                <div className="relative">
                                                    <img
                                                        src={follower.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.name)}&background=6366f1&color=fff`}
                                                        alt={follower.name}
                                                        className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-100"
                                                    />
                                                    {follower.isVip && (
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                                            <Crown className="w-3 h-3 text-yellow-800" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-gray-900">{follower.name}</h3>
                                                        {follower.isVip && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{follower.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{follower.phone}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-xs text-gray-500 mt-2">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>Following since {new Date(follower.followedSince).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <ContactActions person={follower} />
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            filteredCustomers.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShoppingBag className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {customers.length === 0 ? 'No customers yet' : 'No customers found'}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {customers.length === 0
                                            ? 'Enable bookings to start getting customers and building your client base!'
                                            : 'Try adjusting your search terms or filters.'
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredCustomers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center justify-between p-6 border border-gray-200 rounded-2xl hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <button
                                                    onClick={() => handleSelectCustomer(customer.id)}
                                                    className="text-gray-600 hover:text-indigo-600 transition-colors"
                                                >
                                                    {selectedCustomers.has(customer.id) ? (
                                                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                    ) : (
                                                        <Square className="w-5 h-5" />
                                                    )}
                                                </button>
                                                
                                                <div className="relative">
                                                    <img
                                                        src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=059669&color=fff`}
                                                        alt={customer.name}
                                                        className="w-14 h-14 rounded-2xl object-cover border-2 border-gray-100"
                                                    />
                                                    {customer.isVip && (
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                                                            <Crown className="w-3 h-3 text-yellow-800" />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                                            customer.bookingType === 'service'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-emerald-100 text-emerald-800'
                                                        }`}>
                                                            {customer.bookingType === 'service' ? 'Service' : 'Offer'}
                                                        </span>
                                                        {customer.isVip && (
                                                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-6 text-xs text-gray-500 mt-2">
                                                        <div className="flex items-center space-x-1">
                                                            <Clock className="w-3 h-3" />
                                                            <span>Last: {customer.lastBookingDate ? new Date(customer.lastBookingDate).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <ShoppingBag className="w-3 h-3" />
                                                            <span>{customer.totalBookings} bookings</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            <span>{customer.totalSpent} spent</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <ContactActions person={customer} />
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Bulk Email Modal */}
                {showBulkEmail && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Send Bulk Email</h3>
                                <button
                                    onClick={() => setShowBulkEmail(false)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <Users className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-indigo-900">Recipients</h4>
                                            <p className="text-sm text-indigo-700">
                                                Sending to {activeTab === 'followers' ? selectedFollowers.size : selectedCustomers.size} {activeTab}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email Subject *</label>
                                    <input
                                        type="text"
                                        value={bulkEmailSubject}
                                        onChange={(e) => setBulkEmailSubject(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                        placeholder="Enter email subject"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email Message *</label>
                                    <textarea
                                        value={bulkEmailMessage}
                                        onChange={(e) => setBulkEmailMessage(e.target.value)}
                                        rows={5}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                                        placeholder="Enter your message to clients"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
                                <button
                                    onClick={() => setShowBulkEmail(false)}
                                    className="flex-1 px-4 py-3 text-gray-700 font-medium rounded-xl hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkEmail}
                                    disabled={sendingBulkEmail || !bulkEmailSubject.trim() || !bulkEmailMessage.trim()}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {sendingBulkEmail ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Email
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default ClientsPage;