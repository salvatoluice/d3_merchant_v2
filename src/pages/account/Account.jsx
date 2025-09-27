import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
import BranchManagement from '../../components/BranchManagement';
import { uploadStoreLogo, updateStoreProfile } from '../../services/api_service';
import {
    User,
    Store,
    Shield,
    CreditCard,
    Activity,
    Camera,
    MapPin,
    Phone,
    Mail,
    Globe,
    Clock,
    Calendar,
    Settings,
    CheckCircle,
    AlertCircle,
    Upload,
    X,
    Edit3,
    Save,
    Building2,
    Briefcase,
    LogOut
} from 'lucide-react';

const AccountPage = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [merchantInfo, setMerchantInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [branches, setBranches] = useState([]);
    const [editingProfile, setEditingProfile] = useState(false);
    const [editingStore, setEditingStore] = useState(false);
    
    // Logo upload states
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoUploading, setLogoUploading] = useState(false);
    const [editingLogo, setEditingLogo] = useState(false);
    
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        businessType: '',
        taxId: '',
        website: ''
    });
    
    const [storeData, setStoreData] = useState({
        name: '',
        location: '',
        phoneNumber: '',
        email: '',
        description: '',
        openingTime: '',
        closingTime: '',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        websiteUrl: '',
        logoUrl: ''
    });

    // Get merchant info and store details
    const getMerchantInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!merchantAuthService.isAuthenticated()) {
                throw new Error('Authentication required');
            }

            const response = await merchantAuthService.getCurrentMerchantProfile();
            
            if (!response) {
                return;
            }

            if (!response.success) {
                throw new Error(response.message || 'Failed to load profile information');
            }

            const merchantProfile = response.merchantProfile;
            
            setMerchantInfo(merchantProfile);
            
            // Set profile data
            setProfileData({
                firstName: merchantProfile.first_name || '',
                lastName: merchantProfile.last_name || '',
                email: merchantProfile.email_address || '',
                phoneNumber: merchantProfile.phone_number || '',
                businessType: 'Retail',
                taxId: '',
                website: merchantProfile.store?.website_url || ''
            });

            // Set store data including logo
            if (merchantProfile.store) {
                setStoreData({
                    name: merchantProfile.store.name || '',
                    location: merchantProfile.store.location || '',
                    phoneNumber: merchantProfile.store.phone_number || '',
                    email: merchantProfile.store.primary_email || '',
                    description: merchantProfile.store.description || '',
                    openingTime: merchantProfile.store.opening_time || '',
                    closingTime: merchantProfile.store.closing_time || '',
                    workingDays: merchantProfile.store.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                    websiteUrl: merchantProfile.store.website_url || '',
                    logoUrl: merchantProfile.store.logo_url || merchantProfile.store.logo || ''
                });
                
                // Set logo preview if exists
                if (merchantProfile.store.logo_url || merchantProfile.store.logo) {
                    setLogoPreview(merchantProfile.store.logo_url || merchantProfile.store.logo);
                }
            }
            
        } catch (error) {
            console.error('Error fetching merchant info:', error);
            
            if (error.message?.includes('Authentication') || 
                error.message?.includes('401') || 
                error.message?.includes('403')) {
                return;
            }
            
            setError(error.message || 'Failed to load profile information');
            toast.error('Failed to load profile information');
        } finally {
            setLoading(false);
        }
    };

    // Handle logo file selection
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return;
            }
            
            setLogoFile(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle logo upload and store update
    const handleLogoUpload = async () => {
        if (!logoFile) {
            toast.error('Please select a logo to upload');
            return;
        }
        
        if (!merchantInfo?.store?.id) {
            toast.error('Store information not found');
            return;
        }
        
        try {
            setLogoUploading(true);
            
            const uploadResult = await uploadStoreLogo(logoFile);
            
            if (!uploadResult.success || !uploadResult.logoUrl) {
                throw new Error('Failed to upload logo');
            }
            
            const updateResult = await updateStoreProfile(merchantInfo.store.id, {
                logo_url: uploadResult.logoUrl
            });
            
            if (updateResult && updateResult.success !== false) {
                setStoreData(prev => ({
                    ...prev,
                    logoUrl: uploadResult.logoUrl
                }));
                
                await getMerchantInfo();
                
                setEditingLogo(false);
                setLogoFile(null);
                toast.success('Store logo updated successfully!');
            } else {
                throw new Error(updateResult?.message || 'Failed to update store logo');
            }
            
        } catch (error) {
            console.error('Error updating store logo:', error);
            toast.error(error.message || 'Failed to update store logo');
        } finally {
            setLogoUploading(false);
        }
    };

    // Handle logo removal
    const handleLogoRemove = async () => {
        if (!merchantInfo?.store?.id) {
            toast.error('Store information not found');
            return;
        }
        
        try {
            setLogoUploading(true);
            
            const updateResult = await updateStoreProfile(merchantInfo.store.id, {
                logo_url: null
            });
            
            if (updateResult && updateResult.success !== false) {
                setStoreData(prev => ({
                    ...prev,
                    logoUrl: ''
                }));
                
                setLogoPreview(null);
                setLogoFile(null);
                setEditingLogo(false);
                
                await getMerchantInfo();
                
                toast.success('Store logo removed successfully!');
            } else {
                throw new Error(updateResult?.message || 'Failed to remove store logo');
            }
            
        } catch (error) {
            console.error('Error removing store logo:', error);
            toast.error(error.message || 'Failed to remove store logo');
        } finally {
            setLogoUploading(false);
        }
    };

    // Handle profile update
    const handleProfileUpdate = async () => {
        try {
            setLoading(true);
            
            const updateResponse = await merchantAuthService.updateMerchantProfile(null, {
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email_address: profileData.email,
                phone_number: profileData.phoneNumber
            });

            if (updateResponse && (updateResponse.success !== false)) {
                await getMerchantInfo();
                setEditingProfile(false);
                toast.success('Profile updated successfully!');
            } else {
                throw new Error(updateResponse?.message || 'Failed to update profile');
            }
            
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Handle store update
    const handleStoreUpdate = async () => {
        try {
            setLoading(true);
            
            const updateResponse = await merchantAuthService.updateStoreProfile(merchantInfo.store.id, {
                name: storeData.name,
                location: storeData.location,
                phone_number: storeData.phoneNumber,
                primary_email: storeData.email,
                description: storeData.description,
                opening_time: storeData.openingTime,
                closing_time: storeData.closingTime,
                working_days: storeData.workingDays,
                website_url: storeData.websiteUrl
            });

            if (updateResponse && (updateResponse.success !== false)) {
                await getMerchantInfo();
                setEditingStore(false);
                toast.success('Store information updated successfully!');
            } else {
                throw new Error(updateResponse?.message || 'Failed to update store');
            }
            
        } catch (error) {
            console.error('Error updating store:', error);
            toast.error(error.message || 'Failed to update store information');
        } finally {
            setLoading(false);
        }
    };

    // Handle working days change
    const handleStoreWorkingDaysChange = (day) => {
        setStoreData(prev => ({
            ...prev,
            workingDays: prev.workingDays.includes(day)
                ? prev.workingDays.filter(d => d !== day)
                : [...prev.workingDays, day]
        }));
    };

    // Handle branches update callback
    const handleBranchesUpdate = (updatedBranches) => {
        setBranches(updatedBranches);
    };

    const handleLogout = () => {
        merchantAuthService.logout();
    };

    useEffect(() => {
        getMerchantInfo();
    }, []);

    const tabs = [
        { name: 'Profile', icon: User, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
        { name: 'Business', icon: Store, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
        { name: 'Security', icon: Shield, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
        { name: 'Billing', icon: CreditCard, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
        { name: 'Activity', icon: Activity, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
    ];

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // Loading component
    const LoadingSpinner = () => (
        <div className="flex items-center justify-center py-16">
            <div className="text-center">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading your account...</p>
            </div>
        </div>
    );

    // Error component
    const ErrorMessage = ({ message, onRetry }) => (
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Unable to Load Account</h3>
            <p className="text-red-700 mb-6">{message}</p>
            <button
                onClick={onRetry}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
                Try Again
            </button>
        </div>
    );

    const ProfileCard = ({ merchant }) => (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center">
                                {storeData.logoUrl || logoPreview ? (
                                    <img 
                                        src={logoPreview || storeData.logoUrl} 
                                        alt="Store logo" 
                                        className="h-12 w-12 rounded-xl object-cover"
                                    />
                                ) : (
                                    <Building2 className="h-8 w-8 text-white" />
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white"></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{merchant?.store?.name || 'Your Business'}</h2>
                            <p className="text-indigo-100 flex items-center mt-1">
                                <MapPin className="h-4 w-4 mr-1" />
                                {merchant?.store?.location || 'Location not set'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="rounded-lg bg-white bg-opacity-10 px-3 py-1 text-sm font-medium">
                            Professional Plan
                        </div>
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-white bg-opacity-10 p-3 text-center">
                        <div className="text-2xl font-bold">{branches.length + 1}</div>
                        <div className="text-sm text-indigo-100">Branches</div>
                    </div>
                    <div className="rounded-lg bg-white bg-opacity-10 p-3 text-center">
                        <div className="text-2xl font-bold">4.8</div>
                        <div className="text-sm text-indigo-100">Rating</div>
                    </div>
                    <div className="rounded-lg bg-white bg-opacity-10 p-3 text-center">
                        <div className="text-2xl font-bold">2.5k</div>
                        <div className="text-sm text-indigo-100">Customers</div>
                    </div>
                </div>
            </div>
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white bg-opacity-10"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-white bg-opacity-5"></div>
        </div>
    );

    return (
        <Layout 
            title="Account Settings"
            subtitle="Manage your business profile and account preferences"
        >
            <div className="space-y-8">
                {/* Header Profile Card */}
                {merchantInfo && !loading && !error && <ProfileCard merchant={merchantInfo} />}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <nav className="space-y-2">
                                {tabs.map((tab, index) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === index;
                                    
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setActiveTab(index)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl font-medium transition-all duration-200 ${
                                                isActive
                                                    ? `${tab.bgColor} ${tab.color} ${tab.borderColor} border`
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 flex-shrink-0" />
                                            <span>{tab.name}</span>
                                        </button>
                                    );
                                })}
                                
                                {/* Logout Button */}
                                <div className="pt-4 mt-4 border-t border-gray-200">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
                                    >
                                        <LogOut className="h-5 w-5 flex-shrink-0" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {loading && <LoadingSpinner />}

                        {error && (
                            <ErrorMessage
                                message={error}
                                onRetry={getMerchantInfo}
                            />
                        )}

                        {merchantInfo && !loading && !error && (
                            <>
                                {/* Profile Tab */}
                                {activeTab === 0 && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                                            <p className="text-sm text-gray-600">Update your personal details</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingProfile(!editingProfile)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                                            editingProfile
                                                                ? 'text-gray-600 hover:bg-gray-100'
                                                                : 'text-blue-600 hover:bg-blue-50'
                                                        }`}
                                                        disabled={loading}
                                                    >
                                                        {editingProfile ? (
                                                            <>
                                                                <X className="h-4 w-4" />
                                                                Cancel
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Edit3 className="h-4 w-4" />
                                                                Edit
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">First Name</label>
                                                        {editingProfile ? (
                                                            <input
                                                                type="text"
                                                                value={profileData.firstName}
                                                                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium">{merchantInfo.first_name || 'Not set'}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                                                        {editingProfile ? (
                                                            <input
                                                                type="text"
                                                                value={profileData.lastName}
                                                                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium">{merchantInfo.last_name || 'Not set'}</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                                        {editingProfile ? (
                                                            <input
                                                                type="email"
                                                                value={profileData.email}
                                                                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.email_address || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Phone Number</label>
                                                        {editingProfile ? (
                                                            <input
                                                                type="tel"
                                                                value={profileData.phoneNumber}
                                                                onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.phone_number || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {editingProfile && (
                                                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                                                        <button 
                                                            onClick={handleProfileUpdate}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    Saving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Save className="h-4 w-4" />
                                                                    Save Changes
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingProfile(false);
                                                                setProfileData({
                                                                    firstName: merchantInfo.first_name || '',
                                                                    lastName: merchantInfo.last_name || '',
                                                                    email: merchantInfo.email_address || '',
                                                                    phoneNumber: merchantInfo.phone_number || '',
                                                                    businessType: profileData.businessType,
                                                                    taxId: profileData.taxId,
                                                                    website: profileData.website
                                                                });
                                                            }}
                                                            disabled={loading}
                                                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Business Tab */}
                                {activeTab === 1 && (
                                    <div className="space-y-6">
                                        {/* Logo Upload Section */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <Camera className="h-5 w-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">Business Logo</h3>
                                                            <p className="text-sm text-gray-600">Upload your brand logo</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingLogo(!editingLogo)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                                            editingLogo
                                                                ? 'text-gray-600 hover:bg-gray-100'
                                                                : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                        disabled={logoUploading}
                                                    >
                                                        {editingLogo ? (
                                                            <>
                                                                <X className="h-4 w-4" />
                                                                Cancel
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Edit3 className="h-4 w-4" />
                                                                Edit Logo
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                                                            {logoPreview || storeData.logoUrl ? (
                                                                <img 
                                                                    src={logoPreview || storeData.logoUrl} 
                                                                    alt="Business logo" 
                                                                    className="w-full h-full object-cover rounded-xl"
                                                                />
                                                            ) : (
                                                                <div className="text-gray-400 text-center">
                                                                    <Building2 className="w-8 h-8 mx-auto mb-2" />
                                                                    <span className="text-xs font-medium">No Logo</span>
                                                                </div>
                                                            )}
                                                            {editingLogo && (
                                                                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Camera className="w-6 h-6 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        {editingLogo ? (
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                        Upload Logo Image
                                                                    </label>
                                                                    <div className="relative">
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            onChange={handleLogoChange}
                                                                            className="hidden"
                                                                            id="logo-upload"
                                                                            disabled={logoUploading}
                                                                        />
                                                                        <label
                                                                            htmlFor="logo-upload"
                                                                            className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 cursor-pointer transition-colors"
                                                                        >
                                                                            <Upload className="h-5 w-5 text-gray-500" />
                                                                            <span className="text-gray-700">Click to upload or drag and drop</span>
                                                                        </label>
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        PNG, JPG, GIF up to 5MB. Recommended: 400x400px
                                                                    </p>
                                                                </div>

                                                                <div className="flex gap-3">
                                                                    {logoFile && (
                                                                        <button
                                                                            onClick={handleLogoUpload}
                                                                            disabled={logoUploading}
                                                                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        >
                                                                            {logoUploading ? (
                                                                                <>
                                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                                    Uploading...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Upload className="h-4 w-4" />
                                                                                    Upload Logo
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}

                                                                    {(storeData.logoUrl || logoPreview) && (
                                                                        <button
                                                                            onClick={handleLogoRemove}
                                                                            disabled={logoUploading}
                                                                            className="flex items-center gap-2 px-6 py-3 border border-red-300 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                            Remove
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 mb-2">
                                                                    {storeData.logoUrl ? 'Logo Active' : 'No Logo Uploaded'}
                                                                </h4>
                                                                <p className="text-gray-600 mb-4">
                                                                    {storeData.logoUrl 
                                                                        ? 'Your logo is live and visible across your business profile' 
                                                                        : 'Upload a professional logo to strengthen your brand identity'
                                                                    }
                                                                </p>
                                                                <div className="flex items-center gap-2 text-sm">
                                                                    {storeData.logoUrl ? (
                                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                                                    )}
                                                                    <span className={storeData.logoUrl ? 'text-green-600' : 'text-amber-600'}>
                                                                        {storeData.logoUrl ? 'Logo configured' : 'Logo recommended'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Information */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <Store className="h-5 w-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
                                                            <p className="text-sm text-gray-600">Your main location details</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => setEditingStore(!editingStore)}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                                            editingStore
                                                                ? 'text-gray-600 hover:bg-gray-100'
                                                                : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                        disabled={loading}
                                                    >
                                                        {editingStore ? (
                                                            <>
                                                                <X className="h-4 w-4" />
                                                                Cancel
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Edit3 className="h-4 w-4" />
                                                                Edit
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Business Name</label>
                                                        {editingStore ? (
                                                            <input
                                                                type="text"
                                                                value={storeData.name}
                                                                onChange={(e) => setStoreData({...storeData, name: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.store?.name || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Business Phone</label>
                                                        {editingStore ? (
                                                            <input
                                                                type="tel"
                                                                value={storeData.phoneNumber}
                                                                onChange={(e) => setStoreData({...storeData, phoneNumber: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Phone className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.store?.phone_number || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Business Email</label>
                                                        {editingStore ? (
                                                            <input
                                                                type="email"
                                                                value={storeData.email}
                                                                onChange={(e) => setStoreData({...storeData, email: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.store?.primary_email || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Website</label>
                                                        {editingStore ? (
                                                            <input
                                                                type="url"
                                                                value={storeData.websiteUrl}
                                                                onChange={(e) => setStoreData({...storeData, websiteUrl: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                                placeholder="https://your-website.com"
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Globe className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.store?.website_url || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Operating Hours */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Opening Time</label>
                                                        {editingStore ? (
                                                            <input
                                                                type="time"
                                                                value={storeData.openingTime}
                                                                onChange={(e) => setStoreData({...storeData, openingTime: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.store?.opening_time || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Closing Time</label>
                                                        {editingStore ? (
                                                            <input
                                                                type="time"
                                                                value={storeData.closingTime}
                                                                onChange={(e) => setStoreData({...storeData, closingTime: e.target.value})}
                                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                                                                disabled={loading}
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900 py-3 font-medium flex items-center">
                                                                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                                                                {merchantInfo.store?.closing_time || 'Not set'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Address */}
                                                <div className="mt-6 space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Business Address</label>
                                                    {editingStore ? (
                                                        <textarea
                                                            value={storeData.location}
                                                            onChange={(e) => setStoreData({...storeData, location: e.target.value})}
                                                            rows={3}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                                                            disabled={loading}
                                                            placeholder="Enter your full business address"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900 py-3 font-medium flex items-start">
                                                            <MapPin className="h-4 w-4 mr-2 text-gray-500 mt-0.5 flex-shrink-0" />
                                                            {merchantInfo.store?.location || 'Not set'}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Working Days */}
                                                {editingStore && (
                                                    <div className="mt-6 space-y-3">
                                                        <label className="text-sm font-medium text-gray-700 flex items-center">
                                                            <Calendar className="h-4 w-4 mr-2" />
                                                            Operating Days
                                                        </label>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                                                            {weekDays.map((day) => (
                                                                <label key={day} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={storeData.workingDays.includes(day)}
                                                                        onChange={() => handleStoreWorkingDaysChange(day)}
                                                                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-700">{day.slice(0, 3)}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Description */}
                                                <div className="mt-6 space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Business Description</label>
                                                    {editingStore ? (
                                                        <textarea
                                                            value={storeData.description}
                                                            onChange={(e) => setStoreData({...storeData, description: e.target.value})}
                                                            rows={4}
                                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                                                            disabled={loading}
                                                            placeholder="Describe your business, services, and what makes you unique"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900 py-3 leading-relaxed">
                                                            {merchantInfo.store?.description || 'No description provided'}
                                                        </p>
                                                    )}
                                                </div>

                                                {editingStore && (
                                                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                                                        <button 
                                                            onClick={handleStoreUpdate}
                                                            disabled={loading}
                                                            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {loading ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    Updating...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Save className="h-4 w-4" />
                                                                    Save Changes
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setEditingStore(false);
                                                                if (merchantInfo.store) {
                                                                    setStoreData({
                                                                        name: merchantInfo.store.name || '',
                                                                        location: merchantInfo.store.location || '',
                                                                        phoneNumber: merchantInfo.store.phone_number || '',
                                                                        email: merchantInfo.store.primary_email || '',
                                                                        description: merchantInfo.store.description || '',
                                                                        openingTime: merchantInfo.store.opening_time || '',
                                                                        closingTime: merchantInfo.store.closing_time || '',
                                                                        workingDays: merchantInfo.store.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                                                                        websiteUrl: merchantInfo.store.website_url || '',
                                                                        logoUrl: merchantInfo.store.logo_url || merchantInfo.store.logo || ''
                                                                    });
                                                                }
                                                            }}
                                                            disabled={loading}
                                                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Info Banner */}
                                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0">
                                                            <CheckCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-blue-900 mb-1">Main Location</h4>
                                                            <p className="text-sm text-blue-700">
                                                                This information represents your primary business location and serves as your main branch across all systems.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Branch Management Component */}
                                        {merchantInfo.store && (
                                            <BranchManagement 
                                                storeId={merchantInfo.store.id}
                                                onBranchesUpdate={handleBranchesUpdate}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Security Tab */}
                                {activeTab === 2 && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                                        <Shield className="h-5 w-5 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                                                        <p className="text-sm text-gray-600">Manage your account security preferences</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6 space-y-6">
                                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                                            <Shield className="h-5 w-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
                                                            <p className="text-sm text-gray-600">Extra security for your account</p>
                                                        </div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>

                                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                                            <Settings className="h-5 w-5 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Password</h4>
                                                            <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                                                        </div>
                                                    </div>
                                                    <button className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                                                        Change
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                            <Mail className="h-5 w-5 text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">Login Notifications</h4>
                                                            <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                                                        </div>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input type="checkbox" className="sr-only peer" defaultChecked />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Billing Tab */}
                                {activeTab === 3 && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                                        <CreditCard className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">Subscription & Billing</h3>
                                                        <p className="text-sm text-gray-600">Manage your plan and payment details</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                                                    <div className="flex items-start justify-between mb-6">
                                                        <div>
                                                            <h4 className="text-xl font-bold text-gray-900">Professional Plan</h4>
                                                            <p className="text-gray-600">Full access to all features</p>
                                                        </div>
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                            Active
                                                        </span>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                                        <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                                                            <div className="text-2xl font-bold text-gray-900">$49.99</div>
                                                            <div className="text-sm text-gray-600">Monthly Fee</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                                                            <div className="text-2xl font-bold text-gray-900">Aug 18</div>
                                                            <div className="text-sm text-gray-600">Next Billing</div>
                                                        </div>
                                                        <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                                                            <div className="text-2xl font-bold text-gray-900">••••1234</div>
                                                            <div className="text-sm text-gray-600">Payment Method</div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex gap-4">
                                                        <button className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors">
                                                            Upgrade Plan
                                                        </button>
                                                        <button className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
                                                            Update Payment
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Activity Tab */}
                                {activeTab === 4 && (
                                    <div className="space-y-6">
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                                        <Activity className="h-5 w-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900">Account Activity</h3>
                                                        <p className="text-sm text-gray-600">Recent actions and security events</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900">Successful Login</p>
                                                                <p className="text-xs text-gray-500">2 minutes ago</p>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Chrome on Windows • IP: 192.168.1.1</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900">Profile Updated</p>
                                                                <p className="text-xs text-gray-500">Yesterday</p>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Business information was modified</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900">New Branch Added</p>
                                                                <p className="text-xs text-gray-500">2 days ago</p>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Downtown location was successfully created</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-3 h-3 bg-orange-500 rounded-full mt-2"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900">Payment Processed</p>
                                                                <p className="text-xs text-gray-500">1 week ago</p>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Monthly subscription fee of $49.99</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                                        <div className="flex-shrink-0">
                                                            <div className="w-3 h-3 bg-gray-400 rounded-full mt-2"></div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium text-gray-900">Password Changed</p>
                                                                <p className="text-xs text-gray-500">2 weeks ago</p>
                                                            </div>
                                                            <p className="text-sm text-gray-600">Account password was successfully updated</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-6 text-center">
                                                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                                        View All Activity
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default AccountPage;