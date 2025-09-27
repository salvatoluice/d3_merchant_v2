import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  ArrowLeft, 
  Mail, 
  Phone, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  Edit,
  Timer,
  UserCheck,
  File,
  MessageSquare,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
  Printer,
  Send
} from "lucide-react";
import Layout from "../../elements/Layout";
import { fetchBookingById } from "../../services/api_service";
import moment from "moment";

const BookingView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [checkinData, setCheckinData] = useState({
    arrivalTime: new Date().toTimeString().slice(0, 5),
    notes: ''
  });
  
  // Mock service history data (would be fetched from API in a real app)
  const serviceHistory = [
    {
      id: 1,
      date: moment().subtract(2, 'months').format('YYYY-MM-DD'),
      service: "Premium Consultation",
      staff: "Sarah Johnson",
      status: "Completed",
      paymentStatus: "complete",
      amount: 120.00
    },
    {
      id: 2,
      date: moment().subtract(1, 'months').format('YYYY-MM-DD'),
      service: "Standard Service",
      staff: "Mike Rodriguez",
      status: "Completed",
      paymentStatus: "complete",
      amount: 85.00
    }
  ];

  const paymentStatusOptions = [
    { value: 'not_paid', label: 'Not Paid', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4 text-red-600" /> },
    { value: 'deposit', label: 'Deposit Paid', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4 text-yellow-600" /> },
    { value: 'complete', label: 'Fully Paid', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4 text-green-600" /> }
  ];

  useEffect(() => {
    const loadBookingDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real app, this would fetch from API
        // Mocking the API response for demonstration
        const response = await fetchBookingById(id);
        setBooking(response || createMockBooking());
      } catch (error) {
        setError(error.message || "Failed to fetch booking details");
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetails();
  }, [id]);

  // Mock function to create a booking for demo purposes
  const createMockBooking = () => {
    const startTime = moment().add(2, 'days').set('hour', 14).set('minute', 0);
    
    return {
      id: parseInt(id),
      User: {
        firstName: "Jennifer",
        lastName: "Thompson",
        email: "jennifer.t@example.com",
        phone: "0712345678"
      },
      service: "Premium Consultation",
      duration: "60",
      startTime: startTime.format(),
      endTime: startTime.add(60, 'minutes').format(),
      status: "Confirmed",
      paymentStatus: "deposit",
      depositAmount: "30.00",
      totalAmount: "120.00",
      notes: "Client has requested extra time for questions at the end of the session. Prefers detailed explanations and has expressed interest in our premium packages.",
      store: {
        id: 1,
        name: "Downtown Branch",
        address: "123 Main St, City Center",
        phone: "0712345678"
      },
      staff: {
        id: 1,
        name: "Sarah Johnson",
        role: "Senior Specialist",
        rating: 4.9
      },
      createdAt: moment().subtract(3, 'days').format(),
      history: [
        {
          action: "Booking Created",
          timestamp: moment().subtract(3, 'days').format(),
          user: "Admin User"
        },
        {
          action: "Deposit Payment Received",
          timestamp: moment().subtract(2, 'days').format(),
          user: "System"
        },
        {
          action: "Booking Confirmed",
          timestamp: moment().subtract(2, 'days').format(),
          user: "Sarah Johnson"
        }
      ]
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'In Progress':
        return 'bg-orange-100 text-orange-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusDetails = (status) => {
    return paymentStatusOptions.find(option => option.value === status) || paymentStatusOptions[0];
  };

  const handleCheckin = async () => {
    try {
      if (!booking) return;

      const now = new Date();
      const serviceDuration = parseInt(booking.duration) || 60;
      const serviceEndTime = new Date(now.getTime() + serviceDuration * 60000);

      const updatedBooking = {
        ...booking,
        status: 'In Progress',
        checkedInAt: now.toISOString(),
        serviceStartedAt: now.toISOString(),
        serviceEndTime: serviceEndTime.toISOString(),
        actualArrivalTime: checkinData.arrivalTime,
        checkinNotes: checkinData.notes,
        history: [
          ...booking.history,
          {
            action: "Client Checked In",
            timestamp: now.toISOString(),
            user: "Current User"
          }
        ]
      };

      setBooking(updatedBooking);
      
      // In a real app, you would update this on the server
      
      setCheckinData({
        arrivalTime: new Date().toTimeString().slice(0, 5),
        notes: ''
      });
      
      setShowCheckinModal(false);
      toast.success(`Client checked in successfully! Service will complete automatically in ${serviceDuration} minutes.`);
      
      // Simulate service completion after duration
      // In a real app, this would be handled by the server
      setTimeout(() => {
        setBooking(prev => ({
          ...prev,
          status: 'Completed',
          completedAt: new Date().toISOString(),
          history: [
            ...prev.history,
            {
              action: "Service Completed",
              timestamp: new Date().toISOString(),
              user: "System"
            }
          ]
        }));
        toast.success(`Service completed for ${booking.User?.firstName} ${booking.User?.lastName}`);
      }, 5000); // Just 5 seconds for demo purposes
      
    } catch (error) {
      toast.error("Failed to check in client");
    }
  };

  const handleCancelBooking = () => {
    if (!booking) return;
    
    const updatedBooking = {
      ...booking,
      status: 'Cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason,
      history: [
        ...booking.history,
        {
          action: "Booking Cancelled",
          timestamp: new Date().toISOString(),
          user: "Current User",
          notes: cancellationReason
        }
      ]
    };

    setBooking(updatedBooking);
    setShowCancelModal(false);
    setCancellationReason('');
    toast.success("Booking has been cancelled");
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const CheckinModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserCheck className="w-6 h-6 mr-2 text-green-600" />
              Check-in Client
            </h2>
            <button
              onClick={() => setShowCheckinModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>

          {booking && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Client</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.User?.firstName} {booking.User?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Service</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.Service?.name || booking.service || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Scheduled Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {moment(booking.startTime).format("hh:mm A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Staff</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {booking.staff?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center text-blue-800">
                  <Timer className="w-5 h-5 mr-2" />
                  <span className="font-medium">Service Duration: {booking.duration || 60} minutes</span>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Service will automatically complete {booking.duration || 60} minutes after check-in.
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

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowCheckinModal(false)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );

  const CancelBookingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
              Cancel Booking
            </h2>
            <button
              onClick={() => setShowCancelModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-gray-900">
                {booking?.service || "Service"} - {moment(booking?.startTime).format("MMM DD, YYYY [at] hh:mm A")}
              </p>
              <p className="text-gray-600">
                Client: {booking?.User?.firstName} {booking?.User?.lastName}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cancellation Reason
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Enter reason for cancellation..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <button
              onClick={() => setShowCancelModal(false)}
              className="px-5 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-200"
            >
              Go Back
            </button>
            <button
              onClick={handleCancelBooking}
              className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !booking) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Error Loading Booking</h3>
            <p className="text-gray-600 mb-6">{error || "Booking not found"}</p>
            <button 
              onClick={() => navigate("/dashboard/bookings")}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2 inline-block" />
              Back to Bookings
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Booking Details"
      subtitle={`View and manage the details for booking #${String(booking.id).padStart(6, '0')}`}
    >
      {/* Back Button */}
      <button
        onClick={() => navigate("/dashboard/bookings")}
        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        <span>Back to All Bookings</span>
      </button>

      {/* Status Banner */}
      <div className={`w-full rounded-lg p-4 mb-8 flex items-center justify-between ${
        booking.status === 'Cancelled' ? 'bg-red-50 border border-red-100' :
        booking.status === 'Completed' ? 'bg-green-50 border border-green-100' :
        booking.status === 'In Progress' ? 'bg-orange-50 border border-orange-100' :
        'bg-blue-50 border border-blue-100'
      }`}>
        <div className="flex items-center">
          <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full mr-3 ${getStatusColor(booking.status)}`}>
            {booking.status}
          </span>
          <p className={`text-${
            booking.status === 'Cancelled' ? 'red' :
            booking.status === 'Completed' ? 'green' :
            booking.status === 'In Progress' ? 'orange' :
            'blue'
          }-700`}>
            {booking.status === 'Cancelled' && 'This booking has been cancelled'}
            {booking.status === 'Completed' && 'This service has been completed'}
            {booking.status === 'In Progress' && 'This service is currently in progress'}
            {booking.status === 'Confirmed' && 'This booking is confirmed and scheduled'}
            {booking.status === 'Pending' && 'This booking is pending confirmation'}
          </p>
        </div>
        <div className="flex items-center">
          {booking.status === 'Confirmed' && (
            <button
              onClick={() => setShowCheckinModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center mr-2"
            >
              <UserCheck className="w-4 h-4 mr-2" />
              Check-in Client
            </button>
          )}
          {['Confirmed', 'Pending'].includes(booking.status) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel
            </button>
          )}
          {booking.status === 'Completed' && (
            <button
              onClick={() => toast.success("Email receipt sent to client!")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center mr-2"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Receipt
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* Client Information */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Client Information
          </h3>
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 h-16 w-16">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-medium">
                {getInitials(booking.User?.firstName, booking.User?.lastName)}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-xl font-medium text-gray-900">
                {booking.User?.firstName || "Unknown"} {booking.User?.lastName || "User"}
              </div>
              <div className="text-sm text-gray-500">Client ID: {String(booking.User?.id || 'N/A').padStart(4, '0')}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">{booking.User?.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Phone</p>
                <p className="text-gray-900">{booking.User?.phone || "N/A"}</p>
              </div>
            </div>
            {serviceHistory.length > 0 && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowHistorySection(!showHistorySection)}
                  className="flex items-center justify-between w-full text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <span>View Service History ({serviceHistory.length})</span>
                  {showHistorySection ? 
                    <ChevronUp className="w-4 h-4" /> : 
                    <ChevronDown className="w-4 h-4" />
                  }
                </button>
                
                {showHistorySection && (
                  <div className="mt-4 space-y-3">
                    {serviceHistory.map(service => (
                      <div key={service.id} className="bg-gray-50 p-3 rounded-lg text-sm">
                        <div className="font-medium text-gray-900">
                          {service.service} - {moment(service.date).format("MMM DD, YYYY")}
                        </div>
                        <div className="text-gray-600">Staff: {service.staff}</div>
                        <div className="flex justify-between mt-1">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                            {service.status}
                          </span>
                          <span className="font-medium">${service.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Service Details
          </h3>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Service Type</p>
              <p className="text-xl font-medium text-gray-900">{booking.Service?.name || booking.service || "N/A"}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Duration</p>
                <p className="text-gray-900 flex items-center">
                  <Timer className="w-4 h-4 text-gray-400 mr-2" />
                  {booking.duration || "60"} minutes
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Booking ID</p>
                <p className="text-gray-900">{String(booking.id).padStart(6, '0')}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">Staff Member</p>
                <span className="text-xs text-yellow-600 flex items-center">
                  ★ {booking.staff?.rating || "4.8"}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                  {booking.staff?.name?.charAt(0) || "S"}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{booking.staff?.name || "Not Assigned"}</p>
                  <p className="text-sm text-gray-600">{booking.staff?.role || "Staff Member"}</p>
                </div>
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
              {booking.notes ? (
                <>
                  <p className="text-gray-700 text-sm">
                    {showNotes ? booking.notes : `${booking.notes.substring(0, 100)}${booking.notes.length > 100 ? '...' : ''}`}
                  </p>
                  {booking.notes.length > 100 && (
                    <button
                      onClick={() => setShowNotes(!showNotes)}
                      className="text-sm text-blue-600 mt-1 hover:text-blue-800"
                    >
                      {showNotes ? "Show Less" : "Read More"}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-gray-500 text-sm italic">No notes available</p>
              )}
            </div>
            
            {booking.checkinNotes && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Check-in Notes</p>
                <p className="text-sm text-green-700">{booking.checkinNotes}</p>
              </div>
            )}
            
            {booking.status === 'Cancelled' && booking.cancellationReason && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-red-800 mb-1">Cancellation Reason</p>
                <p className="text-sm text-red-700">{booking.cancellationReason}</p>
              </div>
            )}
          </div>
        </div>

        {/* Time and Location */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            Time & Location
          </h3>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Date & Time</p>
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                <p className="text-lg font-medium text-gray-900">
                  {moment(booking.startTime).format("ddd, MMM DD, YYYY")}
                </p>
              </div>
              <div className="flex items-center mt-1 ml-7">
                <p className="text-gray-700">
                  {moment(booking.startTime).format("hh:mm A")} - {moment(booking.endTime).format("hh:mm A")}
                </p>
              </div>
            </div>
            
            {booking.status === 'In Progress' && (
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-orange-800">Service in Progress</p>
                  <Timer className="w-4 h-4 text-orange-600" />
                </div>
                <div className="mt-1 space-y-1 text-sm">
                  <p className="text-orange-700">
                    Started: {moment(booking.serviceStartedAt).format("hh:mm A")}
                  </p>
                  <p className="text-orange-700">
                    Expected End: {moment(booking.serviceEndTime).format("hh:mm A")}
                  </p>
                </div>
              </div>
            )}
            
            {booking.status === 'Completed' && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-green-800">Service Completed</p>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="mt-1 text-sm text-green-700">
                  Completed at: {moment(booking.completedAt).format("hh:mm A on MMM DD, YYYY")}
                </p>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-600 mb-2">Location</p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{booking.store?.name || "Unknown Location"}</p>
                    <p className="text-sm text-gray-600 mt-1">{booking.store?.address || "Address not available"}</p>
                    {booking.store?.phone && (
                      <p className="text-sm text-gray-600 mt-1">Tel: {booking.store?.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowPaymentSection(!showPaymentSection)}
                className="flex items-center justify-between w-full text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <span>Payment Details</span>
                {showPaymentSection ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
                }
              </button>
              
              {showPaymentSection && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getPaymentStatusDetails(booking.paymentStatus).icon}
                      <span className="ml-2 text-gray-700">
                        {getPaymentStatusDetails(booking.paymentStatus).label}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPaymentStatusDetails(booking.paymentStatus).color}`}>
                      {booking.paymentStatus === 'complete' ? 'Paid' : booking.paymentStatus === 'deposit' ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Amount</span>
                      <span className="font-medium text-gray-900">${booking.totalAmount || "0.00"}</span>
                    </div>
                    
                    {booking.paymentStatus === 'deposit' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Deposit Paid</span>
                          <span className="font-medium text-green-600">- ${booking.depositAmount || "0.00"}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-2 flex justify-between">
                          <span className="font-medium text-gray-700">Balance Due</span>
                          <span className="font-medium text-gray-900">
                            ${(parseFloat(booking.totalAmount || 0) - parseFloat(booking.depositAmount || 0)).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    
                    {booking.paymentStatus === 'complete' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Paid in Full</span>
                        <span className="font-medium text-green-600">${booking.totalAmount || "0.00"}</span>
                      </div>
                    )}
                  </div>
                  
                  {booking.status !== 'Cancelled' && booking.paymentStatus !== 'complete' && (
                    <button
                      onClick={() => toast.success("Payment form would open here")}
                      className="w-full mt-2 flex items-center justify-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {booking.paymentStatus === 'deposit' ? 'Collect Remaining Balance' : 'Process Payment'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Booking Activity History */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <File className="w-5 h-5 mr-2 text-blue-600" />
          Booking History
        </h3>
        
        <div className="space-y-6">
          {booking.history.map((event, index) => (
            <div key={index} className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  {event.action.includes('Created') && <Settings className="w-4 h-4" />}
                  {event.action.includes('Payment') && <DollarSign className="w-4 h-4" />}
                  {event.action.includes('Confirmed') && <CheckCircle className="w-4 h-4" />}
                  {event.action.includes('Checked In') && <UserCheck className="w-4 h-4" />}
                  {event.action.includes('Completed') && <CheckCircle className="w-4 h-4" />}
                  {event.action.includes('Cancelled') && <Trash2 className="w-4 h-4" />}
                  {!event.action.includes('Created') && 
                   !event.action.includes('Payment') &&
                   !event.action.includes('Confirmed') &&
                   !event.action.includes('Checked In') &&
                   !event.action.includes('Completed') &&
                   !event.action.includes('Cancelled') && 
                   <MessageSquare className="w-4 h-4" />}
                </div>
                {index !== booking.history.length - 1 && (
                  <div className="w-0.5 bg-gray-200 h-full mt-2"></div>
                )}
              </div>
              <div className="pb-6">
                <div className="flex items-center">
                  <p className="font-medium text-gray-900">{event.action}</p>
                  <span className="text-xs text-gray-500 ml-2">
                    {moment(event.timestamp).format("MMM DD, YYYY [at] hh:mm A")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">By: {event.user}</p>
                {event.notes && (
                  <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded-lg">{event.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-between mb-8">
        <div className="space-x-4">
          <button
            onClick={() => navigate(`/dashboard/bookings/${booking.id}/edit`)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Booking
          </button>
          
          <button
            onClick={() => toast.success("Printable version opened in a new tab!")}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Details
          </button>
        </div>
        
        {booking.status === 'Confirmed' && (
          <button
            onClick={() => setShowCheckinModal(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Check-in Client
          </button>
        )}
      </div>
      
      {/* Modals */}
      {showCheckinModal && <CheckinModal />}
      {showCancelModal && <CancelBookingModal />}
    </Layout>
  );
};

export default BookingView;