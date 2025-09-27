import React, { useState, useEffect } from 'react';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
import {
    Plus,
    Edit3,
    Trash2,
    ExternalLink,
    CheckCircle,
    AlertCircle,
    Users,
    Share2,
    Globe,
    Smartphone,
    Monitor,
    Camera,
    MessageCircle,
    Play,
    Music,
    Image,
    Video,
    BookOpen,
    Code,
    Eye,
    X,
    Save,
    Lightbulb
} from 'lucide-react';

const Socials = () => {
    const [socialLinks, setSocialLinks] = useState([]);
    const [newSocial, setNewSocial] = useState({ platform: '', link: '' });
    const [editing, setEditing] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [storeId, setStoreId] = useState(null);
    const [storeData, setStoreData] = useState(null);

    // Social media platforms with modern icons
    const socialMediaPlatforms = [
        { id: 'facebook', name: 'Facebook', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { id: 'instagram', name: 'Instagram', icon: Camera, color: 'text-pink-600', bgColor: 'bg-pink-50' },
        { id: 'twitter', name: 'Twitter', icon: MessageCircle, color: 'text-blue-400', bgColor: 'bg-blue-50' },
        { id: 'linkedin', name: 'LinkedIn', icon: Users, color: 'text-blue-700', bgColor: 'bg-blue-50' },
        { id: 'youtube', name: 'YouTube', icon: Play, color: 'text-red-600', bgColor: 'bg-red-50' },
        { id: 'tiktok', name: 'TikTok', icon: Music, color: 'text-gray-800', bgColor: 'bg-gray-50' },
        { id: 'pinterest', name: 'Pinterest', icon: Image, color: 'text-red-500', bgColor: 'bg-red-50' },
        { id: 'snapchat', name: 'Snapchat', icon: Camera, color: 'text-yellow-400', bgColor: 'bg-yellow-50' },
        { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
        { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { id: 'tumblr', name: 'Tumblr', icon: BookOpen, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
        { id: 'reddit', name: 'Reddit', icon: MessageCircle, color: 'text-orange-600', bgColor: 'bg-orange-50' },
        { id: 'vimeo', name: 'Vimeo', icon: Video, color: 'text-blue-600', bgColor: 'bg-blue-50' },
        { id: 'github', name: 'GitHub', icon: Code, color: 'text-gray-800', bgColor: 'bg-gray-50' },
        { id: 'flickr', name: 'Flickr', icon: Image, color: 'text-blue-500', bgColor: 'bg-blue-50' }
    ];

    // Get auth headers using existing auth service
    const getAuthHeaders = () => {
        const token = merchantAuthService.getToken();
        
        if (!token) {
            throw new Error('No authentication token found. Please log in again.');
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    // Check authentication status
    const checkAuthStatus = () => {
        if (!merchantAuthService.isAuthenticated()) {
            setError('Your session has expired. Please log in again.');
            setTimeout(() => {
                merchantAuthService.logout();
            }, 2000);
            return false;
        }
        return true;
    };

    // Get merchant's store
    const getMerchantStore = async () => {
        try {
            if (!checkAuthStatus()) {
                throw new Error('Authentication required');
            }
            
            const token = merchantAuthService.getToken();
            
            const response = await fetch('http://localhost:4000/api/v1/stores/merchant/my-stores', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed. Your session may have expired.');
                } else if (response.status === 404) {
                    throw new Error('No store found for your merchant account. Please create a store first.');
                } else {
                    throw new Error(`Failed to fetch stores: ${response.status}`);
                }
            }

            const data = await response.json();

            if (data.success && data.stores && data.stores.length > 0) {
                const store = data.stores[0];
                setStoreData(store);
                return store.id;
            }
            
            throw new Error('No store found for your merchant account. Please create a store first.');
        } catch (error) {
            console.error('Error fetching merchant store:', error);
            throw error;
        }
    };

    // Fetch social media links for the store
    const fetchSocialLinks = async (storeId) => {
        try {
            if (!checkAuthStatus()) {
                return [];
            }
            
            const token = merchantAuthService.getToken();
            
            const response = await fetch(`http://localhost:4000/api/v1/merchant/socials/${storeId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 404) {
                return [];
            }

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Authentication failed while fetching social links.');
                }
                
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to fetch social links (${response.status})`);
            }

            const data = await response.json();
            return data.success ? (data.socials || []) : [];
            
        } catch (error) {
            console.error('Error fetching social links:', error);
            return [];
        }
    };

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                if (!merchantAuthService.isAuthenticated()) {
                    throw new Error('Your session has expired. Please log in again.');
                }
                
                const merchantStoreId = await getMerchantStore();
                setStoreId(merchantStoreId);
                
                const socials = await fetchSocialLinks(merchantStoreId);
                setSocialLinks(socials);
                
            } catch (error) {
                console.error('Error loading socials data:', error);
                setError(error.message);
                
                if (error.message.includes('session has expired') || 
                    error.message.includes('Authentication failed')) {
                    setTimeout(() => {
                        merchantAuthService.logout();
                    }, 3000);
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Show success message temporarily
    const showSuccess = (message) => {
        setSuccess(message);
        setTimeout(() => setSuccess(null), 3000);
    };

    // Show error message temporarily  
    const showError = (message) => {
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    // Open modal to add a new social link
    const handleAddSocial = () => {
        if (!checkAuthStatus()) return;
        
        setEditing(null);
        setNewSocial({ platform: '', link: '' });
        setIsModalOpen(true);
    };

    // Handle creating a new social media link
    const handleCreateSocial = async (e) => {
        e.preventDefault();
        
        if (!newSocial.platform || !newSocial.link) {
            showError('Please fill in all fields');
            return;
        }

        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(newSocial.link)) {
            showError('Please enter a valid URL starting with http:// or https://');
            return;
        }

        if (!storeId) {
            showError('Store ID not available. Please refresh the page.');
            return;
        }

        if (!checkAuthStatus()) return;

        try {
            setSubmitting(true);
            
            const response = await fetch('http://localhost:4000/api/v1/socials', {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    store_id: storeId,
                    platform: newSocial.platform,
                    link: newSocial.link
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => merchantAuthService.logout(), 2000);
                    return;
                }
                throw new Error(data.message || 'Failed to create social link');
            }

            setSocialLinks([...socialLinks, data.social]);
            setIsModalOpen(false);
            setNewSocial({ platform: '', link: '' });
            showSuccess('Social media link added successfully!');
        } catch (error) {
            console.error('Create social error:', error);
            showError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle editing a social media link
    const handleEditSocial = (social) => {
        if (!checkAuthStatus()) return;
        
        setEditing(social);
        setNewSocial({ platform: social.platform, link: social.link });
        setIsModalOpen(true);
    };

    // Handle updating the social media link
    const handleUpdateSocial = async (e) => {
        e.preventDefault();
        
        if (!editing || !newSocial.platform || !newSocial.link) {
            showError('Please fill in all fields');
            return;
        }

        const urlRegex = /^https?:\/\/.+/;
        if (!urlRegex.test(newSocial.link)) {
            showError('Please enter a valid URL starting with http:// or https://');
            return;
        }

        if (!checkAuthStatus()) return;

        try {
            setSubmitting(true);
            
            const response = await fetch(`http://localhost:4000/api/v1/socials/${editing.id}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    platform: newSocial.platform,
                    link: newSocial.link
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => merchantAuthService.logout(), 2000);
                    return;
                }
                throw new Error(data.message || 'Failed to update social link');
            }

            setSocialLinks(socialLinks.map(social => 
                social.id === editing.id ? data.social : social
            ));
            setIsModalOpen(false);
            setEditing(null);
            setNewSocial({ platform: '', link: '' });
            showSuccess('Social media link updated successfully!');
        } catch (error) {
            console.error('Update social error:', error);
            showError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    // Handle deleting a social media link
    const handleDeleteSocial = async (id) => {
        if (!window.confirm('Are you sure you want to delete this social media link?')) {
            return;
        }

        if (!checkAuthStatus()) return;

        try {
            const response = await fetch(`http://localhost:4000/api/v1/socials/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Authentication failed. Please log in again.');
                    setTimeout(() => merchantAuthService.logout(), 2000);
                    return;
                }
                throw new Error(data.message || 'Failed to delete social link');
            }

            setSocialLinks(socialLinks.filter((social) => social.id !== id));
            showSuccess('Social media link deleted successfully!');
        } catch (error) {
            console.error('Delete social error:', error);
            showError(error.message);
        }
    };

    // Get platform info
    const getPlatformInfo = (platformId) => {
        return socialMediaPlatforms.find(p => p.id === platformId.toLowerCase()) || {
            id: platformId,
            name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
            icon: Globe,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50'
        };
    };

    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-16">
            <div className="text-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading social media links...</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <Layout 
                title="Social Media Links"
                subtitle="Connect your social media presence"
            >
                <LoadingSpinner />
            </Layout>
        );
    }

    return (
        <Layout 
            title="Social Media Links"
            subtitle="Connect your social media presence to grow your audience"
        >
            <div className="space-y-8">
                {/* Success/Error Messages */}
                {success && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-green-800 font-medium">{success}</span>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <span className="text-red-800 font-medium">{error}</span>
                    </div>
                )}

                {/* Header Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold mb-2">Social Media Presence</h2>
                                <p className="text-indigo-100">
                                    {storeData ? `Managing links for ${storeData.name}` : 'Connect your social platforms'}
                                </p>
                            </div>
                            {!error && storeId && (
                                <button
                                    onClick={handleAddSocial}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <Plus className="h-5 w-5" />
                                    Add Platform
                                </button>
                            )}
                        </div>
                        
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="text-2xl font-bold">{socialLinks.length}</div>
                                <div className="text-sm text-indigo-100">Connected Platforms</div>
                            </div>
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="text-2xl font-bold">24/7</div>
                                <div className="text-sm text-indigo-100">Always Accessible</div>
                            </div>
                            <div className="rounded-lg bg-white bg-opacity-10 p-4">
                                <div className="text-2xl font-bold">∞</div>
                                <div className="text-sm text-indigo-100">Reach Potential</div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white bg-opacity-10"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white bg-opacity-5"></div>
                </div>

                {error ? (
                    /* Error State */
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200 overflow-hidden">
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Social Links</h3>
                            <p className="text-gray-600 mb-6">{error}</p>
                            
                            {error.includes('No store found') ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500">
                                        You need to create a store before managing social media links.
                                    </p>
                                    <button
                                        onClick={() => window.location.href = '/dashboard/account'}
                                        className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
                                    >
                                        Create Your Store
                                    </button>
                                </div>
                            ) : error.includes('session has expired') || error.includes('Authentication failed') ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-500">
                                        Your session has expired. Please log in again to continue.
                                    </p>
                                    <button
                                        onClick={() => merchantAuthService.logout()}
                                        className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors"
                                    >
                                        Go to Login
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Social Links List */
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <Share2 className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">Connected Platforms</h3>
                                        <p className="text-sm text-gray-600">Your social media presence</p>
                                    </div>
                                </div>
                                {socialLinks.length > 0 && (
                                    <span className="text-sm text-indigo-600 font-medium">
                                        {socialLinks.length} platform{socialLinks.length !== 1 ? 's' : ''} connected
                                    </span>
                                )}
                            </div>
                        </div>

                        {socialLinks.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {socialLinks.map((social) => {
                                    const platformInfo = getPlatformInfo(social.platform);
                                    const Icon = platformInfo.icon;
                                    
                                    return (
                                        <div key={social.id} className="p-6 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`p-3 ${platformInfo.bgColor} rounded-xl`}>
                                                        <Icon className={`h-6 w-6 ${platformInfo.color}`} />
                                                    </div>
                                                    
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {platformInfo.name}
                                                        </h3>
                                                        <a
                                                            href={social.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors mt-1"
                                                        >
                                                            <Globe className="h-4 w-4" />
                                                            <span className="text-sm">
                                                                {social.link.length > 40 ? social.link.substring(0, 40) + '...' : social.link}
                                                            </span>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleEditSocial(social)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit link"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSocial(social.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete link"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Share2 className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No social platforms connected</h3>
                                <p className="text-gray-600 mb-6">
                                    Connect your social media accounts to help customers find and follow your business online.
                                </p>
                                <button
                                    onClick={handleAddSocial}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Your First Platform
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Tips Section */}
                {!error && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                        <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                                <Lightbulb className="h-6 w-6 text-blue-600 mt-1" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-3">Social Media Best Practices</h3>
                                <ul className="text-blue-800 text-sm space-y-2">
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Use your business page URLs, not personal profiles</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Ensure your profiles are public and actively maintained</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Keep your brand consistent across all platforms</span>
                                    </li>
                                    <li className="flex items-start space-x-2">
                                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span>Regular posting helps maintain customer engagement</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Social Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editing ? 'Edit Social Media Link' : 'Add Social Media Link'}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditing(null);
                                    setNewSocial({ platform: '', link: '' });
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={editing ? handleUpdateSocial : handleCreateSocial} className="p-6 space-y-6">
                            {/* Platform Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Platform <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={newSocial.platform}
                                    onChange={(e) => setNewSocial({ ...newSocial, platform: e.target.value })}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                    required
                                    disabled={submitting}
                                >
                                    <option value="">Select a Platform</option>
                                    {socialMediaPlatforms.map((platform) => (
                                        <option key={platform.id} value={platform.id}>
                                            {platform.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* URL Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Profile URL <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input
                                        type="url"
                                        value={newSocial.link}
                                        onChange={(e) => setNewSocial({ ...newSocial, link: e.target.value })}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                                        placeholder="https://facebook.com/yourstore"
                                        required
                                        disabled={submitting}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">
                                    Enter the complete URL including https://
                                </p>
                            </div>

                            {/* URL Preview */}
                            {newSocial.platform && newSocial.link && (
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-700 mb-2">Preview:</p>
                                    <div className="flex items-center space-x-3">
                                        {(() => {
                                            const platformInfo = getPlatformInfo(newSocial.platform);
                                            const Icon = platformInfo.icon;
                                            return (
                                                <>
                                                    <div className={`p-2 ${platformInfo.bgColor} rounded-lg`}>
                                                        <Icon className={`h-5 w-5 ${platformInfo.color}`} />
                                                    </div>
                                                    <span className="font-medium text-gray-900">{platformInfo.name}</span>
                                                    <span className="text-gray-400">→</span>
                                                    <span className="text-indigo-600 text-sm truncate">{newSocial.link}</span>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setEditing(null);
                                        setNewSocial({ platform: '', link: '' });
                                    }}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            {editing ? 'Updating...' : 'Adding...'}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {editing ? 'Update Link' : 'Add Link'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Socials;