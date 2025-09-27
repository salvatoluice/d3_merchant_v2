import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import EnhancedOfferForm from './OfferForm';
import { createOffer, fetchOffers, updateOffer, deleteOffer, getMerchantStores } from '../../services/api_service';
import { 
    Edit, Trash2, Eye, Calendar, Percent, Tag, Users, AlertCircle, Loader2, Store, Plus,
    Calculator, DollarSign, Clock, Zap, Star, HelpCircle, CheckCircle, TrendingUp, Filter,
    Search, RefreshCw, Shield, UserCheck, CreditCard, MessageSquare, Info, Timer, Bell
} from 'lucide-react';

const EnhancedOfferPage = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [hasStore, setHasStore] = useState(true);
    const [storeError, setStoreError] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        checkStoreAndLoadOffers();
    }, []);

    const checkStoreAndLoadOffers = async () => {
        try {
            setLoading(true);
            setStoreError(null);
            
            console.log('Checking merchant stores...');
            
            try {
                const storesResponse = await getMerchantStores();
                const stores = storesResponse?.stores || storesResponse || [];
                
                if (stores.length === 0) {
                    console.log('No stores found for merchant');
                    setHasStore(false);
                    setOffers([]);
                    return;
                }
                
                console.log('Found stores:', stores.length);
                setHasStore(true);
                
                await loadOffers();
                
            } catch (storeCheckError) {
                console.error('Store check failed:', storeCheckError);
                setStoreError(storeCheckError.message);
                setHasStore(false);
            }
            
        } catch (error) {
            console.error('Failed to check stores and load offers:', error);
            toast.error('Failed to load page data');
        } finally {
            setLoading(false);
        }
    };

    const loadOffers = async () => {
        try {
            console.log('Loading enhanced offers...');
            
            const response = await fetchOffers();
            
            if (response.error) {
                console.log('Offers API returned error:', response.error);
                setStoreError(response.error);
                setOffers([]);
            } else {
                const offersList = response?.offers || [];
                console.log('Enhanced offers loaded:', offersList.length);
                setOffers(offersList);
            }
        } catch (error) {
            console.error('Failed to fetch offers:', error);
            setOffers([]);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await loadOffers();
        } catch (error) {
            console.error('Failed to refresh offers:', error);
            toast.error('Failed to refresh offers');
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateOffer = async (offerData) => {
        try {
            console.log('Creating enhanced offer:', offerData);
            await createOffer(offerData);
            toast.success('Offer created successfully');
            setModalOpen(false);
            loadOffers();
        } catch (error) {
            console.error('Failed to create offer:', error);
            throw error;
        }
    };

    const handleUpdateOffer = async (offerData) => {
        try {
            console.log('Updating enhanced offer:', editingOffer.id, offerData);
            await updateOffer(editingOffer.id, offerData);
            toast.success('Offer updated successfully');
            setModalOpen(false);
            setEditingOffer(null);
            loadOffers();
        } catch (error) {
            console.error('Failed to update offer:', error);
            throw error;
        }
    };

    const handleDeleteOffer = async (offerId) => {
        try {
            console.log('Deleting offer:', offerId);
            await deleteOffer(offerId);
            toast.success('Offer deleted successfully');
            setDeleteConfirm(null);
            loadOffers();
        } catch (error) {
            console.error('Failed to delete offer:', error);
            toast.error('Failed to delete offer');
        }
    };

    const handleEditClick = (offer) => {
        console.log('Editing enhanced offer:', offer);
        setEditingOffer(offer);
        setModalOpen(true);
    };

    const handleDeleteClick = (offer) => {
        setDeleteConfirm(offer);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingOffer(null);
    };

    const isOfferExpired = (expirationDate) => {
        return new Date(expirationDate) < new Date();
    };

    // Enhanced filtering function that handles new offer types and service data
    const filteredOffers = offers.filter(offer => {
        // Search filter - now includes service booking settings
        const matchesSearch = !searchTerm || 
            offer.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.service?.category?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const expired = isOfferExpired(offer.expiration_date);
        
        // Default 'all' filter excludes expired offers
        if (filter === 'all') {
            return !expired;
        }
        
        // Fixed price offers
        if (filter === 'fixed') {
            const isFixed = offer.offer_type === 'fixed' || offer.service?.type === 'fixed';
            return isFixed && !expired;
        }
        
        // Dynamic price offers
        if (filter === 'dynamic') {
            const isDynamic = offer.offer_type === 'dynamic' || offer.service?.type === 'dynamic';
            return isDynamic && !expired;
        }
        
        // Active offers
        if (filter === 'active') {
            return offer.status === 'active' && !expired;
        }
        
        // Expired offers only
        if (filter === 'expired') {
            return expired;
        }
        
        // Featured offers
        if (filter === 'featured') {
            return offer.featured === true && !expired;
        }

        // NEW: Auto-confirm offers
        if (filter === 'auto-confirm') {
            return offer.service?.auto_confirm_bookings === true && !expired;
        }

        // NEW: Prepayment required offers
        if (filter === 'prepayment') {
            return offer.service?.require_prepayment === true && !expired;
        }
        
        return true;
    });

    const getStatusBadge = (status, expiration_date) => {
        const expired = isOfferExpired(expiration_date);
        const effectiveStatus = expired ? 'expired' : status;
        
        const statusConfig = {
            active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
            inactive: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Inactive' },
            expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expired' },
            paused: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Paused' }
        };

        const config = statusConfig[effectiveStatus] || statusConfig.inactive;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    // Enhanced offer type badge with service info
    const getOfferTypeBadge = (offer) => {
        const isDynamic = offer.offer_type === 'dynamic' || 
                         offer.service?.type === 'dynamic' ||
                         offer.requires_consultation === true;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                isDynamic 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-blue-100 text-blue-800'
            }`}>
                {isDynamic ? (
                    <>
                        <Calculator className="w-3 h-3 mr-1" />
                        Dynamic
                    </>
                ) : (
                    <>
                        <DollarSign className="w-3 h-3 mr-1" />
                        Fixed
                    </>
                )}
            </span>
        );
    };

    // NEW: Get booking settings badges
    const getBookingSettingsBadges = (service) => {
        if (!service) return [];

        const badges = [];

        if (service.auto_confirm_bookings) {
            badges.push({
                icon: CheckCircle,
                label: 'Auto-Confirm',
                color: 'bg-green-50 text-green-700',
                iconColor: 'text-green-600'
            });
        }

        if (service.require_prepayment) {
            badges.push({
                icon: CreditCard,
                label: 'Prepayment',
                color: 'bg-blue-50 text-blue-700',
                iconColor: 'text-blue-600'
            });
        }

        if (service.allow_early_checkin) {
            badges.push({
                icon: UserCheck,
                label: 'Early Check-in',
                color: 'bg-purple-50 text-purple-700',
                iconColor: 'text-purple-600'
            });
        }

        if (service.auto_complete_on_duration) {
            badges.push({
                icon: Timer,
                label: 'Auto-Complete',
                color: 'bg-indigo-50 text-indigo-700',
                iconColor: 'text-indigo-600'
            });
        }

        return badges.slice(0, 3); // Show max 3 badges
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Enhanced stats calculation with new service data
    const calculateStats = () => {
        const total = offers.length;
        const nonExpired = offers.filter(offer => !isOfferExpired(offer.expiration_date));
        const active = offers.filter(offer => 
            offer.status === 'active' && !isOfferExpired(offer.expiration_date)
        ).length;
        const expired = offers.filter(offer => isOfferExpired(offer.expiration_date)).length;
        
        const dynamic = offers.filter(offer => {
            const isDynamic = offer.offer_type === 'dynamic' || 
                             offer.service?.type === 'dynamic' ||
                             offer.requires_consultation === true;
            return isDynamic && !isOfferExpired(offer.expiration_date);
        }).length;
        
        const fixed = offers.filter(offer => {
            const isFixed = offer.offer_type === 'fixed' || 
                           offer.service?.type === 'fixed';
            return isFixed && !isOfferExpired(offer.expiration_date);
        }).length;
        
        const featured = offers.filter(offer => 
            offer.featured === true && !isOfferExpired(offer.expiration_date)
        ).length;

        // NEW: Booking settings stats
        const autoConfirm = offers.filter(offer => 
            offer.service?.auto_confirm_bookings === true && !isOfferExpired(offer.expiration_date)
        ).length;

        const requirePrepayment = offers.filter(offer => 
            offer.service?.require_prepayment === true && !isOfferExpired(offer.expiration_date)
        ).length;
        
        const avgDiscount = nonExpired.length > 0 
            ? Math.round(nonExpired.reduce((sum, offer) => sum + (parseFloat(offer.discount) || 0), 0) / nonExpired.length) 
            : 0;

        return { 
            total: nonExpired.length,
            active, 
            expired, 
            dynamic, 
            fixed, 
            featured,
            autoConfirm,
            requirePrepayment,
            avgDiscount 
        };
    };

    const stats = calculateStats();

    // Loading state
    if (loading) {
        return (
            <Layout title="Offers">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Loading enhanced offers...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // No store state
    if (!hasStore) {
        return (
            <Layout title="Offers">
                <div className="flex items-center justify-center h-96">
                    <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Store className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">No Store Found</h3>
                        <p className="text-gray-600 mb-6">
                            You need to create a store and services before you can manage offers. 
                            Offers are created from existing services.
                        </p>
                        {storeError && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{storeError}</p>
                            </div>
                        )}
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.href = '/dashboard/stores'}
                                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Create Your First Store
                            </button>
                            <button
                                onClick={checkStoreAndLoadOffers}
                                className="text-gray-600 hover:text-gray-800 text-sm"
                            >
                                Refresh Page
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout
            title="Enhanced Offers"
            subtitle={`Manage your promotional offers with advanced booking settings - ${offers.length} total`}
            showSearch={false}
            rightContent={
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 text-white py-2.5 px-4 text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Offer
                </button>
            }
        >
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Active Offers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            <p className="text-xs text-gray-500 mt-1">Fixed: {stats.fixed} • Dynamic: {stats.dynamic}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Tag className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Available Now</p>
                            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                            <p className="text-xs text-gray-500 mt-1">Ready for booking</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Auto-Confirm</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.autoConfirm}</p>
                            <p className="text-xs text-gray-500 mt-1">Instant booking</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Prepayment</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.requirePrepayment}</p>
                            <p className="text-xs text-gray-500 mt-1">Payment required</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1">Avg. Discount</p>
                            <p className="text-2xl font-bold text-red-600">{stats.avgDiscount}%</p>
                            <p className="text-xs text-gray-500 mt-1">Across active offers</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Search and Filter Section */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-600" />
                        Filter & Search Enhanced Offers
                    </h3>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                            Showing {filteredOffers.length} of {offers.length} offers
                        </span>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
                
                <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search offers and services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Enhanced Filter Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'all', label: 'Active Offers', count: stats.total, icon: Tag },
                            { key: 'active', label: 'Available Now', count: stats.active, icon: CheckCircle },
                            { key: 'fixed', label: 'Fixed Price', count: stats.fixed, icon: DollarSign },
                            { key: 'dynamic', label: 'Dynamic Price', count: stats.dynamic, icon: Calculator },
                            { key: 'auto-confirm', label: 'Auto-Confirm', count: stats.autoConfirm, icon: Shield },
                            { key: 'prepayment', label: 'Prepayment', count: stats.requirePrepayment, icon: CreditCard },
                            { key: 'featured', label: 'Featured', count: stats.featured, icon: Star },
                            { key: 'expired', label: 'Expired', count: stats.expired, icon: Calendar }
                        ].map(({ key, label, count, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filter === key
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label} ({count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {storeError && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                            <span className="text-yellow-800">{storeError}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Enhanced Offers Grid */}
            <div className="space-y-6">
                {filteredOffers?.length > 0 ? (
                    <div className="grid gap-6">
                        {filteredOffers.map((offer) => {
                            const expired = isOfferExpired(offer.expiration_date);
                            const isDynamic = offer.offer_type === 'dynamic' || 
                                             offer.service?.type === 'dynamic' ||
                                             offer.requires_consultation === true;
                            const bookingBadges = getBookingSettingsBadges(offer.service);
                            
                            return (
                                <div key={offer.id} className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                        {/* Enhanced Offer Details */}
                                        <div className="flex-1 space-y-4">
                                            {/* Header with enhanced badges */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            {offer.title || offer.service?.name || 'Special Offer'}
                                                        </h3>
                                                        {offer.featured && (
                                                            <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 text-sm">
                                                        {offer.description}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {getStatusBadge(offer.status, offer.expiration_date)}
                                                    {getOfferTypeBadge(offer)}
                                                </div>
                                            </div>

                                            {/* Service Details with enhanced booking info */}
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Store className="w-4 h-4 text-gray-500" />
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {offer.service?.name || 'Unknown Service'}
                                                    </span>
                                                </div>
                                                
                                                {offer.service && (
                                                    <div className="text-sm text-gray-600">
                                                        {isDynamic ? (
                                                            <span>{offer.service.price_range || 'Price varies'}</span>
                                                        ) : (
                                                            <>
                                                                <span>KES {offer.service.price || 'N/A'}</span>
                                                                {offer.service.duration && (
                                                                    <span> • {offer.service.duration}min</span>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {offer.requires_consultation && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4 text-purple-600" />
                                                        <span className="text-sm text-purple-600 font-medium">Consultation Required</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* NEW: Booking Settings Display */}
                                            {bookingBadges.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {bookingBadges.map((badge, index) => (
                                                        <div
                                                            key={index}
                                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}
                                                        >
                                                            <badge.icon className={`w-3 h-3 ${badge.iconColor}`} />
                                                            {badge.label}
                                                        </div>
                                                    ))}
                                                    {offer.service?.confirmation_message && (
                                                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                                                            <MessageSquare className="w-3 h-3 text-gray-600" />
                                                            Custom Message
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Enhanced Discount Info */}
                                            <div className="bg-green-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-lg font-bold text-green-700">
                                                            {offer.discount}% OFF
                                                        </p>
                                                        {!isDynamic && offer.service?.price && (
                                                            <p className="text-sm text-green-600">
                                                                Save KES {((offer.service.price * offer.discount) / 100).toFixed(2)}
                                                            </p>
                                                        )}
                                                        {isDynamic && offer.discount_explanation && (
                                                            <p className="text-sm text-orange-600">
                                                                {offer.discount_explanation}
                                                            </p>
                                                        )}
                                                        {isDynamic && !offer.discount_explanation && (
                                                            <p className="text-sm text-orange-600">
                                                                Off final quoted price
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center text-gray-600">
                                                            <Calendar className="w-4 h-4 mr-1" />
                                                            <span className={`text-sm ${expired ? 'text-red-600 font-medium' : ''}`}>
                                                                Expires {formatDate(offer.expiration_date)}
                                                            </span>
                                                        </div>
                                                        {expired && (
                                                            <p className="text-sm text-red-500 mt-1 font-medium">Expired</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* NEW: Service-specific booking info */}
                                                {offer.service && (
                                                    <div className="mt-3 pt-3 border-t border-green-200">
                                                        <div className="flex flex-wrap gap-3 text-xs">
                                                            {offer.service.auto_confirm_bookings && (
                                                                <div className="flex items-center gap-1 text-green-700">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    <span>Instant confirmation</span>
                                                                </div>
                                                            )}
                                                            {offer.service.require_prepayment && (
                                                                <div className="flex items-center gap-1 text-blue-700">
                                                                    <CreditCard className="w-3 h-3" />
                                                                    <span>Prepayment required</span>
                                                                </div>
                                                            )}
                                                            {offer.service.allow_early_checkin && (
                                                                <div className="flex items-center gap-1 text-purple-700">
                                                                    <UserCheck className="w-3 h-3" />
                                                                    <span>Early check-in: {offer.service.early_checkin_minutes || 15}min</span>
                                                                </div>
                                                            )}
                                                            {offer.service.min_cancellation_hours && (
                                                                <div className="flex items-center gap-1 text-orange-700">
                                                                    <Clock className="w-3 h-3" />
                                                                    <span>Cancel: {offer.service.min_cancellation_hours}h notice</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Terms and conditions */}
                                                {offer.terms_conditions && (
                                                    <div className="mt-3 pt-3 border-t border-green-200">
                                                        <div className="flex items-start gap-2">
                                                            <Info className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-sm font-medium text-green-900">Terms & Conditions</p>
                                                                <p className="text-sm text-green-700 mt-1">{offer.terms_conditions}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleEditClick(offer)}
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(offer)}
                                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {/* NEW: Advanced service info expandable section */}
                                    {(offer.service?.confirmation_message || offer.service?.cancellation_policy) && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {offer.service.confirmation_message && (
                                                    <div className="bg-blue-50 p-3 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-medium text-blue-900">Confirmation Message</p>
                                                                <p className="text-xs text-blue-700 mt-1">{offer.service.confirmation_message}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {offer.service.cancellation_policy && (
                                                    <div className="bg-orange-50 p-3 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <Info className="w-4 h-4 text-orange-600 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-medium text-orange-900">Cancellation Policy</p>
                                                                <p className="text-xs text-orange-700 mt-1">{offer.service.cancellation_policy}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-100 p-12">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Tag className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                {filter === 'all' ? 'No active offers yet' : `No ${filter} offers found`}
                            </h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                {filter === 'all' 
                                    ? 'Create your first offer to attract more customers with special promotions and advanced booking features'
                                    : `Try selecting a different filter or create new offers with enhanced service settings`
                                }
                            </p>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Create Enhanced Offer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Enhanced Offer Modal */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={closeModal} 
                title={editingOffer ? 'Edit Enhanced Offer' : 'Create Enhanced Offer'}
                size="xl"
            >
                <EnhancedOfferForm 
                    onClose={closeModal} 
                    onOfferCreated={editingOffer ? handleUpdateOffer : handleCreateOffer}
                    editingOffer={editingOffer}
                />
            </Modal>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <Modal 
                    isOpen={true} 
                    onClose={() => setDeleteConfirm(null)} 
                    title="Delete Enhanced Offer"
                >
                    <div className="p-6">
                        <div className="flex items-center text-red-600 mb-4">
                            <AlertCircle className="w-6 h-6 mr-2" />
                            <span className="font-medium">Are you sure?</span>
                        </div>
                        <p className="text-gray-600 mb-4">
                            This will permanently delete the offer "{deleteConfirm.title || deleteConfirm.service?.name}". 
                            This action cannot be undone and will affect any existing bookings.
                        </p>
                        {deleteConfirm.service && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                                <h4 className="text-sm font-medium text-blue-900 mb-2">Associated Service Settings:</h4>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <p>• Service: {deleteConfirm.service.name}</p>
                                    <p>• Type: {deleteConfirm.service.type || 'Fixed'}</p>
                                    {deleteConfirm.service.auto_confirm_bookings && (
                                        <p>• Auto-confirmation enabled</p>
                                    )}
                                    {deleteConfirm.service.require_prepayment && (
                                        <p>• Prepayment required</p>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteOffer(deleteConfirm.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Delete Offer
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
};

export default EnhancedOfferPage;