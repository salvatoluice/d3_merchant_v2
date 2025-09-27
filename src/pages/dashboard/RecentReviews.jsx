import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, MessageSquare, Star, Calendar, Shield, Quote } from 'lucide-react';
import merchantAuthService from '../../services/merchantAuthService';

const RecentReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchReviews();
    }, []);

    // Get auth headers (same as your Reviews page)
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

    // Check authentication status (same as your Reviews page)
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

    // Fetch reviews using the same API endpoint as your Reviews page
    const fetchReviews = async () => {
        try {
            setLoading(!refreshing);
            setError(null);
            
            if (!checkAuthStatus()) {
                return;
            }
            
            console.log('📝 Fetching merchant reviews for dashboard...');
            
            const response = await fetch(`http://localhost:4000/api/v1/merchant/reviews`, {
                method: 'GET',
                headers: getAuthHeaders()
            });

            if (response.status === 404) {
                setReviews([]);
                return;
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                
                if (response.status === 401) {
                    throw new Error('Authentication failed while fetching reviews.');
                }
                
                throw new Error(errorData.message || `Failed to fetch reviews (${response.status})`);
            }

            const data = await response.json();
            
            if (data.success) {
                // Get only the 5 most recent reviews for dashboard
                const recentReviews = (data.reviews || []).slice(0, 5);
                setReviews(recentReviews);
                console.log(`✅ Loaded ${recentReviews.length} recent reviews`);
            } else {
                throw new Error('Failed to fetch reviews');
            }
            
        } catch (err) {
            console.error('❌ Error fetching reviews:', err);
            setError(err.message);
            setReviews([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchReviews();
    };

    const getReviewType = (rating) => {
        if (rating >= 4) return 'positive';
        if (rating >= 3) return 'neutral';
        return 'negative';
    };

    const typeStyles = {
        positive: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        neutral: 'text-slate-700 bg-slate-50 border-slate-200',
        negative: 'text-rose-700 bg-rose-50 border-rose-200',
    };

    // Render stars (same as your Reviews page)
    const renderStars = (rating = 0) => (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-4 h-4 ${
                        i < Math.floor(rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                    }`}
                />
            ))}
            <span className="ml-1 text-xs font-medium text-gray-600">{rating}/5</span>
        </div>
    );

    // Get customer name (same logic as your Reviews page)
    const getCustomerName = (review) => {
        return review.User?.firstName 
            ? `${review.User.firstName} ${review.User.lastName?.charAt(0) || ''}.`
            : review.user?.first_name
            ? `${review.user.first_name} ${review.user.last_name?.charAt(0) || ''}.`
            : review.customerName || review.name || 'Anonymous';
    };

    // Get review text (same logic as your Reviews page)
    const getReviewText = (review) => {
        return review.text || review.comment || 'No comment provided';
    };

    // Time ago calculation (same as your Reviews page)
    const getTimeAgo = (date) => {
        const now = new Date();
        const reviewDate = new Date(date);
        const diffInHours = Math.floor((now - reviewDate) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        const diffInWeeks = Math.floor(diffInDays / 7);
        if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
        
        return 'Recently';
    };

    if (loading) {
        return (
            <div className="w-full md:w-[30%] border p-6 rounded-xl border-gray-200 bg-white shadow-sm backdrop-blur-sm">
                <h2 className="mb-6 text-primary text-[18px] font-semibold border-b pb-3 border-gray-100">
                    Recent Reviews
                </h2>
                <div className="flex flex-col gap-3 w-full">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <div className="h-4 bg-gray-200 rounded w-20"></div>
                                <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full md:w-[30%] border p-6 rounded-xl border-gray-200 bg-white shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6 border-b pb-3 border-gray-100">
                <h2 className="text-primary text-[18px] font-semibold">
                    Recent Reviews
                </h2>
                <button 
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                </button>
            </div>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500" />
                    <div className="flex-1">
                        <p className="text-red-700 text-sm">Failed to load reviews</p>
                        <button 
                            onClick={handleRefresh}
                            className="text-red-600 hover:text-red-800 text-xs font-medium mt-1"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            )}
            
            {reviews.length === 0 && !error ? (
                <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No reviews yet</p>
                    <p className="text-gray-400 text-xs mt-1">Reviews will appear here once customers start reviewing your services</p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 w-full max-h-80 overflow-y-auto">
                    {reviews.map((review) => {
                        const reviewType = getReviewType(review.rating);
                        return (
                            <article
                                key={review.id}
                                className={`flex flex-col p-3 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${typeStyles[reviewType]}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-[15px] font-medium truncate">
                                                {getCustomerName(review)}
                                            </h3>
                                            {review.User && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                                    <Shield className="h-2.5 w-2.5 mr-1" />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Calendar className="w-3 h-3" />
                                            <span>{getTimeAgo(review.createdAt || review.created_at)}</span>
                                        </div>
                                    </div>
                                    {renderStars(review.rating)}
                                </div>
                                
                                <div className="relative">
                                    <Quote className="absolute top-0 left-0 w-3 h-3 text-gray-300 -translate-x-0.5 -translate-y-0.5" />
                                    <p className="text-[14px] line-clamp-2 ml-2 leading-relaxed">
                                        {getReviewText(review)}
                                    </p>
                                </div>
                                
                                {review.service && (
                                    <span className="text-xs opacity-60 mt-2 truncate">
                                        Service: {review.service.name || review.service.title}
                                    </span>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
            
            {reviews.length > 0 && (
                <div className="text-center mt-4">
                    <button 
                        onClick={() => window.location.href = '/dashboard/reviews'}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                    >
                        View All Reviews
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecentReviews;