import React, { useState, useEffect } from 'react';
import Layout from '../../elements/Layout';
import merchantAuthService from '../../services/merchantAuthService';
import { 
  Star, 
  User, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Filter,
  Download,
  Eye,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Award,
  BarChart3,
  Users,
  Heart,
  Shield,
  RefreshCw,
  X,
  Lightbulb,
  Quote
} from 'lucide-react';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [storeData, setStoreData] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Review statistics
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recentTrend: 'stable'
  });

  // Get auth headers
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

  // Fetch reviews for the merchant's store
  const fetchStoreReviews = async (storeId = null) => {
    try {
      if (!checkAuthStatus()) {
        return { reviews: [], stats: null };
      }
      
      const response = await fetch(`http://localhost:4000/api/v1/merchant/reviews`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.status === 404) {
        return { reviews: [], stats: null };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication failed while fetching reviews.');
        }
        
        throw new Error(errorData.message || `Failed to fetch reviews (${response.status})`);
      }

      const data = await response.json();
      
      return {
        reviews: data.success ? (data.reviews || []) : [],
        stats: data.success ? data.stats : null
      };
      
    } catch (error) {
      console.error('Error fetching merchant reviews:', error);
      throw error;
    }
  };

  // Calculate review statistics
  const calculateReviewStats = (reviewsData) => {
    if (!reviewsData || reviewsData.length === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recentTrend: 'stable'
      };
    }

    const totalReviews = reviewsData.length;
    const averageRating = reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsData.forEach(review => {
      if (ratingDistribution[review.rating] !== undefined) {
        ratingDistribution[review.rating]++;
      }
    });

    let recentTrend = 'stable';
    if (totalReviews >= 10) {
      const recentReviews = reviewsData.slice(0, 10);
      const olderReviews = reviewsData.slice(10, 20);
      
      if (olderReviews.length > 0) {
        const recentAvg = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length;
        const olderAvg = olderReviews.reduce((sum, r) => sum + r.rating, 0) / olderReviews.length;
        
        if (recentAvg > olderAvg + 0.2) recentTrend = 'improving';
        else if (recentAvg < olderAvg - 0.2) recentTrend = 'declining';
      }
    }

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      recentTrend
    };
  };

  // Filter and sort reviews
  const getFilteredAndSortedReviews = () => {
    let filteredReviews = [...reviews];

    if (filterRating !== 'all') {
      filteredReviews = filteredReviews.filter(review => review.rating === parseInt(filterRating));
    }

    switch (sortBy) {
      case 'newest':
        filteredReviews.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at));
        break;
      case 'oldest':
        filteredReviews.sort((a, b) => new Date(a.createdAt || a.created_at) - new Date(b.createdAt || b.created_at));
        break;
      case 'highest':
        filteredReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filteredReviews.sort((a, b) => a.rating - b.rating);
        break;
      default:
        break;
    }

    return filteredReviews;
  };

  // Render star rating
  const renderStars = (rating = 0, size = 'default') => {
    const sizeClasses = {
      small: 'w-3 h-3',
      default: 'w-4 h-4',
      large: 'w-5 h-5'
    };

    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size]} ${
              i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // Render rating distribution bar
  const renderRatingBar = (rating, count, total) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 w-16">
          <span className="text-sm font-medium text-gray-700">{rating}</span>
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        </div>
        <div className="flex-1 bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-900 w-12 text-right">{count}</span>
        <span className="text-xs text-gray-500 w-12 text-right">
          {total > 0 ? `${Math.round(percentage)}%` : '0%'}
        </span>
      </div>
    );
  };

  // Utility function to calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffInHours = Math.floor((now - reviewDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} months ago`;
  };

  // Refresh data
  const handleRefresh = async () => {
    if (!storeId) return;
    
    try {
      setRefreshing(true);
      
      const { reviews: storeReviews, stats: backendStats } = await fetchStoreReviews(storeId);
      setReviews(storeReviews);
      
      const stats = backendStats || calculateReviewStats(storeReviews);
      setReviewStats(stats);
      
    } catch (error) {
      console.error('Error refreshing reviews:', error);
      setError('Failed to refresh reviews. Please try again.');
    } finally {
      setRefreshing(false);
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
        
        const { reviews: storeReviews, stats: backendStats } = await fetchStoreReviews(merchantStoreId);
        setReviews(storeReviews);
        
        const stats = backendStats || calculateReviewStats(storeReviews);
        setReviewStats(stats);
        
      } catch (error) {
        console.error('Error loading reviews data:', error);
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

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading customer reviews...</p>
      </div>
    </div>
  );

  const filteredReviews = getFilteredAndSortedReviews();

  if (loading) {
    return (
      <Layout 
        title="Customer Reviews"
        subtitle="Track and manage customer feedback"
      >
        <LoadingSpinner />
      </Layout>
    );
  }

  return (
    <Layout 
      title="Customer Reviews"
      subtitle="Track and manage customer feedback"
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

        {/* Header Stats Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Customer Reviews</h2>
                <p className="text-yellow-100">
                  {storeData ? `Reviews for ${storeData.name}` : 'Monitor your customer feedback'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white font-medium rounded-xl hover:bg-opacity-30 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                {reviews.length > 0 && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-white bg-opacity-20 text-white font-medium rounded-xl hover:bg-opacity-30 transition-colors">
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg bg-white bg-opacity-10 p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-yellow-200" />
                  <div className="text-2xl font-bold">{reviewStats.totalReviews}</div>
                </div>
                <div className="text-sm text-yellow-100">Total Reviews</div>
              </div>
              <div className="rounded-lg bg-white bg-opacity-10 p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-200" />
                  <div className="text-2xl font-bold">{reviewStats.averageRating}</div>
                </div>
                <div className="text-sm text-yellow-100">Average Rating</div>
              </div>
              <div className="rounded-lg bg-white bg-opacity-10 p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-200" />
                  <div className="text-2xl font-bold">{reviewStats.ratingDistribution[5]}</div>
                </div>
                <div className="text-sm text-yellow-100">5-Star Reviews</div>
              </div>
              <div className="rounded-lg bg-white bg-opacity-10 p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-yellow-200" />
                  <div className="text-lg font-bold capitalize">{reviewStats.recentTrend}</div>
                </div>
                <div className="text-sm text-yellow-100">Recent Trend</div>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Reviews</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              
              {error.includes('No store found') ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    You need to create a store before viewing customer reviews.
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
          <div className="space-y-6">
            {/* Rating Distribution */}
            {reviewStats.totalReviews > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Rating Distribution</h3>
                      <p className="text-sm text-gray-600">Breakdown of customer ratings</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div key={rating}>
                      {renderRatingBar(rating, reviewStats.ratingDistribution[rating], reviewStats.totalReviews)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Filter & Sort Reviews</h3>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </button>
                </div>
              </div>
              
              {showFilters && (
                <div className="p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Filter by Rating</label>
                      <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                      >
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Sort by</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="highest">Highest Rating</option>
                        <option value="lowest">Lowest Rating</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Customer Reviews 
                        {filterRating !== 'all' && (
                          <span className="ml-2 text-sm font-normal text-gray-600">
                            ({filterRating} star{filterRating !== '1' ? 's' : ''})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Showing {filteredReviews.length} of {reviews.length} reviews
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {filteredReviews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {/* Customer Avatar */}
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                            {(review.User?.firstName || review.user?.first_name || review.customerName || 'A').charAt(0).toUpperCase()}
                          </div>
                          
                          {/* Review Content */}
                          <div className="flex-1 min-w-0">
                            {/* Customer Info */}
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="font-semibold text-gray-900">
                                {review.User?.firstName 
                                  ? `${review.User.firstName} ${review.User.lastName?.charAt(0) || ''}.`
                                  : review.user?.first_name
                                  ? `${review.user.first_name} ${review.user.last_name?.charAt(0) || ''}.`
                                  : review.customerName || review.name || 'Anonymous Customer'
                                }
                              </h4>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <Shield className="h-3 w-3 mr-1" />
                                {review.User ? 'Verified' : 'Customer'}
                              </span>
                            </div>
                            
                            {/* Rating and Date */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="flex items-center gap-2">
                                {renderStars(review.rating)}
                                <span className="font-semibold text-gray-900">{review.rating}/5</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(review.createdAt || review.created_at).toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{getTimeAgo(review.createdAt || review.created_at)}</span>
                              </div>
                            </div>

                            {/* Review Text */}
                            <div className="relative">
                              <Quote className="absolute top-0 left-0 w-4 h-4 text-gray-300 -translate-x-1 -translate-y-1" />
                              <div className="bg-gray-50 rounded-xl p-4 ml-3">
                                <p className="text-gray-700 leading-relaxed">
                                  {review.text || review.comment || 'No comment provided.'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="View customer profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Helpful review"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Review Metadata */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                        <span>Review #{review.id.substring(0, 8)}...</span>
                        <span>{getTimeAgo(review.createdAt || review.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviews.length > 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews match your filters</h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your filter criteria to see more reviews.
                  </p>
                  <button
                    onClick={() => {
                      setFilterRating('all');
                      setSortBy('newest');
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600 mb-8">
                    {storeData ? 
                      `Customers haven't left any reviews for ${storeData.name} yet. Reviews will appear here once customers start sharing their experiences.` :
                      'Customer reviews will appear here once they start sharing their experiences with your store.'
                    }
                  </p>
                  
                  {/* Tips for getting reviews */}
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-md mx-auto">
                    <div className="flex items-center justify-center mb-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Lightbulb className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-blue-900 mb-4">Tips to Get More Reviews</h4>
                    <ul className="text-blue-800 text-sm space-y-3 text-left">
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Provide exceptional customer service</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Follow up with customers after purchases</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Respond to existing reviews promptly</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Encourage satisfied customers to share feedback</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reviews;