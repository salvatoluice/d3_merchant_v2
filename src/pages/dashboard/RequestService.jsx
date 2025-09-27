import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, DollarSign, User, Eye, Briefcase, RefreshCw, AlertCircle } from 'lucide-react';

const RequestService = () => {
  const navigate = useNavigate();
  const [serviceRequests, setServiceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServiceRequests();
  }, []);

  const fetchServiceRequests = async () => {
    try {
      setLoading(!refreshing); // Don't show main loading if refreshing
      setError(null);
      
      // Dynamic import to avoid import errors
      const { default: merchantServiceRequestService } = await import('../../services/merchantServiceRequestService');
      
      console.log('🔍 Fetching service requests for merchant dashboard...');
      
      const response = await merchantServiceRequestService.getServiceRequestsForMerchant({
        page: 1,
        limit: 6, // Show only latest 6 requests on dashboard
        status: 'open'
      });

      console.log('📋 Service requests response:', response);

      if (response.success) {
        const requests = response.data?.requests || [];
        setServiceRequests(requests);
        console.log(`✅ Loaded ${requests.length} service requests`);
      } else {
        throw new Error(response.message || 'Failed to fetch service requests');
      }
    } catch (err) {
      console.error('❌ Error fetching service requests:', err);
      setError(err.message);
      
      // Set empty array on error
      setServiceRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServiceRequests();
  };

  const formatBudget = (request) => {
    const min = request.budgetMin || request.budget_min;
    const max = request.budgetMax || request.budget_max;
    
    if (min && max) {
      return `$${min} - $${max}`;
    } else if (min) {
      return `$${min}+`;
    } else if (max) {
      return `Up to $${max}`;
    }
    return 'Budget not specified';
  };

  const getTimeAgo = (dateString) => {
    try {
      const now = new Date();
      const date = new Date(dateString);
      const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Less than 1 hour ago';
      } else if (diffInHours < 24) {
        return `${Math.round(diffInHours)} hour${Math.round(diffInHours) !== 1 ? 's' : ''} ago`;
      } else {
        const days = Math.round(diffInHours / 24);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'Recently';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
      case 'normal':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCustomerName = (request) => {
    return request.customer?.name || 
           request.customerName || 
           request.customer?.first_name || 
           request.user?.name || 
           `${request.customer?.first_name || ''} ${request.customer?.last_name || ''}`.trim() ||
           'Customer';
  };

  const getLocation = (request) => {
    return request.location || 
           request.address || 
           request.customer?.location || 
           request.customer?.address ||
           null;
  };

  const handleViewDetails = (requestId) => {
    // Navigate to service requests page with the specific request highlighted
    navigate('/dashboard/serviceRequests', { 
      state: { highlightRequestId: requestId } 
    });
  };

  const handleViewAllRequests = () => {
    // Navigate to service requests page
    navigate('/dashboard/serviceRequests');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">New Service Requests</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">New Service Requests</h3>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" />
          <div className="flex-1">
            <p className="text-red-700 text-sm">Failed to load service requests</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}
      
      {serviceRequests.length === 0 && !error ? (
        <div className="text-center py-8">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No new service requests available</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for new opportunities</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {serviceRequests.map((request) => (
            <div 
              key={request.id} 
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {request.title || request.service_type || 'Service Request'}
                  </h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      {getCustomerName(request)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {getTimeAgo(request.createdAt || request.created_at)}
                    </div>
                  </div>
                </div>
                {request.priority && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                    {request.priority}
                  </span>
                )}
              </div>

              {request.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {request.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600">
                    <DollarSign size={14} />
                    {formatBudget(request)}
                  </div>
                  {getLocation(request) && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin size={14} />
                      {getLocation(request)}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => handleViewDetails(request.id)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                >
                  <Eye size={14} />
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {serviceRequests.length > 0 && (
        <div className="text-center mt-4">
          <button 
            onClick={handleViewAllRequests}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            View All Service Requests ({serviceRequests.length}+ available)
          </button>
        </div>
      )}
    </div>
  );
};

export default RequestService;