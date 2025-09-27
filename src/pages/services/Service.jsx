import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Layout from '../../elements/Layout';
import Modal from '../../elements/Modal';
import { fetchServices } from '../../services/api_service';
import ServiceForm from './ServiceForm';
import { useNavigate } from 'react-router-dom';
import {
    Eye,
    Edit,
    Trash2,
    Clock,
    DollarSign,
    Plus,
    AlertCircle,
    RefreshCw,
    Calculator,
    Image as ImageIcon,
    X,
    ChevronLeft,
    ChevronRight,
    Users,
    MapPin,
    Tag,
    Calendar,
    CheckCircle,
    Star,
    Settings,
    Search,
    Filter,
    Shield,
    UserCheck,
    CreditCard,
    MessageSquare,
    Timer,
    Bell,
    Info
} from 'lucide-react';

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [isViewModalOpen, setViewModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const navigate = useNavigate();

    const loadServices = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('Fetching services...');

            const response = await fetchServices();
            console.log('Services response:', response);

            const servicesData = response?.services || response?.data || response || [];
            setServices(Array.isArray(servicesData) ? servicesData : []);

        } catch (error) {
            console.error('Failed to fetch services:', error);
            setError(error.message || 'Failed to fetch services');
            toast.error(error.message || 'Failed to fetch services');
            setServices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, []);

    const refreshServices = async () => {
        await loadServices();
    };

    const handleViewService = (service) => {
        setSelectedService(service);
        setCurrentImageIndex(0);
        setViewModalOpen(true);
    };

    const handleEditService = (service) => {
        setSelectedService(service);
        setViewModalOpen(false);
        setEditModalOpen(true);
    };

    const handleDeleteService = async (service) => {
        if (window.confirm(`Are you sure you want to delete "${service.name}"?`)) {
            try {
                toast.success('Service deleted successfully');
                refreshServices();
            } catch (error) {
                toast.error('Failed to delete service');
            }
        }
    };

    // Filter services based on search and filter
    const filteredServices = services.filter(service => {
        const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.category?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter = filterType === 'all' || service.type === filterType;

        return matchesSearch && matchesFilter;
    });

    // Enhanced Service Details Modal Component
    const ServiceDetailsModal = () => {
        if (!selectedService) return null;

        const getAllImages = (service) => {
            let allImages = [];

            if (service.images && Array.isArray(service.images)) {
                allImages = service.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
            }

            if (allImages.length === 0 && service.image_url && service.image_url.trim() !== '') {
                allImages = [service.image_url];
            }

            return allImages;
        };

        const images = getAllImages(selectedService);
        const hasMultipleImages = images.length > 1;

        const nextImage = () => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        };

        const prevImage = () => {
            setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
        };

        return (
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedService(null);
                    setCurrentImageIndex(0);
                }}
                title=""
                size="large"
            >
                <div className="max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{selectedService.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${selectedService.type === 'fixed'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {selectedService.type === 'fixed' ? (
                                        <>
                                            <DollarSign className="w-4 h-4" />
                                            Fixed Price
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="w-4 h-4" />
                                            Dynamic Price
                                        </>
                                    )}
                                </span>
                                {selectedService.featured && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                        <Star className="w-4 h-4" />
                                        Featured
                                    </span>
                                )}
                                {selectedService.auto_confirm_bookings && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                        <CheckCircle className="w-4 h-4" />
                                        Auto-Confirm
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Image Gallery */}
                    <div className="relative mb-6">
                        <div className="relative w-full h-64 bg-gray-50 rounded-xl overflow-hidden">
                            {images.length > 0 ? (
                                <>
                                    <img
                                        src={images[currentImageIndex]}
                                        alt={`${selectedService.name} - Image ${currentImageIndex + 1}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNEMUQ1RDkiLz4KPHBhdGggZD0iTTEzNSA5MEgxNjVWMTEwSDEzNVY5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgRXJyb3I8L3RleHQ+Cjwvc3ZnPg==';
                                        }}
                                    />

                                    {hasMultipleImages && (
                                        <>
                                            <button
                                                onClick={prevImage}
                                                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={nextImage}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 p-2 rounded-full shadow-lg transition-all"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>

                                            <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white text-sm px-3 py-1 rounded-full">
                                                {currentImageIndex + 1} / {images.length}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500">No images available</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Service Information */}
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>

                            {selectedService.description && (
                                <p className="text-gray-600 mb-4 leading-relaxed">{selectedService.description}</p>
                            )}

                            {selectedService.category && (
                                <div className="inline-flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                                    <Tag className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm text-gray-700 font-medium">{selectedService.category}</span>
                                </div>
                            )}
                        </div>

                        {/* Pricing Information */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                                Pricing Information
                            </h3>

                            {selectedService.type === 'fixed' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">Price</p>
                                        <p className="text-xl font-bold text-blue-600">KES {selectedService.price}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">Duration</p>
                                        <p className="text-xl font-bold text-gray-900 flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            {selectedService.duration}m
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600 mb-1">Estimated Price Range</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {selectedService.price_range || 'Contact for pricing'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* NEW: Booking Confirmation Settings */}
                        <div className="bg-white p-6 rounded-xl border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-600" />
                                Booking Settings
                            </h3>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${selectedService.auto_confirm_bookings ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                        {selectedService.auto_confirm_bookings ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Bell className="w-4 h-4 text-yellow-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedService.auto_confirm_bookings ? 'Auto-Confirm' : 'Manual Confirm'}
                                        </p>
                                        <p className="text-xs text-gray-500">Booking confirmation</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${selectedService.require_prepayment ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                        <CreditCard className={`w-4 h-4 ${selectedService.require_prepayment ? 'text-blue-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {selectedService.require_prepayment ? 'Prepayment Required' : 'No Prepayment'}
                                        </p>
                                        <p className="text-xs text-gray-500">Payment requirement</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${selectedService.allow_early_checkin ? 'bg-green-100' : 'bg-gray-100'}`}>
                                        <UserCheck className={`w-4 h-4 ${selectedService.allow_early_checkin ? 'text-green-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Early Check-in
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selectedService.allow_early_checkin 
                                                ? `Up to ${selectedService.early_checkin_minutes || 15} min early`
                                                : 'Not allowed'
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${selectedService.auto_complete_on_duration ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                        <Timer className={`w-4 h-4 ${selectedService.auto_complete_on_duration ? 'text-purple-600' : 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Auto-Complete
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {selectedService.auto_complete_on_duration 
                                                ? 'After service duration'
                                                : 'Manual completion'
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedService.confirmation_message && (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-blue-900">Confirmation Message</p>
                                            <p className="text-sm text-blue-700 mt-1">{selectedService.confirmation_message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedService.cancellation_policy && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mt-3">
                                    <div className="flex items-start gap-2">
                                        <Info className="w-4 h-4 text-orange-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-orange-900">Cancellation Policy</p>
                                            <p className="text-sm text-orange-700 mt-1">{selectedService.cancellation_policy}</p>
                                            <p className="text-xs text-orange-600 mt-2">
                                                Minimum {selectedService.min_cancellation_hours || 2} hours notice required
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Staff Assignment */}
                        {selectedService.staff && selectedService.staff.length > 0 && (
                            <div className="bg-white p-6 rounded-xl border border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-green-600" />
                                    Assigned Staff ({selectedService.staff.length})
                                </h3>
                                <div className="space-y-3">
                                    {selectedService.staff.map((staff) => (
                                        <div key={staff.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                                {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">{staff.name}</p>
                                                <p className="text-sm text-gray-500">{staff.email}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${staff.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {staff.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => {
                                    setViewModalOpen(false);
                                    handleEditService(selectedService);
                                }}
                                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Service
                            </button>

                            {selectedService.type === 'dynamic' && (
                                <button
                                    onClick={() => {
                                        setViewModalOpen(false);
                                        navigate(`/dashboard/dynamic-form/${selectedService.id}`);
                                    }}
                                    className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Settings className="w-4 h-4" />
                                    Manage Form
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>
        );
    };

    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-gray-50 rounded-2xl p-8 mb-6">
                <Plus className="w-16 h-16 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Services Yet
            </h3>
            <p className="text-gray-600 text-center mb-8 max-w-md">
                Start by adding your first service to showcase what you offer to your customers.
            </p>
            <button
                onClick={() => setModalOpen(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Add Your First Service
            </button>
        </div>
    );

    const ErrorState = () => (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-red-50 rounded-2xl p-8 mb-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to Load Services
            </h3>
            <p className="text-gray-600 text-center mb-8 max-w-md">
                {error}
            </p>
            <button
                onClick={refreshServices}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                <RefreshCw className="w-5 h-5" />
                Try Again
            </button>
        </div>
    );

    const LoadingState = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                    <div className="w-full h-48 bg-gray-200"></div>
                    <div className="p-6">
                        <div className="h-6 bg-gray-200 rounded mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const ServiceCard = ({ service }) => {
        const getPrimaryImage = (service) => {
            if (service.images && Array.isArray(service.images) && service.images.length > 0) {
                const validImages = service.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
                if (validImages.length > 0) {
                    return validImages[0];
                }
            }

            if (service.image_url && service.image_url.trim() !== '') {
                return service.image_url;
            }

            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjEwMCIgcj0iMzAiIGZpbGw9IiNEMUQ1RDkiLz4KPHBhdGggZD0iTTEzNSA5MEgxNjVWMTEwSDEzNVY5MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHRleHQgeD0iMTUwIiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+U2VydmljZSBJbWFnZTwvdGV4dD4KPC9zdmc+';
        };

        const getAllImages = (service) => {
            let allImages = [];

            if (service.images && Array.isArray(service.images)) {
                allImages = service.images.filter(img => img && typeof img === 'string' && img.trim() !== '');
            }

            if (allImages.length === 0 && service.image_url && service.image_url.trim() !== '') {
                allImages = [service.image_url];
            }

            return allImages;
        };

        const primaryImage = getPrimaryImage(service);
        const allImages = getAllImages(service);

        return (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group">
                <div className="relative">
                    <img
                        src={primaryImage}
                        alt={service.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMzAgOTBIMTcwVjExMEgxMzBWOTBaIiBmaWxsPSIjRDFENUQ5Ii8+CjxwYXRoIGQ9Ik0xNDAgMTAwSDE2MFYxMjBIMTQwVjEwMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                        }}
                    />

                    <div className="absolute top-3 left-3 flex gap-2">
                        {allImages.length > 1 && (
                            <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                {allImages.length}
                            </span>
                        )}
                        {service.featured && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Featured
                            </span>
                        )}
                    </div>

                    <div className="absolute top-3 right-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${service.type === 'fixed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                            }`}>
                            {service.type === 'fixed' ? (
                                <>
                                    <DollarSign className="w-3 h-3" />
                                    Fixed
                                </>
                            ) : (
                                <>
                                    <Calculator className="w-3 h-3" />
                                    Dynamic
                                </>
                            )}
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                        {service.name}
                    </h3>

                    {service.type === 'fixed' && (
                        <div className="flex items-center gap-4 mb-3">
                            <div className="flex items-center text-blue-600">
                                <DollarSign className="w-4 h-4 mr-1" />
                                <span className="font-semibold">KES {service.price}</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                                <Clock className="w-4 h-4 mr-1" />
                                <span className="text-sm">{service.duration}m</span>
                            </div>
                        </div>
                    )}

                    {service.type === 'dynamic' && service.price_range && (
                        <div className="mb-3">
                            <div className="flex items-center text-blue-600">
                                <Calculator className="w-4 h-4 mr-1" />
                                <span className="font-semibold">{service.price_range}</span>
                            </div>
                        </div>
                    )}

                    {service.category && (
                        <div className="mb-3">
                            <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                                {service.category}
                            </span>
                        </div>
                    )}

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {service.description || 'No description available'}
                    </p>

                    {/* NEW: Booking Settings Preview */}
                    <div className="flex flex-wrap gap-1 mb-4">
                        {service.auto_confirm_bookings && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Auto-Confirm
                            </span>
                        )}
                        {service.require_prepayment && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                <CreditCard className="w-3 h-3" />
                                Prepay
                            </span>
                        )}
                        {service.allow_early_checkin && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full">
                                <UserCheck className="w-3 h-3" />
                                Early Check-in
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleViewService(service)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            View
                        </button>

                        <button
                            onClick={() => handleEditService(service)}
                            className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors"
                        >
                            <Edit className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => handleDeleteService(service)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {service.staff && service.staff.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500 mb-2">Assigned Staff:</p>
                            <div className="flex gap-1">
                                {service.staff.slice(0, 2).map((staff) => (
                                    <span
                                        key={staff.id}
                                        className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
                                    >
                                        {staff.name}
                                    </span>
                                ))}
                                {service.staff.length > 2 && (
                                    <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">
                                        +{service.staff.length - 2}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Layout
            title="Services"
            subtitle={`Manage your service offerings (${services.length} total)`}
            showSearch={false}
            rightContent={
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Service
                </button>
            }
        >
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search services..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="appearance-none pl-10 pr-8 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
                        >
                            <option value="all">All Services</option>
                            <option value="fixed">Fixed Price</option>
                            <option value="dynamic">Dynamic Price</option>
                        </select>
                    </div>
                    <button
                        onClick={refreshServices}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2.5 rounded-lg transition-colors"
                        title="Refresh Services"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Filter Statistics */}
                {!loading && !error && services.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{services.filter(s => s.auto_confirm_bookings).length}</span> auto-confirm services
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{services.filter(s => s.require_prepayment).length}</span> require prepayment
                        </div>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">{services.filter(s => s.featured).length}</span> featured services
                        </div>
                    </div>
                )}
            </div>

            {/* Results Summary */}
            {!loading && !error && (
                <div className="mb-6">
                    <p className="text-gray-600">
                        {filteredServices.length === services.length
                            ? `Showing all ${services.length} services`
                            : `Showing ${filteredServices.length} of ${services.length} services`
                        }
                        {searchTerm && ` matching "${searchTerm}"`}
                        {filterType !== 'all' && ` with ${filterType} pricing`}
                    </p>
                </div>
            )}

            {/* Main Content */}
            {loading ? (
                <LoadingState />
            ) : error ? (
                <ErrorState />
            ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredServices.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                    ))}
                </div>
            ) : services.length > 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                    <div className="bg-gray-50 rounded-2xl p-8 mb-6">
                        <Search className="w-16 h-16 text-gray-400 mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No Services Found
                    </h3>
                    <p className="text-gray-600 text-center mb-6 max-w-md">
                        No services match your current search or filter criteria.
                    </p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterType('all');
                        }}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <EmptyState />
            )}

            {/* Modals */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                title=""
                size="landscape"
            >
                <ServiceForm
                    onClose={() => setModalOpen(false)}
                    onServiceAdded={refreshServices}
                />
            </Modal>

            <ServiceDetailsModal />

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setSelectedService(null);
                }}
                title=""
                size="landscape"
            >
                <ServiceForm
                    onClose={() => {
                        setEditModalOpen(false);
                        setSelectedService(null);
                    }}
                    onServiceAdded={() => {
                        refreshServices();
                        setEditModalOpen(false);
                        setSelectedService(null);
                    }}
                    editingService={selectedService}
                />
            </Modal>
        </Layout>
    );
};

export default ServicesPage;