  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';
  import { Search, Settings, User, ChevronDown, Menu, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
  import Sidebar from '../components/SideMenu';
  import NotificationButton from '../components/NotificationButton';
  import merchantAuthService from '../services/merchantAuthService';
  import { toast } from 'react-hot-toast';

  const Layout = ({
    children,
    rightContent,
    title = "Orders",
    subtitle = "",
    showSearch = true,
    showNotifications = true,
    className = "",
    showCreateButton = false,
    createButtonText = "Create New Order",
    onCreateClick
  }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentMerchant, setCurrentMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Add sidebar collapse state management
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('sidebarCollapsed') === 'true';
      }
      return false;
    });
    
    const navigate = useNavigate();

    // Toggle sidebar collapse
    const toggleSidebarCollapse = () => {
      const newState = !sidebarCollapsed;
      setSidebarCollapsed(newState);
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebarCollapsed', newState.toString());
      }
    };

    // Initialize merchant data
    useEffect(() => {
      const initializeMerchant = async () => {
        try {
          setLoading(true);
          
          if (!merchantAuthService.isAuthenticated()) {
            navigate('/accounts/sign-in');
            return;
          }

          const merchant = merchantAuthService.getCurrentMerchant();
          if (merchant) {
            setCurrentMerchant(merchant);
          } else {
            toast.error('Session expired. Please log in again.');
            navigate('/accounts/sign-in');
          }
        } catch (error) {
          console.error('Error initializing merchant:', error);
          toast.error('Authentication error. Please log in again.');
          navigate('/accounts/sign-in');
        } finally {
          setLoading(false);
        }
      };

      initializeMerchant();
    }, [navigate]);

    // Close menus when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showUserMenu && !event.target.closest('.user-menu')) {
          setShowUserMenu(false);
        }
      };

      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }, [showUserMenu]);

    // Close sidebar on escape key
    useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          setSidebarOpen(false);
          setShowMobileSearch(false);
          setShowUserMenu(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
      if (sidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [sidebarOpen]);

    const handleSearch = (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        console.log('Searching for:', searchQuery);
        setShowMobileSearch(false);
      }
    };

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

    const UserMenu = () => {
      if (!currentMerchant) return null;

      const merchantInitials = currentMerchant.first_name && currentMerchant.last_name 
        ? `${currentMerchant.first_name.charAt(0)}${currentMerchant.last_name.charAt(0)}`
        : currentMerchant.first_name 
          ? currentMerchant.first_name.charAt(0)
          : 'D';

      const merchantName = currentMerchant.first_name && currentMerchant.last_name
        ? `${currentMerchant.first_name} ${currentMerchant.last_name}`
        : currentMerchant.first_name || 'Doron';

      const merchantEmail = currentMerchant.email_address || currentMerchant.email || 'doron@example.com';

      return (
        <div className="user-menu relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="User menu"
          >
            <span className="text-sm text-gray-700 hidden sm:block">{merchantName}</span>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">{merchantInitials}</span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-500 transition-transform hidden sm:block ${showUserMenu ? 'rotate-180' : ''}`}
            />
          </button>

          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-25 z-40 sm:hidden"
                onClick={() => setShowUserMenu(false)}
              />
              
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{merchantInitials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{merchantName}</p>
                      <p className="text-xs text-gray-500 truncate">{merchantEmail}</p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/dashboard/account');
                    }}
                  >
                    <User size={16} />
                    <span>My Profile</span>
                  </button>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate('/dashboard/settings');
                    }}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    };

    // Mobile Search Overlay
    const MobileSearchOverlay = () => (
      showMobileSearch && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col sm:hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Search</h2>
            <button
              onClick={() => setShowMobileSearch(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search services, offers, bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                autoFocus
              />
            </div>
          </div>
        </div>
      )
    );

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading dashboard...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className={`
          fixed lg:static inset-y-0 left-0 z-30 lg:z-auto
          transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300 ease-out
          lg:flex-shrink-0
        `}>
          <Sidebar 
            onClose={() => setSidebarOpen(false)} 
            currentMerchant={currentMerchant}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
          />
        </div>

        <div className="flex flex-col flex-1 overflow-hidden lg:ml-0">
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open sidebar"
                >
                  <Menu size={20} className="text-gray-600" />
                </button>

                <button 
                  className="p-2 hover:bg-gray-100 rounded-lg hidden lg:flex transition-colors"
                  onClick={toggleSidebarCollapse}
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? (
                    <ChevronRight size={20} className="text-gray-600" />
                  ) : (
                    <ChevronLeft size={20} className="text-gray-600" />
                  )}
                </button>

                {showSearch && (
                  <div className="relative hidden sm:block">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search Customers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-80 lg:w-96 pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {rightContent}

                {showSearch && (
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-lg sm:hidden transition-colors"
                    onClick={() => setShowMobileSearch(true)}
                  >
                    <Search size={18} className="text-gray-500" />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors">
                    <span className="text-sm font-medium">C1</span>
                  </button>

                  {showNotifications && <NotificationButton />}

                  <button className="w-10 h-10 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <Settings size={16} />
                  </button>
                </div>

                <UserMenu />
              </div>
            </div>
          </header>

          <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
              </div>
              
              <div className="flex items-center gap-3">
                {showCreateButton && (
                  <button 
                    onClick={onCreateClick}
                    className="bg-black text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {createButtonText}
                  </button>
                )}
                
                <select className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option>Newest</option>
                  <option>Oldest</option>
                  <option>Most Recent</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
            <div className="max-w-full">
              {children}
            </div>
          </div>
        </div>

        <MobileSearchOverlay />
      </div>
    );
  };

  export default Layout;