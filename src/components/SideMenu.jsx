import React, { useState, useEffect } from "react";
import {
    LayoutDashboard,
    MessageSquare,
    Layers,
    HandHeart,
    TrendingUp,
    Calendar,
    Users,
    BookOpen,
    MessageCircle,
    Share2,
    CreditCard,
    User,
    LogOut,
    Store,
    UserCircle,
    ChevronLeft,
    ChevronRight,
    Menu
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import merchantAuthService from '../services/merchantAuthService';
import { toast } from 'react-hot-toast';

const Sidebar = ({ onClose, currentMerchant, isCollapsed = false, onToggleCollapse }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [chatUnreadCount, setChatUnreadCount] = useState(0);
    const [isLoadingChatCount, setIsLoadingChatCount] = useState(false);
    const [lastCountUpdate, setLastCountUpdate] = useState(0);
    
    const location = useLocation();
    const navigate = useNavigate();

    // Determine if sidebar should be expanded (either not collapsed OR hovered when collapsed)
    const isExpanded = !isCollapsed || (isCollapsed && isHovered);

    // All your existing chat count functionality
    const loadChatCount = async () => {
        if (!merchantAuthService.isAuthenticated()) {
            console.log('User not authenticated, skipping chat count');
            return;
        }

        try {
            setIsLoadingChatCount(true);
            console.log('🔍 Loading chat count via direct API calls...');

            const token = merchantAuthService.getToken();
            if (!token) {
                console.log('❌ No token available');
                return;
            }

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'User-Type': 'merchant'
            };

            const endpoints = [
                'http://localhost:4000/api/v1/chat/merchant/unread-count',
                'http://localhost:4000/api/v1/chat/unread-count', 
                'http://localhost:4000/api/v1/merchant/chat/unread',
                'http://localhost:4000/api/v1/chat/merchant/conversations',
                'http://localhost:4000/api/v1/notifications/counts?type=new_message'
            ];

            let unreadCount = 0;
            let successfulEndpoint = null;

            for (const endpoint of endpoints) {
                try {
                    console.log(`🔗 Trying endpoint: ${endpoint}`);
                    
                    const response = await fetch(endpoint, {
                        method: 'GET',
                        headers: headers,
                        credentials: 'include',
                        mode: 'cors'
                    });

                    console.log(`📡 Response status: ${response.status}`);

                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ Success with ${endpoint}:`, data);
                        
                        if (endpoint.includes('conversations')) {
                            if (data.success && Array.isArray(data.data)) {
                                unreadCount = data.data.reduce((total, conv) => {
                                    return total + (conv.unreadCount || 0);
                                }, 0);
                                console.log(`📊 Counted ${unreadCount} unread from conversations`);
                            }
                        } else if (data.success !== undefined) {
                            unreadCount = data.data?.count || data.data?.unread || data.data?.total || 0;
                        } else if (typeof data.count === 'number') {
                            unreadCount = data.count;
                        } else if (typeof data === 'number') {
                            unreadCount = data;
                        }
                        
                        successfulEndpoint = endpoint;
                        break;
                    }
                } catch (fetchError) {
                    console.log(`❌ ${endpoint} request failed:`, fetchError.message);
                }
            }

            if (successfulEndpoint) {
                console.log(`✅ Successfully got count ${unreadCount} from ${successfulEndpoint}`);
                setChatUnreadCount(Math.max(0, unreadCount));
                setLastCountUpdate(Date.now());
                localStorage.setItem('workingChatEndpoint', successfulEndpoint);
                localStorage.setItem('cachedChatCount', unreadCount.toString());
            } else {
                console.log('❌ All endpoints failed, trying cached count...');
                const cachedCount = localStorage.getItem('cachedChatCount');
                if (cachedCount && !isNaN(parseInt(cachedCount))) {
                    const cached = parseInt(cachedCount);
                    console.log('📦 Using cached count:', cached);
                    setChatUnreadCount(cached);
                } else {
                    console.log('💭 No cached count available, setting to 0');
                    setChatUnreadCount(0);
                }
            }

        } catch (error) {
            console.error('💥 Critical error in loadChatCount:', error);
            setChatUnreadCount(0);
        } finally {
            setIsLoadingChatCount(false);
        }
    };

    const quickCountUpdate = async () => {
        const workingEndpoint = localStorage.getItem('workingChatEndpoint');
        if (!workingEndpoint || !merchantAuthService.isAuthenticated()) {
            return;
        }

        try {
            const token = merchantAuthService.getToken();
            const response = await fetch(workingEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'User-Type': 'merchant'
                },
                credentials: 'include',
                mode: 'cors'
            });

            if (response.ok) {
                const data = await response.json();
                let count = 0;
                
                if (workingEndpoint.includes('conversations') && data.success && Array.isArray(data.data)) {
                    count = data.data.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
                } else {
                    count = data.data?.count || data.data?.unread || data.count || 0;
                }

                setChatUnreadCount(Math.max(0, count));
                localStorage.setItem('cachedChatCount', count.toString());
                console.log(`⚡ Quick update: ${count} unread messages`);
            }
        } catch (error) {
            console.log('⚡ Quick update failed, will use full reload next time');
        }
    };

    // All your existing useEffects
    useEffect(() => {
        console.log('🚀 Initial chat count load triggered');
        loadChatCount();
    }, [currentMerchant?.id]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.io) {
            console.log('📡 WebSocket not available for chat count updates');
            return;
        }

        console.log('🔗 Setting up WebSocket listeners for chat count...');

        const handleNewCustomerMessage = (messageData) => {
            console.log('📨 WebSocket: New customer message received:', messageData);
            
            const isCustomerMessage = messageData.sender === 'user' || 
                                    messageData.sender === 'customer' || 
                                    messageData.sender_type === 'user' ||
                                    messageData.senderType === 'user';

            if (isCustomerMessage) {
                setChatUnreadCount(prev => {
                    const newCount = prev + 1;
                    console.log(`📈 Chat count incremented: ${prev} → ${newCount}`);
                    localStorage.setItem('cachedChatCount', newCount.toString());
                    return newCount;
                });
                setLastCountUpdate(Date.now());
            }
        };

        const handleMessagesRead = (data) => {
            console.log('📖 WebSocket: Messages marked as read:', data);
            setTimeout(quickCountUpdate, 500);
        };

        const eventHandlers = [
            ['new_customer_to_store_message', handleNewCustomerMessage],
            ['new_message', handleNewCustomerMessage],
            ['customer_message', handleNewCustomerMessage],
            ['messages_read', handleMessagesRead],
            ['chat_opened', handleMessagesRead],
            ['messages_marked_read', handleMessagesRead]
        ];

        eventHandlers.forEach(([event, handler]) => {
            window.io.on(event, handler);
        });

        return () => {
            eventHandlers.forEach(([event, handler]) => {
                window.io.off(event, handler);
            });
            console.log('🧹 WebSocket listeners cleaned up');
        };
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastCountUpdate;
            
            if (merchantAuthService.isAuthenticated() && 
                document.visibilityState === 'visible' &&
                location.pathname !== '/dashboard/chat' &&
                timeSinceLastUpdate > 15000) {
                
                console.log('⏰ Periodic chat count refresh');
                quickCountUpdate();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [location.pathname, lastCountUpdate]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && 
                merchantAuthService.isAuthenticated() && 
                location.pathname !== '/dashboard/chat') {
                
                console.log('👁️ Page became visible, refreshing chat count');
                setTimeout(quickCountUpdate, 1000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [location.pathname]);

    const menuItems = [
        {
            name: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            path: "/dashboard",
        },
        {
            name: "Chat",
            icon: <MessageSquare size={20} />,
            path: "/dashboard/chat",
            badge: chatUnreadCount > 0 ? (chatUnreadCount > 99 ? '99+' : chatUnreadCount.toString()) : null,
            badgeColor: chatUnreadCount > 5 ? "bg-red-600" : "bg-red-500",
            isLoading: isLoadingChatCount,
            showPulse: chatUnreadCount > 0
        },
        {
            name: "Services",
            icon: <Layers size={20} />,
            path: "/dashboard/services"
        },
        {
            name: "Offers",
            icon: <HandHeart size={20} />,
            path: "/dashboard/offers"
        },
        {
            name: "Staff",
            icon: <Users size={20} />,
            path: "/dashboard/staff"
        },
        {
            name: "ServiceBookings",
            icon: <BookOpen size={20} />,
            path: "/dashboard/service-bookings"
        },
        {
            name: "OfferBookings",
            icon: <BookOpen size={20} />,
            path: "/dashboard/offer-bookings"
        },
        {
            name: "ServiceRequests",
            icon: <UserCircle size={20} />,
            path: "/dashboard/serviceRequests"
        },
        {
            name: "Reviews",
            icon: <MessageCircle size={20} />,
            path: "/dashboard/reviews"
        },
        {
            name: "Clients",
            icon: <UserCircle size={20} />,
            path: "/Clients"
        },
        {
            name: "Socials",
            icon: <Share2 size={20} />,
            path: "/dashboard/socials"
        },
        {
            name: "Billing",
            icon: <CreditCard size={20} />,
            path: "/dashboard/billing"
        },
        {
            name: "Account",
            icon: <User size={20} />,
            path: "/dashboard/account"
        }
    ];

    const handleLogout = async () => {
        try {
            merchantAuthService.logout();
            toast.success('Logged out successfully');
            navigate('/accounts/sign-in');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Error logging out');
        }
    };

    const getMerchantDisplayInfo = () => {
        if (!currentMerchant) {
            return {
                name: 'Merchant',
                initials: 'M',
                storeName: 'Store Admin'
            };
        }

        const firstName = currentMerchant.first_name || '';
        const lastName = currentMerchant.last_name || '';
        const name = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'Merchant';
        const initials = firstName && lastName 
            ? `${firstName.charAt(0)}${lastName.charAt(0)}`
            : firstName 
                ? firstName.charAt(0)
                : 'M';
        const storeName = currentMerchant.store?.name || 'Discoun3';

        return { name, initials, storeName };
    };

    const merchantInfo = getMerchantDisplayInfo();

    console.log('🎯 Sidebar render:', {
        chatUnreadCount,
        isLoadingChatCount,
        isCollapsed,
        isHovered,
        isExpanded,
        workingEndpoint: localStorage.getItem('workingChatEndpoint'),
        lastCountUpdate: lastCountUpdate ? new Date(lastCountUpdate).toLocaleTimeString() : 'Never',
        currentPath: location.pathname
    });

    return (
        <aside
            className={`
                ${isExpanded ? 'w-72' : 'w-16'} 
                h-full flex flex-col
                bg-gradient-to-b from-blue-900 to-blue-950
                transition-all duration-300 ease-out
                relative
                border-r border-blue-800
                shadow-2xl
            `}
            role="navigation"
            aria-label="Main navigation"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header WITHOUT toggle button (now controlled by Layout) */}
            <div className="flex items-center justify-center p-6">
                {isExpanded ? (
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-sm">D3</span>
                        </div>
                        <span className="text-white font-semibold text-lg">{merchantInfo.storeName}</span>
                    </div>
                ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-sm">D3</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <div className="px-6 mb-6 flex-1">
                <nav className="space-y-1">
                    {menuItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        const isChatItem = item.name === 'Chat';

                        return (
                            <Link
                                key={index}
                                to={item.path}
                                onClick={() => {
                                    if (isChatItem && chatUnreadCount > 0) {
                                        console.log('💬 Chat clicked, clearing count temporarily');
                                        setChatUnreadCount(0);
                                        localStorage.removeItem('cachedChatCount');
                                        
                                        setTimeout(() => {
                                            console.log('🔄 Reloading count after chat visit');
                                            quickCountUpdate();
                                        }, 3000);
                                    }
                                    onClose && onClose();
                                }}
                                className={`
                                    group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                                    transition-all duration-200 ease-out relative
                                    ${isActive
                                        ? 'bg-white bg-opacity-20 text-white shadow-lg backdrop-blur-sm'
                                        : 'text-blue-200 hover:text-white hover:bg-white hover:bg-opacity-10'
                                    }
                                    ${!isExpanded ? 'justify-center px-2' : ''}
                                `}
                                title={!isExpanded ? `${item.name}${item.badge ? ` (${item.badge})` : ''}` : ''}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <span className={`flex-shrink-0 transition-colors duration-200 ${
                                    item.showPulse && !item.isLoading ? 'animate-pulse' : ''
                                } ${item.isLoading ? 'animate-spin' : ''}`}>
                                    {item.icon}
                                </span>

                                {isExpanded && (
                                    <>
                                        <span className="flex-1 truncate">{item.name}</span>
                                        
                                        {item.badge && (
                                            <span className={`px-2 py-0.5 text-xs rounded-full text-white font-bold ${
                                                item.badgeColor || 'bg-red-500'
                                            } ${item.showPulse ? 'animate-pulse' : ''} min-w-[20px] text-center shadow-lg`}>
                                                {item.badge}
                                            </span>
                                        )}
                                        
                                        {isChatItem && item.isLoading && !item.badge && (
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                        )}
                                    </>
                                )}

                                {/* Badge for collapsed state */}
                                {!isExpanded && item.badge && (
                                    <div className={`absolute -top-1 -right-1 min-w-[16px] h-4 text-white text-xs rounded-full flex items-center justify-center font-bold px-1 ${
                                        item.badgeColor || 'bg-red-500'
                                    } ${item.showPulse ? 'animate-pulse' : ''} shadow-lg border border-blue-800`}>
                                        {item.badge}
                                    </div>
                                )}

                                {!isExpanded && isChatItem && item.isLoading && !item.badge && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                )}

                                {/* Tooltip for collapsed items - only when not hovering sidebar */}
                                {!isExpanded && !isHovered && (
                                    <div className="absolute left-full ml-3 px-3 py-2 bg-blue-950 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-blue-800">
                                        {item.name}
                                        {item.badge && (
                                            <span className="ml-2 text-red-400">({item.badge})</span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer */}
            <div className="mt-auto p-6 border-t border-blue-800 border-opacity-50">
                {isExpanded && (
                    <div className="mb-4">
                        <p className="text-blue-300 text-xs mb-1">{merchantInfo.storeName} - Admin Dashboard</p>
                        {chatUnreadCount > 0 && (
                            <p className="text-orange-400 text-xs font-medium">
                                💬 {chatUnreadCount} unread message{chatUnreadCount !== 1 ? 's' : ''}
                            </p>
                        )}
                        {process.env.NODE_ENV === 'development' && (
                            <>
                                <p className="text-blue-400 text-xs">
                                    Last update: {lastCountUpdate ? new Date(lastCountUpdate).toLocaleTimeString() : 'Never'}
                                </p>
                                <p className="text-blue-400 text-xs">
                                    Endpoint: {localStorage.getItem('workingChatEndpoint')?.split('/').pop() || 'None'}
                                </p>
                            </>
                        )}
                        <p className="text-blue-400 text-xs">© 2025.</p>
                    </div>
                )}

                <div className="space-y-1">
                    {/* Manual refresh button (development only) */}
                    {process.env.NODE_ENV === 'development' && isExpanded && (
                        <button
                            onClick={() => {
                                console.log('🔄 Manual refresh triggered');
                                loadChatCount();
                            }}
                            disabled={isLoadingChatCount}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:text-white hover:bg-white hover:bg-opacity-10 transition-all duration-200 ease-out disabled:opacity-50"
                        >
                            <MessageSquare size={20} className={isLoadingChatCount ? 'animate-spin' : ''} />
                            <span>Test ({chatUnreadCount})</span>
                        </button>
                    )}

                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                            text-blue-200 hover:text-red-400 hover:bg-white hover:bg-opacity-10
                            transition-all duration-200 ease-out relative group
                            ${!isExpanded ? 'justify-center' : ''}
                        `}
                        title={!isExpanded ? 'Logout' : ''}
                    >
                        <LogOut size={20} />
                        {isExpanded && <span>Logout</span>}
                        
                        {/* Tooltip for collapsed state */}
                        {!isExpanded && !isHovered && (
                            <div className="absolute left-full ml-3 px-3 py-2 bg-blue-950 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl border border-blue-800">
                                Logout
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;