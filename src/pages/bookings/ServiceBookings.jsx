import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Plus, 
  Search, 
  X,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  MoreVertical,
  Filter,
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  UserCheck,
  CalendarDays,
  Timer,
  Phone,
  Mail,
  Copy,
  Building,
  CreditCard,
  DollarSign
} from "lucide-react";
import Layout from "../../elements/Layout";
import bookingApiService from "../../services/bookingApiService";
import moment from "moment";
import Modal from "../../elements/Modal";

const ServiceBookings = () => {
  // State management
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  // Filter and search states
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    store: '',
    staff: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(null);
  
  // Form states
  const [newBooking, setNewBooking] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    date: '',
    time: '',
    store: null,
    staff: null,
    service: '',
    duration: '',
    notes: '',
    paymentStatus: 'not_paid',
    depositAmount: ''
  });
  
  const [checkinData, setCheckinData] = useState({
    arrivalTime: new Date().toTimeString().slice(0, 5),
    notes: ''
  });

  const navigate = useNavigate();

  // Constants
  const stores = [
    { id: 1, name: "Downtown Branch", address: "123 Main St, City Center" },
    { id: 2, name: "Mall Location", address: "456 Shopping Mall, Level 2" },
    { id: 3, name: "Airport Terminal", address: "Terminal 1, Gate Area" },
    { id: 4, name: "Beachfront Office", address: "789 Ocean Drive" }
  ];

  const staff = [
    { id: 1, name: "Sarah Johnson", role: "Senior Specialist", rating: 4.9 },
    { id: 2, name: "Mike Rodriguez", role: "Expert Consultant", rating: 4.7 },
    { id: 3, name: "Emily Chen", role: "Premium Advisor", rating: 4.8 },
    { id: 4, name: "David Wilson", role: "Lead Specialist", rating: 4.6 }
  ];

  const paymentStatusOptions = [
    { value: 'not_paid', label: 'Pay in Store / Not Paid', color: 'bg-red-100 text-red-800' },
    { value: 'deposit', label: 'Deposit Paid', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'complete', label: 'Fully Paid', color: 'bg-green-100 text-green-800' }
  ];

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  const durationOptions = [
    { value: '30', label: '30 minutes' },
    { value: '45', label: '45 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1.5 hours' },
    { value: '120', label: '2 hours' },
    { value: '180', label: '3 hours' }
  ];

  // Data loading
  const loadBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading service bookings...');
      
      const response = await bookingApiService.getMerchantServiceBookings({
        limit: 100,
        offset: 0
      });
      
      console.log('Service bookings response:', response);
      
      if (response && response.success && response.bookings) {
        setBookings(response.bookings);
        setFilteredBookings(response.bookings);
        
        if (response.bookings.length === 0) {
          toast('No service bookings found');
        } else {
          toast.success(`${response.bookings.length} service bookings loaded`);
        }
      } else {
        throw new Error(response?.message || 'Failed to load service bookings');
      }
      
    } catch (error) {
      console.error('Failed to load service bookings:', error);
      setError(error.message);
      toast.error("Failed to fetch service bookings: " + error.message);
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      const response = await bookingApiService.getMerchantServiceBookings({
        limit: 100,
        offset: 0
      });
      
      if (response && response.success && response.bookings) {
        setBookings(response.bookings);
        setFilteredBookings(response.bookings);
        toast.success(`Service bookings refreshed - ${response.bookings.length} found`);
      } else {
        throw new Error(response?.message || 'Failed to refresh');
      }
      
    } catch (error) {
      toast.error('Failed to refresh data: ' + error.message);
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Effects
  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    let filtered = [...bookings];

    // Filter by tab
    if (activeTab === 'today') {
      const today = moment().format('YYYY-MM-DD');
      filtered = filtered.filter(booking => 
        moment(booking.startTime).format('YYYY-MM-DD') === today
      );
    }

    // Apply filters
    if (filters.startDate) {
      filtered = filtered.filter(booking => 
        moment(booking.startTime).format('YYYY-MM-DD') >= filters.startDate
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(booking => 
        moment(booking.startTime).format('YYYY-MM-DD') <= filters.endDate
      );
    }

    if (filters.store) {
      filtered = filtered.filter(booking => 
        booking.store?.id === parseInt(filters.store)
      );
    }

    if (filters.staff) {
      filtered = filtered.filter(booking => 
        booking.staff?.id === parseInt(filters.staff)
      );
    }

    if (filters.status) {
      filtered = filtered.filter(booking => 
        booking.status === filters.status
      );
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.User?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.User?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.User?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.startTime);
          bValue = new Date(b.startTime);
          break;
        case 'client':
          aValue = (a.customerName || `${a.User?.firstName} ${a.User?.lastName}`).toLowerCase();
          bValue = (b.customerName || `${b.User?.firstName} ${b.User?.lastName}`).toLowerCase();
          break;
        case 'store':
          aValue = a.storeName?.toLowerCase() || '';
          bValue = b.storeName?.toLowerCase() || '';
          break;
        case 'staff':
          aValue = a.staffName?.toLowerCase() || '';
          bValue = b.staffName?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBookings(filtered);
  }, [bookings, filters, sortBy, sortOrder, searchTerm, activeTab]);

  // Event handlers
  const handleSort = (key) => {
    setSortBy(key);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleCheckin = async () => {
    try {
      if (!selectedBooking) return;

      console.log('Checking in booking:', selectedBooking.id);

      const response = await bookingApiService.checkInServiceBooking(
        selectedBooking.id,
        checkinData.arrivalTime,
        checkinData.notes
      );

      if (response && response.success) {
        const updatedBookings = bookings.map(booking => {
          if (booking.id === selectedBooking.id) {
            return {
              ...booking,
              status: 'in_progress',
              checkedInAt: new Date().toISOString(),
              actualArrivalTime: checkinData.arrivalTime,
              checkinNotes: checkinData.notes
            };
          }
          return booking;
        });

        setBookings(updatedBookings);
        
        setCheckinData({
          arrivalTime: new Date().toTimeString().slice(0, 5),
          notes: ''
        });
        
        setShowCheckinModal(false);
        setSelectedBooking(null);
        
        toast.success(`Client checked in successfully!`);
      } else {
        throw new Error(response?.message || 'Check-in failed');
      }
      
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error("Failed to check in client: " + error.message);
    }
  };

  const handleCreateBooking = async () => {
    try {
      if (!newBooking.clientName || !newBooking.clientEmail || !newBooking.date || 
          !newBooking.time || !newBooking.store || !newBooking.staff || !newBooking.service) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (newBooking.paymentStatus === 'deposit' && !newBooking.depositAmount) {
        toast.error("Please enter deposit amount");
        return;
      }

      const bookingData = {
        id: Date.now(),
        User: {
          firstName: newBooking.clientName.split(' ')[0],
          lastName: newBooking.clientName.split(' ').slice(1).join(' '),
          email: newBooking.clientEmail,
          phone: newBooking.clientPhone
        },
        startTime: `${newBooking.date}T${convertTo24Hour(newBooking.time)}`,
        endTime: `${newBooking.date}T${convertTo24Hour(newBooking.time)}`,
        status: 'confirmed',
        Service: {
          name: newBooking.service,
          duration: parseInt(newBooking.duration) || 60
        },
        store: newBooking.store,
        staff: newBooking.staff,
        notes: newBooking.notes,
        paymentStatus: newBooking.paymentStatus,
        customerName: newBooking.clientName,
        serviceName: newBooking.service,
        storeName: newBooking.store?.name,
        staffName: newBooking.staff?.name,
        canModify: true
      };

      const updatedBookings = [bookingData, ...bookings];
      setBookings(updatedBookings);
      
      setNewBooking({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        date: '',
        time: '',
        store: null,
        staff: null,
        service: '',
        duration: '',
        notes: '',
        paymentStatus: 'not_paid',
        depositAmount: ''
      });
      
      setShowCreateModal(false);
      toast.success("Service booking created successfully!");
      
    } catch (error) {
      console.error('Create booking error:', error);
      toast.error("Failed to create service booking");
    }
  };

  const handleViewDetails = async (booking) => {
    try {
      console.log('Viewing details for booking:', booking.id);
      
      try {
        const response = await bookingApiService.getServiceBookingById(booking.id);
        if (response && response.success && response.booking) {
          setSelectedBooking(response.booking);
        } else {
          setSelectedBooking(booking);
        }
      } catch (detailError) {
        console.warn('Failed to fetch fresh booking details, using local data:', detailError);
        setSelectedBooking(booking);
      }
      
      setShowDetailsModal(true);
      setDropdownOpen(null);
    } catch (error) {
      console.error('Error viewing booking details:', error);
      toast.error('Failed to load booking details');
    }
  };

  const handleStatusUpdate = async (bookingId, newStatus, notes = '') => {
    try {
      console.log('Updating booking status:', { bookingId, newStatus, notes });

      let response;
      
      switch (newStatus.toLowerCase()) {
        case 'confirmed':
          response = await bookingApiService.confirmServiceBooking(bookingId, notes);
          break;
        case 'in_progress':
          response = await bookingApiService.checkInServiceBooking(bookingId, null, notes);
          break;
        case 'completed':
          response = await bookingApiService.completeServiceBooking(bookingId, notes);
          break;
        case 'cancelled':
          response = await bookingApiService.cancelServiceBooking(bookingId, notes);
          break;
        default:
          response = await bookingApiService.updateServiceBookingStatus(bookingId, newStatus, notes);
          break;
      }

      if (response && response.success) {
        const updatedBookings = bookings.map(booking => {
          if (booking.id === bookingId) {
            return {
              ...booking,
              status: newStatus,
              notes: notes ? `${booking.notes || ''}\n${notes}` : booking.notes
            };
          }
          return booking;
        });

        setBookings(updatedBookings);
        toast.success(`Booking ${newStatus} successfully`);
      } else {
        throw new Error(response?.message || 'Status update failed');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(`Failed to update booking status: ${error.message}`);
    }
  };

  // Utility functions
  const convertTo24Hour = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'deposit':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'KES 0.00';
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const copyToClipboard = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        toast.success(`${label} copied to clipboard`);
      }).catch(() => {
        toast.error('Failed to copy to clipboard');
      });
    }
  };

  const calculateStats = () => {
    const total = filteredBookings.length;
    const confirmed = filteredBookings.filter(s => 
      s.status?.toLowerCase() === 'confirmed'
    ).length;
    const inProgress = filteredBookings.filter(s => 
      s.status?.toLowerCase() === 'in_progress'
    ).length;
    const completed = filteredBookings.filter(s => 
      s.status?.toLowerCase() === 'completed'
    ).length;

    return { total, confirmed, inProgress, completed };
  };

  const getTodayStats = () => {
    const today = moment().format('YYYY-MM-DD');
    const todayBookings = bookings.filter(booking => 
      moment(booking.startTime).format('YYYY-MM-DD') === today
    );
    
    return {
      total: todayBookings.length,
      confirmed: todayBookings.filter(b => b.status?.toLowerCase() === 'confirmed').length,
      inProgress: todayBookings.filter(b => b.status?.toLowerCase() === 'in_progress').length,
      completed: todayBookings.filter(b => b.status?.toLowerCase() === 'completed').length
    };
  };

  const stats = calculateStats();
  const todayStats = getTodayStats();

  // Modal components
  const BookingDetailsModal = () => {
    if (!selectedBooking) return null;

    return (
      <Modal 
        isOpen={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)}
        title={`Booking Details - #${selectedBooking.id?.toString().slice(-6) || 'Unknown'}`}
        size="large"
      >
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedBooking.customerName || 
                     `${selectedBooking.User?.firstName || ''} ${selectedBooking.User?.lastName || ''}`.trim() ||
                     'Unknown Customer'}
                  </p>
                  <button
                    onClick={() => copyToClipboard(
                      selectedBooking.customerName || 
                      `${selectedBooking.User?.firstName || ''} ${selectedBooking.User?.lastName || ''}`.trim(),
                      'Name'
                    )}
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
                    {selectedBooking.User?.email || 'Not provided'}
                  </p>
                  {selectedBooking.User?.email && (
                    <button
                      onClick={() => copyToClipboard(selectedBooking.User?.email, 'Email')}
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
                    {selectedBooking.User?.phoneNumber || selectedBooking.User?.phone || 'Not provided'}
                  </p>
                  {(selectedBooking.User?.phoneNumber || selectedBooking.User?.phone) && (
                    <button
                      onClick={() => copyToClipboard(selectedBooking.User?.phoneNumber || selectedBooking.User?.phone, 'Phone')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status}
                </span>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Service Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Service Name</label>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedBooking.serviceName || selectedBooking.Service?.name || 'Unknown Service'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Price</label>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(selectedBooking.Service?.price || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Duration</label>
                <p className="text-gray-900">
                  {selectedBooking.duration || selectedBooking.Service?.duration || 60} minutes
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Status</label>
                <div className="flex items-center">
                  {getPaymentStatusIcon(selectedBooking.paymentStatus)}
                  <span className="text-sm text-gray-600 ml-2">
                    {paymentStatusOptions.find(p => p.value === selectedBooking.paymentStatus)?.label || 'Not Paid'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
                <p className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  {moment(selectedBooking.startTime).format('dddd, MMMM DD, YYYY')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Time</label>
                <p className="text-lg font-semibold text-gray-900 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-blue-500" />
                  {moment(selectedBooking.startTime).format('h:mm A')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Location</label>
                <p className="text-gray-900 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-red-500" />
                  {selectedBooking.storeName || selectedBooking.store?.name || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Staff Member</label>
                <p className="text-gray-900 flex items-center">
                  <User className="w-4 h-4 mr-2 text-green-500" />
                  {selectedBooking.staffName || selectedBooking.Staff?.name || selectedBooking.staff?.name || 'Not assigned'}
                </p>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">Booking Notes</label>
                <p className="text-gray-700 bg-gray-100 p-3 rounded-lg">{selectedBooking.notes}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            {selectedBooking.User?.email && (
              <button
                onClick={() => window.open(`mailto:${selectedBooking.User.email}?subject=Regarding your booking #${selectedBooking.id}&body=Hello ${selectedBooking.User.firstName},`)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition duration-200"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email</span>
              </button>
            )}

            {(selectedBooking.User?.phoneNumber || selectedBooking.User?.phone) && (
              <button
                onClick={() => window.open(`tel:${selectedBooking.User.phoneNumber || selectedBooking.User.phone}`)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
              >
                <Phone className="w-4 h-4" />
                <span>Call Customer</span>
              </button>
            )}

            {(selectedBooking.status?.toLowerCase() === 'confirmed') && (
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowCheckinModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <UserCheck className="w-4 h-4" />
                <span>Check-in Client</span>
              </button>
            )}

            {selectedBooking.status?.toLowerCase() === 'pending' && (
              <button
                onClick={() => {
                  handleStatusUpdate(selectedBooking.id, 'confirmed', 'Confirmed by merchant');
                  setShowDetailsModal(false);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Booking</span>
              </button>
            )}

            {selectedBooking.status?.toLowerCase() === 'in_progress' && (
              <button
                onClick={() => {
                  handleStatusUpdate(selectedBooking.id, 'completed', 'Service completed');
                  setShowDetailsModal(false);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Complete Service</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      );
    };
  
    const CheckinModal = () => (
      <Modal 
        isOpen={showCheckinModal} 
        onClose={() => {
          setShowCheckinModal(false);
          setSelectedBooking(null);
        }}
        title="Check-in Client"
        size="medium"
      >
        {selectedBooking && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Client</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedBooking.customerName || 
                     `${selectedBooking.User?.firstName || ''} ${selectedBooking.User?.lastName || ''}`.trim() ||
                     'Unknown Customer'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Service</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedBooking.serviceName || selectedBooking.Service?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Scheduled Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {moment(selectedBooking.startTime).format("hh:mm A")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Staff</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedBooking.staffName || selectedBooking.Staff?.name || selectedBooking.staff?.name || "N/A"}
                  </p>
                </div>
              </div>
            </div>
  
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center text-blue-800">
                <Timer className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  Service Duration: {selectedBooking.duration || selectedBooking.Service?.duration || 60} minutes
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Service will be marked as in progress after check-in.
              </p>
            </div>
  
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Arrival Time
                </label>
                <input
                  type="time"
                  value={checkinData.arrivalTime}
                  onChange={(e) => setCheckinData({...checkinData, arrivalTime: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Notes
                </label>
                <textarea
                  value={checkinData.notes}
                  onChange={(e) => setCheckinData({...checkinData, notes: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Any notes about the client's arrival or special requirements..."
                />
              </div>
            </div>
  
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCheckinModal(false);
                  setSelectedBooking(null);
                }}
                className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCheckin}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200 flex items-center space-x-2"
              >
                <UserCheck className="w-4 h-4" />
                <span>Check In & Start Service</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    );
  
    const CreateServiceBookingModal = () => (
      <Modal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        title="Create New Service Booking"
        size="large"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service *
              </label>
              <input
                type="text"
                value={newBooking.service}
                onChange={(e) => setNewBooking({...newBooking, service: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Select or search service"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration *
              </label>
              <select
                value={newBooking.duration}
                onChange={(e) => setNewBooking({...newBooking, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select duration</option>
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                value={newBooking.clientName}
                onChange={(e) => setNewBooking({...newBooking, clientName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter client full name"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Email *
              </label>
              <input
                type="email"
                value={newBooking.clientEmail}
                onChange={(e) => setNewBooking({...newBooking, clientEmail: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="client@example.com"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Phone
              </label>
              <input
                type="tel"
                value={newBooking.clientPhone}
                onChange={(e) => setNewBooking({...newBooking, clientPhone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0712345678"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={newBooking.date}
                onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time *
              </label>
              <select
                value={newBooking.time}
                onChange={(e) => setNewBooking({...newBooking, time: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Location *
              </label>
              <select
                value={newBooking.store?.id || ''}
                onChange={(e) => {
                  const selectedStore = stores.find(s => s.id === parseInt(e.target.value));
                  setNewBooking({...newBooking, store: selectedStore});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select store</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Member *
              </label>
              <select
                value={newBooking.staff?.id || ''}
                onChange={(e) => {
                  const selectedStaff = staff.find(s => s.id === parseInt(e.target.value));
                  setNewBooking({...newBooking, staff: selectedStaff});
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select staff member</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>{member.name} - {member.role}</option>
                ))}
              </select>
            </div>
  
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status *
              </label>
              <select
                value={newBooking.paymentStatus}
                onChange={(e) => setNewBooking({...newBooking, paymentStatus: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {paymentStatusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
  
            {newBooking.paymentStatus === 'deposit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Amount *
                </label>
                <input
                  type="number"
                  value={newBooking.depositAmount}
                  onChange={(e) => setNewBooking({...newBooking, depositAmount: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}
  
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={newBooking.notes}
                onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional notes about the service booking..."
              />
            </div>
          </div>
  
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateBooking}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Create Service Booking</span>
            </button>
          </div>
        </div>
      </Modal>
    );
  
    // Loading state
    if (loading) {
      return (
        <Layout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading service bookings...</p>
            </div>
          </div>
        </Layout>
      );
    }
  
    // Error state
    if (error && !bookings.length) {
      return (
        <Layout>
          <div className="flex items-center justify-center h-96">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Error Loading Bookings</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </Layout>
      );
    }
  
    // Main render
    return (
      <Layout
        title="Service Bookings"
        subtitle={`Manage client appointments for professional services - ${bookings.length} total bookings`}
        showSearch={false}
      >
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'today'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <CalendarDays className="w-4 h-4 inline-block mr-2" />
            Today's Bookings ({getTodayStats().total})
          </button>
        </div>
  
        {/* Stats Cards */}
        {activeTab === 'all' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">All service bookings</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confirmed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting check-in</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
  
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently serving</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Timer className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
  
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">Successfully served</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Today's Total</p>
                  <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">{moment().format('MMM DD, YYYY')}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Confirmed</p>
                  <p className="text-2xl font-bold text-blue-600">{todayStats.confirmed}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting check-in</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
  
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-orange-600">{todayStats.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently serving</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Timer className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
  
            <div className="bg-white rounded-xl border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{todayStats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">Done today</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        )}
  
        {/* Search and Filter Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              Search & Filter Bookings
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                Showing {filteredBookings.length} of {bookings.length} bookings
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
  
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
  
            <div className="flex flex-wrap gap-3">
              {activeTab === 'all' && (
                <>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                    placeholder="End date"
                  />
                </>
              )}
  
              <select
                value={filters.store}
                onChange={(e) => setFilters(prev => ({ ...prev, store: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
  
              <select
                value={filters.staff}
                onChange={(e) => setFilters(prev => ({ ...prev, staff: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Staff</option>
                {staff.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
  
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
  
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                New Service Booking
              </button>
            </div>
          </div>
        </div>
  
        {/* Service Bookings Table */}
        {filteredBookings.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('client')}
                        className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                      >
                        Client
                        {sortBy === 'client' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Service & Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-1 hover:text-gray-800 transition-colors"
                      >
                        Date & Time
                        {sortBy === 'date' && (
                          sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Location & Staff
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status & Payment
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                              {getInitials(booking.User?.firstName, booking.User?.lastName)}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.customerName || 
                               `${booking.User?.firstName || 'Unknown'} ${booking.User?.lastName || 'User'}`.trim()}
                            </div>
                            <div className="text-sm text-gray-500">{booking.User?.email}</div>
                            {(booking.User?.phoneNumber || booking.User?.phone) && (
                              <div className="text-sm text-gray-500">{booking.User?.phoneNumber || booking.User?.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.serviceName || booking.Service?.name || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Duration: {booking.duration || booking.Service?.duration || "60"} minutes
                          </div>
                          <div className="flex items-center">
                            {getPaymentStatusIcon(booking.paymentStatus)}
                            <span className="text-sm text-gray-600 ml-2">
                              {paymentStatusOptions.find(p => p.value === booking.paymentStatus)?.label || 'Not Paid'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-900">
                              {moment(booking.startTime).format("MMM DD, YYYY")}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              {moment(booking.startTime).format("hh:mm A")}
                            </span>
                          </div>
                          {booking.serviceStartedAt && (
                            <div className="text-xs text-green-600">
                              Started: {moment(booking.serviceStartedAt).format("hh:mm A")}
                            </div>
                          )}
                          {booking.status?.toLowerCase() === 'in_progress' && booking.serviceEndTime && (
                            <div className="text-xs text-orange-600">
                              Ends: {moment(booking.serviceEndTime).format("hh:mm A")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {booking.storeName || booking.store?.name || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              {booking.staffName || booking.Staff?.name || booking.staff?.name || "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status || "Pending"}
                          </span>
                          <div className="text-xs text-gray-500">
                            ID: {String(booking.id).padStart(6, '0')}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(dropdownOpen === booking.id ? null : booking.id)}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {dropdownOpen === booking.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setDropdownOpen(null)}
                              />
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-20 border border-gray-100 py-2">
                                <button
                                  onClick={() => handleViewDetails(booking)}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                >
                                  <Settings className="w-4 h-4 mr-3" />
                                  View Details
                                </button>
                                
                                {booking.status?.toLowerCase() === 'confirmed' && (
                                  <button
                                    onClick={() => {
                                      setSelectedBooking(booking);
                                      setShowCheckinModal(true);
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors"
                                  >
                                    <UserCheck className="w-4 h-4 mr-3" />
                                    Check-in Client
                                  </button>
                                )}
  
                                {booking.status?.toLowerCase() === 'pending' && (
                                  <button
                                    onClick={() => {
                                      handleStatusUpdate(booking.id, 'confirmed', 'Confirmed by merchant');
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 w-full text-left transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-3" />
                                    Confirm Booking
                                  </button>
                                )}
  
                                {booking.status?.toLowerCase() === 'in_progress' && (
                                  <button
                                    onClick={() => {
                                      handleStatusUpdate(booking.id, 'completed', 'Service completed');
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 w-full text-left transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-3" />
                                    Complete Service
                                  </button>
                                )}
                                
                                <div className="border-t border-gray-100 my-1" />
                                
                                <button
                                  onClick={() => {
                                    console.log('Edit booking:', booking.id);
                                    setDropdownOpen(null);
                                  }}
                                  className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                >
                                  <Settings className="w-4 h-4 mr-3" />
                                  Edit Booking
                                </button>
  
                                {!['completed', 'cancelled'].includes(booking.status?.toLowerCase()) && (
                                  <button
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to cancel this booking?')) {
                                        handleStatusUpdate(booking.id, 'cancelled', 'Cancelled by merchant');
                                      }
                                      setDropdownOpen(null);
                                    }}
                                    className="flex items-center px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 w-full text-left transition-colors"
                                  >
                                    <XCircle className="w-4 h-4 mr-3" />
                                    Cancel Booking
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Settings className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {activeTab === 'today' ? 'No Bookings Today' : 'No Service Bookings Found'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'No service bookings match your current search or filters. Try adjusting your criteria.'
                  : activeTab === 'today'
                  ? 'No service bookings scheduled for today. Check back later or create a new booking.'
                  : 'Get started by creating your first service booking to manage client appointments.'
                }
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Create Your First Service Booking
              </button>
            </div>
          </div>
        )}
  
        {/* Modals */}
        <BookingDetailsModal />
        <CheckinModal />
        <CreateServiceBookingModal />
      </Layout>
    );
  };
  
  export default ServiceBookings;// ServiceBookings.js - Clean, well-structured version using bookingApiService