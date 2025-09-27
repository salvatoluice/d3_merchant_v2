import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import moment from "moment";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  CreditCard,
  DollarSign,
  Settings,
  Star,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit3,
  Save,
  X,
  Copy,
  QrCode,
  FileText,
  Tag,
  Building,
  Users,
  Plus
} from "lucide-react";

// Mock Layout component since it's not available
const Layout = ({ title, children }) => (
  <div className="min-h-screen bg-gray-50">
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  </div>
);

// Mock API functions
const fetchSingleBooking = async (bookingId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock booking data
  const mockBooking = {
    id: bookingId,
    status: 'confirmed',
    bookingType: Math.random() > 0.5 ? 'offer' : 'service',
    offerId: Math.random() > 0.5 ? 123 : null,
    startTime: '2024-12-20T14:00:00Z',
    endTime: '2024-12-20T15:00:00Z',
    createdAt: '2024-12-19T10:00:00Z',
    updatedAt: '2024-12-19T10:00:00Z',
    notes: 'Customer requested window seat',
    merchantNotes: 'VIP customer',
    accessFee: 500,
    qrCode: 'https://via.placeholder.com/150x150?text=QR+Code',
    User: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+254712345678',
      createdAt: '2024-01-15T00:00:00Z'
    },
    Service: {
      name: 'Premium Consultation',
      price: 2500,
      duration: 60,
      category: 'Professional Services',
      description: 'Comprehensive consultation service with expert analysis'
    },
    Offer: Math.random() > 0.5 ? {
      title: 'Holiday Special',
      discount: 20,
      description: 'Special holiday discount for premium services',
      service: {
        name: 'Premium Consultation',
        price: 2500
      }
    } : null,
    Store: {
      name: 'Downtown Branch',
      location: '123 Main Street, City Center',
      phone_number: '+254701234567'
    },
    Staff: {
      name: 'Sarah Johnson',
      role: 'Senior Consultant'
    },
    Payment: Math.random() > 0.5 ? {
      status: 'completed',
      method: 'mpesa',
      transaction_id: 'TXN123456789'
    } : null
  };

  return { success: true, booking: mockBooking };
};

const updateBookingStatus = async (bookingId, status, notes) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { success: true };
};

const addClientNote = async (userId, note, noteType) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { 
    success: true, 
    note: {
      id: Date.now(),
      note,
      noteType,
      createdAt: new Date().toISOString()
    }
  };
};

const getClientNotes = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return { 
    success: true, 
    notes: [
      {
        id: 1,
        note: 'Customer prefers morning appointments',
        noteType: 'preference',
        createdAt: '2024-12-18T10:00:00Z'
      },
      {
        id: 2,
        note: 'Previous service completed successfully',
        noteType: 'general',
        createdAt: '2024-12-17T15:30:00Z'
      }
    ]
  };
};

const BookingView = () => {
  const { bookingId = '12345' } = useParams(); // Default for demo
  const navigate = useNavigate();
  
  // Main state
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Action states
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  
  // Notes state
  const [clientNotes, setClientNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
    { value: 'no-show', label: 'No Show', color: 'bg-gray-100 text-gray-800', icon: XCircle }
  ];

  const noteTypes = [
    { value: 'general', label: 'General Note' },
    { value: 'preference', label: 'Client Preference' },
    { value: 'issue', label: 'Issue/Concern' },
    { value: 'follow-up', label: 'Follow-up Required' }
  ];

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchSingleBooking(bookingId);
      
      if (response.success && response.booking) {
        setBooking(response.booking);
        
        // Load client notes if available
        if (response.booking.User?.id) {
          loadClientNotes(response.booking.User.id);
        }
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      console.error('Error loading booking details:', err);
      setError(err.message || 'Failed to load booking details');
      toast.error('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const loadClientNotes = async (userId) => {
    try {
      setLoadingNotes(true);
      const response = await getClientNotes(userId);
      if (response.success && response.notes) {
        setClientNotes(response.notes);
      }
    } catch (err) {
      console.error('Error loading client notes:', err);
      toast.error('Failed to load client notes');
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      setIsUpdatingStatus(true);
      
      const response = await updateBookingStatus(bookingId, newStatus, statusNotes);
      
      if (response.success) {
        setBooking(prev => ({
          ...prev,
          status: newStatus,
          merchantNotes: statusNotes || prev.merchantNotes,
          updatedAt: new Date().toISOString()
        }));
        
        setShowStatusModal(false);
        setNewStatus('');
        setStatusNotes('');
        toast.success('Booking status updated successfully');
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      toast.error(err.message || 'Failed to update booking status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    if (!booking?.User?.id) {
      toast.error('No user associated with this booking');
      return;
    }

    try {
      const response = await addClientNote(booking.User.id, newNote, noteType);
      
      if (response.success) {
        setClientNotes(prev => [response.note, ...prev]);
        setNewNote('');
        setNoteType('general');
        setShowNotesModal(false);
        toast.success('Note added successfully');
      } else {
        toast.error(response.message || 'Failed to add note');
      }
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error(err.message || 'Failed to add note');
    }
  };

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(`${label} copied to clipboard`);
      }).catch(() => {
        toast.error('Failed to copy to clipboard');
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success(`${label} copied to clipboard`);
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(option => option.value === status) || statusOptions[0];
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'completed':
      case 'complete':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Loading state
  if (loading) {
    return (
      <Layout title="Loading Booking...">
        <div className="bg-gray-50 min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout title="Error">
        <div className="bg-gray-50 min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Booking</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={() => loadBookingDetails()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // No booking found
  if (!booking) {
    return (
      <Layout title="Booking Not Found">
        <div className="bg-gray-50 min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Not Found</h2>
              <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist or you don't have access to it.</p>
              <button
                onClick={() => navigate('/dashboard/bookings')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Back to Bookings
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const isOfferBooking = booking.bookingType === 'offer' || !!booking.offerId;
  const isServiceBooking = !isOfferBooking;
  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;

  return (
    <Layout title={`Booking #${booking.id?.toString().slice(-6) || 'Unknown'}`}>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition duration-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  {isOfferBooking ? (
                    <Tag className="w-8 h-8 mr-3 text-purple-600" />
                  ) : (
                    <Settings className="w-8 h-8 mr-3 text-blue-600" />
                  )}
                  {isOfferBooking ? 'Offer Booking' : 'Service Booking'}
                </h1>
                <p className="text-gray-600">
                  Booking ID: #{booking.id?.toString().slice(-8) || 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color} flex items-center space-x-2`}>
                <StatusIcon className="w-4 h-4" />
                <span>{statusInfo.label}</span>
              </span>
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Update Status</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Booking Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Customer Information */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <User className="w-5 h-5 mr-2 text-blue-600" />
                    Customer Information
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-semibold text-gray-900">
                          {booking.User?.firstName || booking.User?.first_name || 'N/A'} {booking.User?.lastName || booking.User?.last_name || ''}
                        </p>
                        <button
                          onClick={() => copyToClipboard(`${booking.User?.firstName} ${booking.User?.lastName}`, 'Name')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900 flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-500" />
                          {booking.User?.email || 'Not provided'}
                        </p>
                        {booking.User?.email && (
                          <button
                            onClick={() => copyToClipboard(booking.User.email, 'Email')}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-900 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-500" />
                          {booking.User?.phoneNumber || booking.User?.phone || 'Not provided'}
                        </p>
                        {(booking.User?.phoneNumber || booking.User?.phone) && (
                          <button
                            onClick={() => copyToClipboard(booking.User.phoneNumber || booking.User.phone, 'Phone')}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Customer Since</label>
                      <p className="text-gray-900">
                        {booking.User?.createdAt ? moment(booking.User.createdAt).format('MMM DD, YYYY') : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service/Offer Details */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    {isOfferBooking ? (
                      <Tag className="w-5 h-5 mr-2 text-purple-600" />
                    ) : (
                      <Settings className="w-5 h-5 mr-2 text-blue-600" />
                    )}
                    {isOfferBooking ? 'Offer Details' : 'Service Details'}
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isOfferBooking && booking.Offer ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Offer Title</label>
                          <p className="text-lg font-semibold text-gray-900">{booking.Offer.title}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Discount</label>
                          <p className="text-lg font-semibold text-purple-600">{booking.Offer.discount}%</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Service</label>
                          <p className="text-gray-900">{booking.Offer.service?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Original Price</label>
                          <p className="text-gray-900">{formatCurrency(booking.Offer.service?.price || 0)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Access Fee</label>
                          <p className="text-green-600 font-semibold">{formatCurrency(booking.accessFee || 0)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Final Price</label>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency((booking.Offer.service?.price || 0) * (1 - booking.Offer.discount / 100))}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Service Name</label>
                          <p className="text-lg font-semibold text-gray-900">{booking.Service?.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Service Price</label>
                          <p className="text-lg font-semibold text-green-600">{formatCurrency(booking.Service?.price || 0)}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Duration</label>
                          <p className="text-gray-900">{booking.Service?.duration || 60} minutes</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                          <p className="text-gray-900">{booking.Service?.category || 'General'}</p>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {(booking.Offer?.description || booking.Service?.description) && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                        {booking.Offer?.description || booking.Service?.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Booking Details
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                      <p className="text-lg font-semibold text-gray-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        {moment(booking.startTime).format('dddd, MMMM DD, YYYY')}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
                      <p className="text-lg font-semibold text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-blue-500" />
                        {moment(booking.startTime).format('h:mm A')} - {moment(booking.endTime).format('h:mm A')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                      <p className="text-gray-900 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-red-500" />
                        {booking.Store?.name || booking.store?.name || 'N/A'}
                      </p>
                      {booking.Store?.location && (
                        <p className="text-sm text-gray-600 ml-6">{booking.Store.location}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Staff Member</label>
                      <p className="text-gray-900 flex items-center">
                        <Users className="w-4 h-4 mr-2 text-green-500" />
                        {booking.Staff?.name || booking.staff?.name || 'Not assigned'}
                      </p>
                      {booking.Staff?.role && (
                        <p className="text-sm text-gray-600 ml-6">{booking.Staff.role}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Created</label>
                      <p className="text-gray-900">
                        {moment(booking.createdAt).format('MMM DD, YYYY h:mm A')}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Last Updated</label>
                      <p className="text-gray-900">
                        {moment(booking.updatedAt).format('MMM DD, YYYY h:mm A')}
                      </p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-600 mb-2">Booking Notes</label>
                      <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{booking.notes}</p>
                    </div>
                  )}

                  {booking.merchantNotes && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-600 mb-2">Merchant Notes</label>
                      <p className="text-gray-700 bg-blue-50 p-4 rounded-lg border border-blue-200">{booking.merchantNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information (for offer bookings) */}
              {isOfferBooking && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-green-600" />
                      Payment Information
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Access Fee Status</label>
                        <p className={`text-lg font-semibold flex items-center ${getPaymentStatusColor(booking.Payment?.status)}`}>
                          <DollarSign className="w-4 h-4 mr-2" />
                          {booking.Payment?.status === 'completed' ? 'Paid' : 'Pending'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Access Fee Amount</label>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(booking.accessFee || 0)}
                        </p>
                      </div>

                      {booking.Payment && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                            <p className="text-gray-900 capitalize">{booking.Payment.method || 'N/A'}</p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Transaction ID</label>
                            <div className="flex items-center justify-between">
                              <p className="text-gray-900 font-mono text-sm">{booking.Payment.transaction_id || 'N/A'}</p>
                              {booking.Payment.transaction_id && (
                                <button
                                  onClick={() => copyToClipboard(booking.Payment.transaction_id, 'Transaction ID')}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="md:col-span-2">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <h4 className="font-medium text-purple-800 mb-2">Payment Summary</h4>
                          <div className="text-sm text-purple-700 space-y-1">
                            <p>Access Fee: {formatCurrency(booking.accessFee || 0)} {booking.Payment?.status === 'completed' ? '(Paid)' : '(Pending)'}</p>
                            <p>Remaining at Store: {formatCurrency((booking.Offer?.service?.price || 0) * (1 - (booking.Offer?.discount || 0) / 100) - (booking.accessFee || 0))}</p>
                            <p className="font-semibold">Total Service Value: {formatCurrency(booking.Offer?.service?.price || 0)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Section */}
              {booking.qrCode && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <QrCode className="w-5 h-5 mr-2 text-gray-600" />
                      Verification QR Code
                    </h2>
                  </div>
                  <div className="p-6 text-center">
                    <img
                      src={booking.qrCode}
                      alt="Booking QR Code"
                      className="w-32 h-32 mx-auto border border-gray-200 rounded-lg"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Customer can show this QR code for quick verification
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6 space-y-3">
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Update Status</span>
                  </button>
                  
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Add Note</span>
                  </button>

                  {booking.User?.email && (
                    <button
                      onClick={() => window.open(`mailto:${booking.User.email}?subject=Regarding your booking #${booking.id}&body=Hello ${booking.User.firstName},`)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email</span>
                    </button>
                  )}

                  {(booking.User?.phoneNumber || booking.User?.phone) && (
                    <button
                      onClick={() => window.open(`tel:${booking.User.phoneNumber || booking.User.phone}`)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition duration-200"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call Customer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Client Notes */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                    <span className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Client Notes ({clientNotes.length})
                    </span>
                    <button
                      onClick={() => setShowNotesModal(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </h3>
                </div>
                <div className="p-6">
                  {loadingNotes ? (
                    <div className="space-y-3">
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ) : clientNotes.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {clientNotes.slice(0, 5).map((note, index) => (
                        <div key={note.id || index} className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-700">{note.note}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  {note.noteType || 'general'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {moment(note.createdAt).fromNow()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {clientNotes.length > 5 && (
                        <p className="text-sm text-gray-500 text-center">
                          And {clientNotes.length - 5} more notes...
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No notes yet. Add the first note about this client.
                    </p>
                  )}
                </div>
              </div>

              {/* Store Information */}
              {booking.Store && (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      Store Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Store Name</label>
                        <p className="font-semibold text-gray-900">{booking.Store.name}</p>
                      </div>
                      {booking.Store.location && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                          <p className="text-gray-700">{booking.Store.location}</p>
                        </div>
                      )}
                      {booking.Store.phone_number && (
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                          <p className="text-gray-700">{booking.Store.phone_number}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Update Booking Status</h2>
                  <button
                    onClick={() => setShowStatusModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select new status</option>
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes about this status change..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowStatusModal(false)}
                    disabled={isUpdatingStatus}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus || !newStatus}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Update Status</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Note Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Add Client Note</h2>
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Type
                    </label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {noteTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Content
                    </label>
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your note about this client..."
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowNotesModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Note</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookingView;