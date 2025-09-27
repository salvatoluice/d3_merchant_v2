import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createService, uploadImage, getMerchantStores, fetchStaff, updateService } from '../../services/api_service';
import merchantAuthService from '../../services/merchantAuthService';
import branchService from '../../services/branchService';
import {
    Upload, Image, AlertCircle, CheckCircle, Loader, Users, UserCheck, MapPin, Building,
    Clock, Info, X, Plus, DollarSign, Calculator, HelpCircle, Eye, Trash2, Settings,
    Shield, Calendar, Timer, UserX, CreditCard, MessageSquare
} from 'lucide-react';

const EnhancedServiceForm = ({ onClose, onServiceAdded, editingService = null }) => {
    const [serviceData, setServiceData] = useState({
        name: '',
        price: '',
        duration: '',
        images: [],
        category: '',
        description: '',
        type: 'fixed',
        store_id: '',
        branch_id: '',
        staffIds: [],
        // Dynamic service fields
        pricing_factors: [],
        price_range: '',
        consultation_required: false,
        // Booking capacity fields
        max_concurrent_bookings: 1,
        allow_overbooking: false,
        slot_interval: '',
        buffer_time: 0,
        min_advance_booking: 30,
        max_advance_booking: 10080,
        // NEW: Booking confirmation settings
        auto_confirm_bookings: true,
        confirmation_message: '',
        require_prepayment: false,
        cancellation_policy: '',
        min_cancellation_hours: 2,
        // NEW: Check-in and completion settings
        allow_early_checkin: true,
        early_checkin_minutes: 15,
        auto_complete_on_duration: true,
        grace_period_minutes: 10,
        // SEO fields
        tags: [],
        featured: false
    });

    const [loading, setLoading] = useState(false);
    const [imageUploading, setImageUploading] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(null);
    const [imageFiles, setImageFiles] = useState([null, null, null]);
    const [imagePreviews, setImagePreviews] = useState([null, null, null]);
    const [errors, setErrors] = useState({});
    const [storeLoading, setStoreLoading] = useState(true);
    const [branchesLoading, setBranchesLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [availableStaff, setAvailableStaff] = useState([]);
    const [availableBranches, setAvailableBranches] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState([]);
    const [activeTab, setActiveTab] = useState('basic'); // New tab state
    const navigate = useNavigate();

    const CATEGORIES = [
        'Beauty & Wellness', 'Health & Fitness', 'Automotive', 'Home Services',
        'Professional Services', 'Food & Beverage', 'Entertainment', 'Education',
        'Technology', 'Consulting', 'Moving & Transportation', 'Cleaning Services',
        'Repair & Maintenance', 'Other'
    ];

    const PRICING_FACTORS = [
        'Distance', 'Weight/Load', 'Time Duration', 'Complexity', 'Materials Required',
        'Team Size', 'Equipment Needed', 'Location Access', 'Urgency', 'Custom Requirements'
    ];

    // Load merchant's store and set up form
    useEffect(() => {
        const loadStoreData = async () => {
            try {
                setStoreLoading(true);
                const merchant = merchantAuthService.getCurrentMerchant();

                if (!merchant) {
                    toast.error('Please log in to continue');
                    return;
                }

                const storesResponse = await getMerchantStores();
                const stores = storesResponse?.stores || storesResponse || [];

                if (stores.length === 0) {
                    toast.error('Please create a store first before adding services');
                    onClose();
                    return;
                }

                const storeId = stores[0].id;
                setServiceData(prev => ({
                    ...prev,
                    store_id: storeId
                }));

                await loadStoreBranches(storeId);

                // If editing, populate form
                if (editingService) {
                    setServiceData({
                        ...editingService,
                        store_id: editingService.store_id || storeId,
                        branch_id: editingService.branch_id || '',
                        price: editingService.price?.toString() || '',
                        duration: editingService.duration?.toString() || '',
                        staffIds: editingService.staff?.map(staff => staff.id) || [],
                        images: editingService.images || (editingService.image_url ? [editingService.image_url] : []),
                        pricing_factors: editingService.pricing_factors || [],
                        price_range: editingService.price_range || '',
                        consultation_required: editingService.consultation_required || false,
                        max_concurrent_bookings: editingService.max_concurrent_bookings || 1,
                        allow_overbooking: editingService.allow_overbooking || false,
                        slot_interval: editingService.slot_interval?.toString() || '',
                        buffer_time: editingService.buffer_time || 0,
                        min_advance_booking: editingService.min_advance_booking || 30,
                        max_advance_booking: editingService.max_advance_booking || 10080,
                        // NEW: Booking confirmation settings
                        auto_confirm_bookings: editingService.auto_confirm_bookings !== undefined ? editingService.auto_confirm_bookings : true,
                        confirmation_message: editingService.confirmation_message || '',
                        require_prepayment: editingService.require_prepayment || false,
                        cancellation_policy: editingService.cancellation_policy || '',
                        min_cancellation_hours: editingService.min_cancellation_hours || 2,
                        // NEW: Check-in settings
                        allow_early_checkin: editingService.allow_early_checkin !== undefined ? editingService.allow_early_checkin : true,
                        early_checkin_minutes: editingService.early_checkin_minutes || 15,
                        auto_complete_on_duration: editingService.auto_complete_on_duration !== undefined ? editingService.auto_complete_on_duration : true,
                        grace_period_minutes: editingService.grace_period_minutes || 10,
                        tags: editingService.tags || [],
                        featured: editingService.featured || false
                    });

                    // Set image previews
                    const existingImages = editingService.images || (editingService.image_url ? [editingService.image_url] : []);
                    const newPreviews = [null, null, null];
                    existingImages.forEach((img, index) => {
                        if (index < 3) newPreviews[index] = img;
                    });
                    setImagePreviews(newPreviews);

                    if (editingService.staff) {
                        setSelectedStaff(editingService.staff);
                    }

                    if (editingService.branch_id) {
                        await loadBranchStaff(editingService.branch_id);
                    }
                } else {
                    await loadStoreStaff(storeId);
                }

            } catch (error) {
                console.error('Error loading store data:', error);
                toast.error('Failed to load store information');
            } finally {
                setStoreLoading(false);
            }
        };

        loadStoreData();
    }, [editingService, onClose]);

    // Load branches for the selected store
    const loadStoreBranches = async (storeId) => {
        try {
            setBranchesLoading(true);
            const response = await branchService.getBranchesByStore(storeId);
            const branches = response?.branches || [];
            setAvailableBranches(branches);

            if (branches.length === 1 && !editingService) {
                const mainBranch = branches[0];
                setServiceData(prev => ({
                    ...prev,
                    branch_id: mainBranch.id
                }));
                await loadBranchStaff(mainBranch.id);
            }
        } catch (error) {
            console.error('Error loading branches:', error);
            toast.error('Failed to load store branches');
        } finally {
            setBranchesLoading(false);
        }
    };

    const loadStoreStaff = async (storeId) => {
        try {
            setStaffLoading(true);
            const staffResponse = await fetchStaff({
                storeId: storeId,
                status: 'active'
            });
            const staff = staffResponse?.staff || [];
            setAvailableStaff(staff);
        } catch (error) {
            console.error('Error loading staff:', error);
            toast.error('Failed to load staff members');
            setAvailableStaff([]);
        } finally {
            setStaffLoading(false);
        }
    };

    const loadBranchStaff = async (branchId) => {
        try {
            setStaffLoading(true);

            if (branchId.startsWith('store-')) {
                const storeId = branchId.replace('store-', '');
                await loadStoreStaff(storeId);
                return;
            }

            let staffResponse;
            try {
                staffResponse = await fetchStaff({
                    storeId: serviceData.store_id,
                    branchId: branchId,
                    status: 'active'
                });
            } catch (branchError) {
                staffResponse = await fetchStaff({
                    storeId: serviceData.store_id,
                    status: 'active'
                });
            }

            const staff = staffResponse?.staff || [];
            setAvailableStaff(staff);
        } catch (error) {
            console.error('Error loading branch staff:', error);
            toast.error('Failed to load staff for selected branch');
            setAvailableStaff([]);
        } finally {
            setStaffLoading(false);
        }
    };

    const handleBranchChange = async (e) => {
        const branchId = e.target.value;

        setServiceData(prev => ({
            ...prev,
            branch_id: branchId,
            staffIds: []
        }));

        setSelectedStaff([]);

        if (errors.branch_id) {
            setErrors(prev => ({ ...prev, branch_id: '' }));
        }

        if (branchId) {
            await loadBranchStaff(branchId);
        } else {
            setAvailableStaff([]);
        }
    };

    // Enhanced validation
    const validateForm = () => {
        const newErrors = {};

        if (!serviceData.name.trim()) {
            newErrors.name = 'Service name is required';
        }

        if (!serviceData.category) {
            newErrors.category = 'Please select a category';
        }

        if (!serviceData.branch_id) {
            newErrors.branch_id = 'Please select a branch where this service will be offered';
        }

        if (!serviceData.description.trim()) {
            newErrors.description = 'Description is required';
        } else if (serviceData.description.length < 10) {
            newErrors.description = 'Description must be at least 10 characters';
        }

        // Image validation
        const hasImages = serviceData.images.length > 0;
        const hasNewImages = imageFiles.some(file => file !== null);

        if (!hasImages && !hasNewImages) {
            if (process.env.NODE_ENV === 'production') {
                newErrors.images = 'Please upload at least one image for your service';
            }
        }

        if (serviceData.type === 'fixed') {
            if (!serviceData.price || parseFloat(serviceData.price) <= 0) {
                newErrors.price = 'Please enter a valid price';
            }

            if (!serviceData.duration || parseInt(serviceData.duration) <= 0) {
                newErrors.duration = 'Please enter a valid duration';
            }

            if (!serviceData.max_concurrent_bookings || parseInt(serviceData.max_concurrent_bookings) < 1) {
                newErrors.max_concurrent_bookings = 'Maximum concurrent bookings must be at least 1';
            } else if (parseInt(serviceData.max_concurrent_bookings) > 50) {
                newErrors.max_concurrent_bookings = 'Maximum concurrent bookings cannot exceed 50';
            }
        } else if (serviceData.type === 'dynamic') {
            if (!serviceData.price_range.trim()) {
                newErrors.price_range = 'Please provide an estimated price range';
            }

            if (serviceData.pricing_factors.length === 0) {
                newErrors.pricing_factors = 'Please select at least one pricing factor';
            }
        }

        if (selectedStaff.length === 0) {
            newErrors.staff = 'Please select at least one staff member for this service';
        }

        // Validate booking confirmation settings
        if (!serviceData.auto_confirm_bookings && !serviceData.confirmation_message.trim()) {
            newErrors.confirmation_message = 'Please provide a confirmation message for manual confirmation';
        }

        if (serviceData.min_cancellation_hours < 0 || serviceData.min_cancellation_hours > 48) {
            newErrors.min_cancellation_hours = 'Cancellation hours must be between 0 and 48';
        }

        if (serviceData.early_checkin_minutes < 0 || serviceData.early_checkin_minutes > 60) {
            newErrors.early_checkin_minutes = 'Early check-in must be between 0 and 60 minutes';
        }

        if (serviceData.grace_period_minutes < 0 || serviceData.grace_period_minutes > 60) {
            newErrors.grace_period_minutes = 'Grace period must be between 0 and 60 minutes';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const inputValue = type === 'checkbox' ? checked : value;

        setServiceData((prev) => ({ ...prev, [name]: inputValue }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Auto-set slot_interval to duration if not set (for fixed services)
        if (name === 'duration' && value && !serviceData.slot_interval && serviceData.type === 'fixed') {
            setServiceData(prev => ({ ...prev, slot_interval: value }));
        }

        // Set default confirmation message when auto-confirm is disabled
        if (name === 'auto_confirm_bookings' && !checked && !serviceData.confirmation_message) {
            setServiceData(prev => ({
                ...prev,
                confirmation_message: 'Thank you for your booking! We will review it and confirm within 24 hours.'
            }));
        }
    };

    const handleStaffSelection = (staff) => {
        const isSelected = selectedStaff.some(s => s.id === staff.id);

        if (isSelected) {
            setSelectedStaff(prev => prev.filter(s => s.id !== staff.id));
            setServiceData(prev => ({
                ...prev,
                staffIds: prev.staffIds.filter(id => id !== staff.id)
            }));
        } else {
            setSelectedStaff(prev => [...prev, staff]);
            setServiceData(prev => ({
                ...prev,
                staffIds: [...prev.staffIds, staff.id]
            }));
        }

        if (errors.staff) {
            setErrors(prev => ({ ...prev, staff: '' }));
        }
    };

    // Image handling methods (keeping existing logic)
    const handleImageChange = (e, index) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        const newImageFiles = [...imageFiles];
        newImageFiles[index] = file;
        setImageFiles(newImageFiles);

        const reader = new FileReader();
        reader.onload = (e) => {
            const newPreviews = [...imagePreviews];
            newPreviews[index] = e.target.result;
            setImagePreviews(newPreviews);
        };
        reader.readAsDataURL(file);

        if (errors.images) {
            setErrors(prev => ({ ...prev, images: '' }));
        }
    };

    const handleImageUpload = async (index) => {
        const file = imageFiles[index];
        if (!file) return null;

        try {
            setUploadingIndex(index);
            const response = await uploadImage(file, 'services');
            const imageUrl = response.fileUrl || response.url || response.data?.url;

            if (imageUrl) {
                setServiceData((prev) => {
                    const newImages = [...prev.images];
                    newImages[index] = imageUrl;
                    return {
                        ...prev,
                        images: newImages.filter(img => img)
                    };
                });

                const newImageFiles = [...imageFiles];
                newImageFiles[index] = null;
                setImageFiles(newImageFiles);

                toast.success(`Image ${index + 1} uploaded successfully`);
                return imageUrl;
            }
        } catch (uploadError) {
            toast.error(`Failed to upload image ${index + 1}`);
            return null;
        } finally {
            setUploadingIndex(null);
        }
    };

    const removeImage = (index) => {
        const newImages = [...serviceData.images];
        newImages.splice(index, 1);

        const newImageFiles = [...imageFiles];
        newImageFiles[index] = null;

        const newPreviews = [...imagePreviews];
        newPreviews[index] = null;

        setServiceData(prev => ({ ...prev, images: newImages }));
        setImageFiles(newImageFiles);
        setImagePreviews(newPreviews);
    };

    // Pricing factors handling
    const handlePricingFactorToggle = (factor) => {
        const newFactors = serviceData.pricing_factors.includes(factor)
            ? serviceData.pricing_factors.filter(f => f !== factor)
            : [...serviceData.pricing_factors, factor];

        setServiceData(prev => ({ ...prev, pricing_factors: newFactors }));

        if (errors.pricing_factors) {
            setErrors(prev => ({ ...prev, pricing_factors: '' }));
        }
    };

    const handleSubmit = async () => {
        console.log('Submitting service form...');

        if (!validateForm()) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        // Upload any pending images and collect URLs directly
        const uploadedImageUrls = [];
        const pendingUploads = [];

        imageFiles.forEach((file, index) => {
            if (file) {
                pendingUploads.push(
                    handleImageUpload(index).then(url => {
                        if (url) {
                            uploadedImageUrls[index] = url;
                        }
                        return url;
                    })
                );
            }
        });

        if (pendingUploads.length > 0) {
            setImageUploading(true);
            try {
                await Promise.all(pendingUploads);
            } catch (error) {
                console.error('Some image uploads failed:', error);
                toast.error('Some images failed to upload. Please try again.');
                setImageUploading(false);
                return;
            }
            setImageUploading(false);
        }

        try {
            setLoading(true);

            // Combine existing images with newly uploaded ones
            const existingImages = serviceData.images.filter(img => img && img.trim() !== '');
            const newlyUploadedImages = uploadedImageUrls.filter(img => img && img.trim() !== '');
            const finalImages = [...existingImages, ...newlyUploadedImages];

            const servicePayload = {
                ...serviceData,
                price: serviceData.type === 'fixed' ? parseFloat(serviceData.price) : null,
                duration: serviceData.type === 'fixed' ? parseInt(serviceData.duration) : null,
                max_concurrent_bookings: parseInt(serviceData.max_concurrent_bookings),
                slot_interval: serviceData.slot_interval ? parseInt(serviceData.slot_interval) : null,
                buffer_time: parseInt(serviceData.buffer_time) || 0,
                min_advance_booking: parseInt(serviceData.min_advance_booking) || 30,
                max_advance_booking: parseInt(serviceData.max_advance_booking) || 10080,
                // NEW: Booking confirmation settings
                auto_confirm_bookings: serviceData.auto_confirm_bookings,
                confirmation_message: serviceData.confirmation_message.trim(),
                require_prepayment: serviceData.require_prepayment,
                cancellation_policy: serviceData.cancellation_policy.trim(),
                min_cancellation_hours: parseInt(serviceData.min_cancellation_hours) || 2,
                // NEW: Check-in settings
                allow_early_checkin: serviceData.allow_early_checkin,
                early_checkin_minutes: parseInt(serviceData.early_checkin_minutes) || 15,
                auto_complete_on_duration: serviceData.auto_complete_on_duration,
                grace_period_minutes: parseInt(serviceData.grace_period_minutes) || 10,
                staffIds: selectedStaff.map(staff => staff.id),
                images: finalImages,
                image_url: finalImages.length > 0 ? finalImages[0] : null
            };

            let response;
            if (editingService) {
                response = await updateService(editingService.id, servicePayload);
                toast.success('Service updated successfully');
            } else {
                response = await createService(servicePayload);
                toast.success('Service created successfully');
            }

            if (serviceData.type === 'dynamic' && !editingService) {
                const serviceId = response.newService?.id || response.service?.id;
                if (serviceId) {
                    toast.success('Redirecting to form builder...');
                    setTimeout(() => {
                        navigate(`/dashboard/dynamic-form/${serviceId}`);
                    }, 1000);
                    return;
                }
            }

            onClose();
            onServiceAdded();

        } catch (error) {
            console.error('Service submission error:', error);
            toast.error(error.message || 'Failed to save service. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Determine the steps and their corresponding tab IDs for the progress indicator
    const steps = [
        { id: 'basic', label: 'Basic Info', icon: Info },
        { id: 'images', label: 'Images', icon: Image },
        { id: 'booking', label: 'Booking', icon: Calendar },
        { id: 'staff', label: 'Staff', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings }
    ];

    if (storeLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-primary mr-3" />
                <span className="text-lg">Loading store information...</span>
            </div>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case 'basic':
                return (
                    <div className="h-full">
                        <div className="grid grid-cols-3 gap-8 h-full">
                            {/* Left Column - Basic Info */}
                            <div className="col-span-1 space-y-6">
                                {/* Service Name */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                                        Service Name *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={serviceData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter service name"
                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.name && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.name}</p>}
                                </div>

                                {/* Branch Selection */}
                                <div>
                                    <label htmlFor="branch_id" className="block text-sm font-semibold text-gray-800 mb-2">
                                        Service Location (Branch) *
                                    </label>
                                    {branchesLoading ? (
                                        <div className="flex items-center justify-center py-4 border border-gray-300 bg-gray-50 rounded-lg">
                                            <Loader className="w-4 h-4 animate-spin text-primary mr-2" />
                                            <span className="text-sm text-gray-600">Loading branches...</span>
                                        </div>
                                    ) : (
                                        <select
                                            id="branch_id"
                                            name="branch_id"
                                            value={serviceData.branch_id}
                                            onChange={handleBranchChange}
                                            className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.branch_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select a branch</option>
                                            {availableBranches.map(branch => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                    {branch.isMainBranch && ' (Main Branch)'}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                    {errors.branch_id && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.branch_id}</p>}
                                </div>

                                {/* Category */}
                                <div>
                                    <label htmlFor="category" className="block text-sm font-semibold text-gray-800 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        id="category"
                                        name="category"
                                        value={serviceData.category}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.category ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Select a category</option>
                                        {CATEGORIES.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.category}</p>}
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-semibold text-gray-800 mb-2">
                                        Description *
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={serviceData.description}
                                        onChange={handleInputChange}
                                        placeholder="Describe your service in detail..."
                                        rows="6"
                                        maxLength="500"
                                        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                    ></textarea>
                                    {errors.description && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.description}</p>}
                                    <div className="flex justify-between mt-1">
                                        <p className="text-xs text-gray-500">{serviceData.description.length}/500 characters</p>
                                        {serviceData.description.length >= 400 && <p className="text-xs text-orange-500">Almost at character limit</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Middle Column - Service Type */}
                            <div className="col-span-1 space-y-6">
                                {/* Service Type */}
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                                        Service Type *
                                    </label>
                                    <div className="space-y-3">
                                        <div
                                            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${serviceData.type === 'fixed'
                                                    ? 'border-primary bg-primary bg-opacity-5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => handleInputChange({ target: { name: 'type', value: 'fixed' } })}
                                        >
                                            <div className="flex items-center mb-2">
                                                <input
                                                    type="radio"
                                                    id="type-fixed"
                                                    name="type"
                                                    value="fixed"
                                                    checked={serviceData.type === 'fixed'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                                />
                                                <label htmlFor="type-fixed" className="ml-2 text-sm font-medium text-gray-900">
                                                    Fixed Price Service
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-600 ml-6">
                                                Set price and duration for standardized services
                                            </p>
                                        </div>

                                        <div
                                            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${serviceData.type === 'dynamic'
                                                    ? 'border-primary bg-primary bg-opacity-5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            onClick={() => handleInputChange({ target: { name: 'type', value: 'dynamic' } })}
                                        >
                                            <div className="flex items-center mb-2">
                                                <input
                                                    type="radio"
                                                    id="type-dynamic"
                                                    name="type"
                                                    value="dynamic"
                                                    checked={serviceData.type === 'dynamic'}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                                />
                                                <label htmlFor="type-dynamic" className="ml-2 text-sm font-medium text-gray-900">
                                                    Dynamic Price Service
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-600 ml-6">
                                                Variable pricing based on customer requirements
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Settings Preview */}
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                    <h4 className="text-sm font-semibold text-blue-900 mb-3">Quick Settings</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="featured-preview"
                                                name="featured"
                                                checked={serviceData.featured}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="featured-preview" className="ml-2 text-xs text-gray-700">
                                                Feature this service
                                            </label>
                                        </div>

                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="auto-confirm-preview"
                                                name="auto_confirm_bookings"
                                                checked={serviceData.auto_confirm_bookings}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="auto-confirm-preview" className="ml-2 text-xs text-gray-700">
                                                Auto-confirm bookings
                                            </label>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-3">
                                        Configure more settings in the Booking and Settings tabs
                                    </p>
                                </div>
                            </div>

                            {/* Right Column - Pricing Details */}
                            <div className="col-span-1 space-y-6">
                                {/* Fixed Price Fields */}
                                {serviceData.type === 'fixed' && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-4 flex items-center">
                                            <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                                            Fixed Price Settings
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="price" className="block text-sm font-medium text-gray-800 mb-2">
                                                    Price (KES) *
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <DollarSign className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <input
                                                        id="price"
                                                        type="number"
                                                        name="price"
                                                        value={serviceData.price}
                                                        onChange={handleInputChange}
                                                        placeholder="0.00"
                                                        min="0"
                                                        step="0.01"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.price ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                            }`}
                                                    />
                                                </div>
                                                {errors.price && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.price}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="duration" className="block text-sm font-medium text-gray-800 mb-2">
                                                    Duration (minutes) *
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Clock className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <input
                                                        id="duration"
                                                        type="number"
                                                        name="duration"
                                                        value={serviceData.duration}
                                                        onChange={handleInputChange}
                                                        placeholder="30"
                                                        min="1"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.duration ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                            }`}
                                                    />
                                                </div>
                                                {errors.duration && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.duration}</p>}
                                            </div>

                                            <div>
                                                <label htmlFor="max_concurrent_bookings" className="block text-sm font-medium text-gray-800 mb-2">
                                                    Max Concurrent Bookings *
                                                </label>
                                                <input
                                                    id="max_concurrent_bookings"
                                                    type="number"
                                                    name="max_concurrent_bookings"
                                                    value={serviceData.max_concurrent_bookings}
                                                    onChange={handleInputChange}
                                                    min="1"
                                                    max="50"
                                                    className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.max_concurrent_bookings ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                />
                                                {errors.max_concurrent_bookings && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.max_concurrent_bookings}</p>}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Number of customers that can book the same time slot
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Dynamic Price Fields */}
                                {serviceData.type === 'dynamic' && (
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                                        <h3 className="text-sm font-semibold text-orange-900 mb-4 flex items-center">
                                            <Calculator className="w-4 h-4 mr-2 text-orange-600" />
                                            Dynamic Pricing Settings
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label htmlFor="price_range" className="block text-sm font-medium text-gray-800 mb-2">
                                                    Estimated Price Range (KES) *
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <DollarSign className="h-4 w-4 text-gray-500" />
                                                    </div>
                                                    <input
                                                        id="price_range"
                                                        type="text"
                                                        name="price_range"
                                                        value={serviceData.price_range}
                                                        onChange={handleInputChange}
                                                        placeholder="e.g., 500 - 5000"
                                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.price_range ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                            }`}
                                                    />
                                                </div>
                                                {errors.price_range && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.price_range}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-800 mb-2">
                                                    Pricing Factors * (Select up to 5)
                                                </label>
                                                <div className="bg-white p-3 rounded-lg border border-orange-100 max-h-40 overflow-y-auto">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {PRICING_FACTORS.slice(0, 8).map((factor) => (
                                                            <label key={factor} className={`flex items-center p-2 rounded text-xs cursor-pointer transition-all ${serviceData.pricing_factors.includes(factor)
                                                                    ? 'bg-orange-100 border border-orange-300'
                                                                    : 'hover:bg-gray-50'
                                                                }`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={serviceData.pricing_factors.includes(factor)}
                                                                    onChange={() => handlePricingFactorToggle(factor)}
                                                                    disabled={!serviceData.pricing_factors.includes(factor) && serviceData.pricing_factors.length >= 5}
                                                                    className="h-3 w-3 text-primary focus:ring-primary border-gray-300 rounded mr-2"
                                                                />
                                                                <span className="text-gray-800 flex-1">{factor}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                                {errors.pricing_factors && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.pricing_factors}</p>}
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Selected: {serviceData.pricing_factors.length}/5
                                                </p>
                                            </div>

                                            <div className="flex items-center p-3 bg-white rounded-lg border border-orange-100">
                                                <input
                                                    type="checkbox"
                                                    id="consultation_required"
                                                    name="consultation_required"
                                                    checked={serviceData.consultation_required}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                />
                                                <label htmlFor="consultation_required" className="ml-2 block text-xs text-gray-700">
                                                    Consultation required before service delivery
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Form Progress Summary */}
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Form Progress</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">Basic Info</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${serviceData.name && serviceData.branch_id && serviceData.category && serviceData.description
                                                    ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {serviceData.name && serviceData.branch_id && serviceData.category && serviceData.description ? 'Complete' : 'Incomplete'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">Images</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${serviceData.images.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {serviceData.images.length > 0 ? 'Added' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">Staff</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${selectedStaff.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {selectedStaff.length > 0 ? `${selectedStaff.length} Selected` : 'None'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

                case 'images':
                    return (
                        <div className="w-full h-full"> {/* Changed from max-w-6xl mx-auto */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Service Images</h3>
                                <p className="text-sm text-gray-600">Upload up to 3 high-quality images of your service. The first image will be used as the primary image.</p>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-8"> {/* Increased gap from gap-6 to gap-8 */}
                                {[0, 1, 2].map((index) => (
                                    <div key={index} className="relative">
                                        {imagePreviews[index] || serviceData.images[index] ? (
                                            <div className="relative group rounded-xl overflow-hidden shadow-lg">
                                                <img
                                                    src={imagePreviews[index] || serviceData.images[index]}
                                                    alt={`Service image ${index + 1}`}
                                                    className="w-full h-80 object-cover transition-transform group-hover:scale-105" // Increased height from h-64 to h-80
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                                                    {imageFiles[index] && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImageUpload(index)}
                                                            disabled={uploadingIndex === index}
                                                            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full disabled:opacity-50 transition-colors"
                                                        >
                                                            {uploadingIndex === index ? (
                                                                <Loader className="w-5 h-5 animate-spin" />
                                                            ) : (
                                                                <Upload className="w-5 h-5" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                                {index === 0 && (
                                                    <div className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                                                        PRIMARY
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`border-2 border-dashed rounded-xl h-80 flex flex-col items-center justify-center transition-colors hover:bg-gray-50 cursor-pointer ${errors.images ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-primary bg-gray-50'}`}>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageChange(e, index)}
                                                    className="hidden"
                                                    id={`image-upload-${index}`}
                                                />
                                                
                                                <label htmlFor={`image-upload-${index}`} className="cursor-pointer flex flex-col items-center p-6 w-full h-full justify-center">
                                                    <Image className="w-16 h-16 text-gray-400 mb-4" /> {/* Increased icon size */}
                                                    <span className="text-base font-medium text-gray-700"> {/* Increased from text-sm */}
                                                        Upload Image {index + 1}
                                                    </span>
                                                    <span className="text-sm text-gray-500 mt-2"> {/* Increased from text-xs */}
                                                        {index === 0 ? '(Primary)' : '(Optional)'}
                                                    </span>
                                                    <span className="text-sm text-gray-400 mt-3"> {/* Increased from text-xs */}
                                                        JPG, PNG (max 5MB)
                                                    </span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                
                            {errors.images && <p className="mt-4 text-sm text-red-600 flex items-center justify-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.images}</p>}
                            
                            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-100"> {/* Increased padding and margin */}
                                <div className="flex items-start">
                                    <Info className="w-6 h-6 text-blue-500 mt-0.5 mr-4 flex-shrink-0" /> {/* Increased icon size */}
                                    <div>
                                        <h4 className="text-base font-medium text-blue-800">Image Guidelines</h4> {/* Increased from text-sm */}
                                        <ul className="mt-3 text-sm text-blue-700 space-y-2 list-disc list-inside"> {/* Increased spacing */}
                                            <li>Use high-resolution images (minimum 800x600 pixels)</li>
                                            <li>Show your service clearly and professionally</li>
                                            <li>The first image will be displayed prominently in listings</li>
                                            <li>Avoid images with text overlays or watermarks</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );

            case 'booking':
                return (
                    <div className="space-y-8">
                        {/* Booking Confirmation Settings */}
                        <div className="p-6 border-2 border-blue-200 rounded-xl bg-blue-50">
                            <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                                <Shield className="w-6 h-6 mr-3 text-blue-600" />
                                Booking Confirmation Settings
                            </h3>

                            <div className="space-y-5">
                                <div className="flex items-center p-3 bg-white rounded-lg border border-blue-100">
                                    <input
                                        type="checkbox"
                                        id="auto_confirm_bookings"
                                        name="auto_confirm_bookings"
                                        checked={serviceData.auto_confirm_bookings}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="auto_confirm_bookings" className="ml-3 block text-base text-gray-700">
                                        Automatically confirm all bookings for this service
                                    </label>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-blue-100">
                                    <label htmlFor="confirmation_message" className="block text-base font-medium text-gray-800 mb-2">
                                        {serviceData.auto_confirm_bookings ? 'Auto-Confirmation Message' : 'Manual Confirmation Message *'}
                                    </label>
                                    <textarea
                                        id="confirmation_message"
                                        name="confirmation_message"
                                        value={serviceData.confirmation_message}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder={serviceData.auto_confirm_bookings
                                            ? 'Message sent when booking is automatically confirmed...'
                                            : 'Message sent when manually confirming bookings...'
                                        }
                                        className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.confirmation_message ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                    />
                                    {errors.confirmation_message && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.confirmation_message}</p>}
                                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                                        <MessageSquare className="w-4 h-4 mr-1" />
                                        This message will be sent to clients when their booking is confirmed
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                id="require_prepayment"
                                                name="require_prepayment"
                                                checked={serviceData.require_prepayment}
                                                onChange={handleInputChange}
                                                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="require_prepayment" className="ml-3 block text-base text-gray-700">
                                                Require prepayment
                                            </label>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-8">
                                            Clients must pay before booking is confirmed
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-blue-100">
                                        <label htmlFor="min_cancellation_hours" className="block text-base font-medium text-gray-800 mb-2">
                                            Minimum Cancellation Hours
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Clock className="h-5 w-5 text-gray-500" />
                                            </div>
                                            <input
                                                id="min_cancellation_hours"
                                                type="number"
                                                name="min_cancellation_hours"
                                                value={serviceData.min_cancellation_hours}
                                                onChange={handleInputChange}
                                                min="0"
                                                max="48"
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.min_cancellation_hours ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                    }`}
                                            />
                                        </div>
                                        {errors.min_cancellation_hours && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.min_cancellation_hours}</p>}
                                        <p className="mt-2 text-sm text-gray-500">
                                            Hours before appointment when cancellation is allowed
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-blue-100">
                                    <label htmlFor="cancellation_policy" className="block text-base font-medium text-gray-800 mb-2">
                                        Cancellation Policy
                                    </label>
                                    <textarea
                                        id="cancellation_policy"
                                        name="cancellation_policy"
                                        value={serviceData.cancellation_policy}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Describe your cancellation and refund policy..."
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                    <p className="mt-2 text-sm text-gray-500 flex items-center">
                                        <Info className="w-4 h-4 mr-1" />
                                        Shown to clients during booking process
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Check-in and Completion Settings */}
                        <div className="p-6 border-2 border-green-200 rounded-xl bg-green-50">
                            <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                                <UserCheck className="w-6 h-6 mr-3 text-green-600" />
                                Check-in & Service Completion
                            </h3>

                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="bg-white p-4 rounded-lg border border-green-100">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                id="allow_early_checkin"
                                                name="allow_early_checkin"
                                                checked={serviceData.allow_early_checkin}
                                                onChange={handleInputChange}
                                                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="allow_early_checkin" className="ml-3 block text-base text-gray-700">
                                                Allow early check-in
                                            </label>
                                        </div>

                                        {serviceData.allow_early_checkin && (
                                            <div className="mt-3 ml-8">
                                                <label htmlFor="early_checkin_minutes" className="block text-sm font-medium text-gray-700 mb-2">
                                                    Early Check-in Window (minutes)
                                                </label>
                                                <input
                                                    id="early_checkin_minutes"
                                                    type="number"
                                                    name="early_checkin_minutes"
                                                    value={serviceData.early_checkin_minutes}
                                                    onChange={handleInputChange}
                                                    min="0"
                                                    max="60"
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.early_checkin_minutes ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                        }`}
                                                />
                                                {errors.early_checkin_minutes && <p className="mt-1 text-xs text-red-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.early_checkin_minutes}</p>}
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-green-100">
                                        <div className="flex items-center mb-3">
                                            <input
                                                type="checkbox"
                                                id="auto_complete_on_duration"
                                                name="auto_complete_on_duration"
                                                checked={serviceData.auto_complete_on_duration}
                                                onChange={handleInputChange}
                                                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                                            />
                                            <label htmlFor="auto_complete_on_duration" className="ml-3 block text-base text-gray-700">
                                                Auto-complete after duration
                                            </label>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-8">
                                            Automatically mark booking as complete after service duration ends
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-green-100">
                                    <label htmlFor="grace_period_minutes" className="block text-base font-medium text-gray-800 mb-2">
                                        Grace Period (minutes)
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Clock className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <input
                                            id="grace_period_minutes"
                                            type="number"
                                            name="grace_period_minutes"
                                            value={serviceData.grace_period_minutes}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="60"
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.grace_period_minutes ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {errors.grace_period_minutes && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.grace_period_minutes}</p>}
                                    <p className="mt-2 text-sm text-gray-500">
                                        Time after scheduled appointment before marking as no-show
                                    </p>
                                </div>

                                {serviceData.type === 'fixed' && serviceData.duration && (
                                    <div className="bg-blue-100 p-4 rounded-lg border border-blue-200">
                                        <div className="flex items-start">
                                            <Timer className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                                            <div>
                                                <h4 className="text-base font-medium text-blue-800">Auto-Completion Timer</h4>
                                                <p className="text-sm text-blue-700 mt-1">
                                                    When auto-completion is enabled, bookings will automatically change to "Completed"
                                                    status {serviceData.duration} minutes after check-in.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Booking Capacity Settings for Fixed Services */}
                        {serviceData.type === 'fixed' && (
                            <div className="p-6 border-2 border-purple-200 rounded-xl bg-purple-50">
                                <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                                    <Users className="w-6 h-6 mr-3 text-purple-600" />
                                    Booking Capacity Settings
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                                    <div className="bg-white p-4 rounded-lg border border-purple-100">
                                        <label htmlFor="max_concurrent_bookings" className="block text-base font-medium text-gray-800 mb-2">
                                            Max Concurrent Bookings *
                                        </label>
                                        <input
                                            id="max_concurrent_bookings"
                                            type="number"
                                            name="max_concurrent_bookings"
                                            value={serviceData.max_concurrent_bookings}
                                            onChange={handleInputChange}
                                            min="1"
                                            max="50"
                                            className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.max_concurrent_bookings ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                                }`}
                                        />
                                        {errors.max_concurrent_bookings && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.max_concurrent_bookings}</p>}
                                        <p className="mt-2 text-sm text-gray-500">
                                            Number of customers that can book the same time slot
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-purple-100">
                                        <label htmlFor="slot_interval" className="block text-base font-medium text-gray-800 mb-2">
                                            Slot Interval (minutes)
                                        </label>
                                        <input
                                            id="slot_interval"
                                            type="number"
                                            name="slot_interval"
                                            value={serviceData.slot_interval}
                                            onChange={handleInputChange}
                                            placeholder={serviceData.duration || "60"}
                                            min="1"
                                            className="w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                                        />
                                        <p className="mt-2 text-sm text-gray-500">
                                            Time between available booking slots (defaults to service duration)
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white p-4 rounded-lg border border-purple-100 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="allow_overbooking"
                                        name="allow_overbooking"
                                        checked={serviceData.allow_overbooking}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="allow_overbooking" className="ml-3 block text-base text-gray-700">
                                        Allow overbooking (accept bookings beyond max concurrent capacity)
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 'staff':
                return (
                    <div className="space-y-6">
                        {/* Staff Selection */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-lg font-semibold text-gray-800">
                                    Assign Staff Members *
                                </label>
                                <div className="bg-primary bg-opacity-10 text-primary text-sm px-3 py-1 rounded-full">
                                    {selectedStaff.length} staff selected
                                </div>
                            </div>

                            {!serviceData.branch_id ? (
                                <div className="border-2 border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-base text-gray-600 font-medium">Please select a branch first</p>
                                    <p className="text-sm text-gray-500 mt-1">Staff assignment is specific to each branch location</p>
                                </div>
                            ) : staffLoading ? (
                                <div className="flex items-center justify-center py-12 border border-gray-200 rounded-xl bg-gray-50">
                                    <Loader className="w-6 h-6 animate-spin text-primary mr-3" />
                                    <span className="text-base text-gray-600">Loading staff members...</span>
                                </div>
                            ) : availableStaff.length === 0 ? (
                                <div className="text-center py-10 border-2 border-gray-200 rounded-xl bg-gray-50">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-base text-gray-600 font-medium">No active staff members found</p>
                                    <p className="text-sm text-gray-500 mt-1">Add staff in the Staff Management section</p>
                                </div>
                            ) : (
                                <div className={`border-2 rounded-xl p-5 ${errors.staff ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
                                        {availableStaff.map((staff) => {
                                            const isSelected = selectedStaff.some(s => s.id === staff.id);
                                            return (
                                                <div
                                                    key={staff.id}
                                                    onClick={() => handleStaffSelection(staff)}
                                                    className={`flex items-center p-4 rounded-lg cursor-pointer transition-all ${isSelected
                                                            ? 'bg-primary bg-opacity-10 border-primary border-2'
                                                            : 'bg-white hover:bg-gray-50 border border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex-shrink-0 mr-4">
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-medium ${isSelected
                                                                ? 'bg-primary text-white'
                                                                : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {staff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-base font-medium text-gray-900">{staff.name}</h4>
                                                            {isSelected && (
                                                                <UserCheck className="w-5 h-5 text-primary" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600">{staff.role || 'Staff'}</p>
                                                        <p className="text-xs text-gray-500">{staff.email}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedStaff.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-sm font-medium text-gray-600 mb-3">Selected staff:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedStaff.map((staff) => (
                                                    <span
                                                        key={staff.id}
                                                        className="inline-flex items-center px-3 py-1.5 bg-primary bg-opacity-10 text-primary text-sm rounded-full"
                                                    >
                                                        {staff.name}
                                                        <X
                                                            className="w-4 h-4 ml-2 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleStaffSelection(staff);
                                                            }}
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {errors.staff && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.staff}</p>}

                            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start">
                                <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                                <p className="text-sm text-yellow-700">
                                    Only selected staff members will be able to view and manage bookings for this service.
                                    Make sure to add all staff who will perform this service.
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'settings':
                return (
                    <div className="space-y-6">
                        {/* Additional Settings */}
                        <div className="p-6 border-2 border-gray-200 rounded-xl bg-gray-50">
                            <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
                                <Settings className="w-6 h-6 mr-3 text-gray-600" />
                                Additional Settings
                            </h3>

                            <div className="space-y-5">
                                <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        name="featured"
                                        checked={serviceData.featured}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <label htmlFor="featured" className="ml-3 block text-base text-gray-700">
                                        Feature this service (appears prominently in listings)
                                    </label>
                                </div>

                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start">
                                    <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-base font-medium text-blue-800">Pro Tips:</h4>
                                        <ul className="mt-2 text-sm text-blue-700 space-y-1 list-disc list-inside">
                                            <li>Featured services appear at the top of category listings</li>
                                            <li>Use high-quality images for better visibility</li>
                                            <li>Keep service descriptions clear and compelling</li>
                                            <li>Update service details regularly to keep them fresh</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-white overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{editingService ? 'Edit Service' : 'Create New Service'}</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="overflow-visible">
                {/* Progress Bar - Similar to quiz form */}
                <div className="border-b border-gray-100 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-5 gap-2">
                            {steps.map((step, index) => (
                                <div key={index} className="flex items-center">
                                    <div
                                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center 
                                        ${activeTab === step.id ? 'bg-primary text-white' :
                                                (index < steps.findIndex(s => s.id === activeTab) + 1) ?
                                                    'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}
                                    >
                                        {index + 1}
                                    </div>
                                    {index < 4 && (
                                        <div className={`flex-1 h-1 ${index < steps.findIndex(s => s.id === activeTab) ?
                                                'bg-primary' : 'bg-gray-200'
                                            }`}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500 px-1">
                        {steps.map((step, index) => (
                            <span key={index}>{step.label}</span>
                        ))}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
                    <div className="px-8">
                        <nav className="flex space-x-2 overflow-x-auto py-4 scrollbar-hide">
                            {steps.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-3 px-6 text-base font-medium rounded-full flex items-center space-x-2 min-w-fit ${activeTab === tab.id
                                                ? 'bg-primary text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            } transition-all duration-200`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    <div className="p-6 h-full">
                        {renderTabContent()}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex-shrink-0 bg-white border-t border-gray-200 p-6 shadow-inner flex gap-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 px-6 border-2 border-gray-300 rounded-lg text-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center"
                    >
                        <X className="w-6 h-6 mr-2" />
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || imageUploading}
                        className="flex-1 py-4 px-6 bg-primary text-white rounded-lg text-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md"
                    >
                        {loading || imageUploading ? (
                            <>
                                <Loader className="w-6 h-6 animate-spin mr-3" />
                                {imageUploading ? 'Uploading Images...' : (editingService ? 'Updating...' : 'Creating...')}
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-6 h-6 mr-3" />
                                {editingService ? 'Update Service' : 'Create Service'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const renderBasicInfoTab = () => {
    return (
        <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
                {/* Service Name */}
                <div>
                    <label htmlFor="name" className="block text-base font-semibold text-gray-800 mb-2">
                        Service Name *
                    </label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={serviceData.name}
                        onChange={handleInputChange}
                        placeholder="Enter service name"
                        className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                    />
                    {errors.name && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.name}</p>}
                </div>

                {/* Branch Selection */}
                <div>
                    <label htmlFor="branch_id" className="block text-base font-semibold text-gray-800 mb-2">
                        Service Location (Branch) *
                    </label>

                    {branchesLoading ? (
                        <div className="flex items-center justify-center py-6 border border-gray-300 bg-gray-50 rounded-lg">
                            <Loader className="w-5 h-5 animate-spin text-primary mr-3" />
                            <span className="text-base text-gray-600">Loading branches...</span>
                        </div>
                    ) : (
                        <select
                            id="branch_id"
                            name="branch_id"
                            value={serviceData.branch_id}
                            onChange={handleBranchChange}
                            className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${errors.branch_id ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                }`}
                        >
                            <option value="">Select a branch</option>
                            {availableBranches.map(branch => (
                                <option key={branch.id} value={branch.id}>
                                    {branch.name}
                                    {branch.isMainBranch && ' (Main Branch)'}
                                    {branch.address && ` - ${branch.address.substring(0, 50)}${branch.address.length > 50 ? '...' : ''}`}
                                </option>
                            ))}
                        </select>
                    )}

                    {errors.branch_id && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.branch_id}</p>}
                </div>

                {/* Category */}
                <div>
                    <label htmlFor="category" className="block text-base font-semibold text-gray-800 mb-2">
                        Category *
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={serviceData.category}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.category ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                    >
                        <option value="">Select a category</option>
                        {CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                    {errors.category && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.category}</p>}
                </div>
            </div>

            <div className="space-y-6">
                {/* Service Type */}
                <div className="p-5 bg-gray-50 rounded-lg border border-gray-200">
                    <label htmlFor="type" className="block text-base font-semibold text-gray-800 mb-2">
                        Service Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${serviceData.type === 'fixed'
                                    ? 'border-primary bg-primary bg-opacity-5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleInputChange({ target: { name: 'type', value: 'fixed' } })}
                        >
                            <div className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    id="type-fixed"
                                    name="type"
                                    value="fixed"
                                    checked={serviceData.type === 'fixed'}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                />
                                <label htmlFor="type-fixed" className="ml-2 text-base font-medium text-gray-900">
                                    Fixed Price Service
                                </label>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">
                                Set price and duration for standardized services
                            </p>
                        </div>

                        <div
                            className={`cursor-pointer p-4 rounded-lg border-2 transition-all ${serviceData.type === 'dynamic'
                                    ? 'border-primary bg-primary bg-opacity-5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleInputChange({ target: { name: 'type', value: 'dynamic' } })}
                        >
                            <div className="flex items-center mb-2">
                                <input
                                    type="radio"
                                    id="type-dynamic"
                                    name="type"
                                    value="dynamic"
                                    checked={serviceData.type === 'dynamic'}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                                />
                                <label htmlFor="type-dynamic" className="ml-2 text-base font-medium text-gray-900">
                                    Dynamic Price Service
                                </label>
                            </div>
                            <p className="text-sm text-gray-600 ml-6">
                                Variable pricing based on customer requirements
                            </p>
                        </div>
                    </div>
                </div>

                {/* Fixed Price Fields */}
                {serviceData.type === 'fixed' && (
                    <div className="p-5 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                            <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
                            Fixed Price Settings
                        </h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="price" className="block text-base font-medium text-gray-800 mb-2">
                                    Price (KES) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <DollarSign className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="price"
                                        type="number"
                                        name="price"
                                        value={serviceData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        min="0"
                                        step="0.01"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.price ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                    />
                                </div>
                                {errors.price && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.price}</p>}
                            </div>

                            <div>
                                <label htmlFor="duration" className="block text-base font-medium text-gray-800 mb-2">
                                    Duration (minutes) *
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Clock className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <input
                                        id="duration"
                                        type="number"
                                        name="duration"
                                        value={serviceData.duration}
                                        onChange={handleInputChange}
                                        placeholder="30"
                                        min="1"
                                        className={`w-full pl-10 pr-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.duration ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                    />
                                </div>
                                {errors.duration && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.duration}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div>
                    <label htmlFor="description" className="block text-base font-semibold text-gray-800 mb-2">
                        Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={serviceData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your service in detail..."
                        rows="4"
                        maxLength="500"
                        className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                    ></textarea>
                    {errors.description && <p className="mt-2 text-sm text-red-600 flex items-center"><AlertCircle className="w-4 h-4 mr-1" />{errors.description}</p>}
                    <div className="flex justify-between mt-2">
                        <p className="text-sm text-gray-500">{serviceData.description.length}/500 characters</p>
                        {serviceData.description.length >= 400 && <p className="text-sm text-orange-500">Almost at character limit</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default EnhancedServiceForm;