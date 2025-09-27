import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import branchService from '../services/branchService';
import {
  Plus,
  Edit3,
  Trash2,
  X,
  Save,
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  User,
  Building2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const BranchManagement = ({ storeId, onBranchesUpdate }) => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    openingTime: '',
    closingTime: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    description: '',
    isMainBranch: false
  });
  const [formErrors, setFormErrors] = useState({});

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load branches on component mount
  useEffect(() => {
    if (storeId) {
      loadBranches();
    }
  }, [storeId]);

  // Load branches from API
  const loadBranches = async () => {
    try {
      setLoading(true);
      const response = await branchService.getBranchesByStore(storeId);
      setBranches(response.branches || []);
      
      console.log('Loaded branches:', response.branches?.length || 0);
      
      if (onBranchesUpdate) {
        onBranchesUpdate(response.branches || []);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle working days selection
  const handleWorkingDaysChange = (day) => {
    setFormData(prev => {
      const currentDays = prev.workingDays || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];
      
      return {
        ...prev,
        workingDays: newDays
      };
    });

    if (formErrors.workingDays) {
      setFormErrors(prev => ({
        ...prev,
        workingDays: ''
      }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const validation = branchService.validateBranchData(formData);
    
    if (!formData.workingDays || formData.workingDays.length === 0) {
      validation.errors.workingDays = 'At least one working day must be selected';
      validation.isValid = false;
    }
    
    setFormErrors(validation.errors);
    return validation.isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    const submissionData = {
      ...formData,
      workingDays: formData.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };

    try {
      setLoading(true);

      if (editingBranch) {
        await branchService.updateBranch(editingBranch.id, submissionData);
        toast.success('Branch updated successfully!');
      } else {
        await branchService.createBranch(storeId, submissionData);
        toast.success('Branch added successfully!');
      }

      resetForm();
      await loadBranches();

    } catch (error) {
      console.error('Error saving branch:', error);
      toast.error(error.message || 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      manager: '',
      openingTime: '',
      closingTime: '',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      description: '',
      isMainBranch: false
    });
    setFormErrors({});
    setShowAddForm(false);
    setEditingBranch(null);
  };

  // Start editing a branch
  const startEditing = (branch) => {
    if (branch.isStoreMainBranch) {
      toast.error('Cannot edit main branch. Please update store information instead.');
      return;
    }

    let workingDays = branch.workingDays;
    if (!Array.isArray(workingDays)) {
      workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }

    setFormData({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager: branch.manager || '',
      openingTime: branch.openingTime || '',
      closingTime: branch.closingTime || '',
      workingDays: workingDays,
      description: branch.description || '',
      isMainBranch: false
    });
    
    setEditingBranch(branch);
    setShowAddForm(true);
  };

  // Delete a branch
  const handleDelete = async (branchId) => {
    if (branchId.startsWith('store-')) {
      toast.error('Cannot delete main branch. Main branch is based on store information.');
      return;
    }

    if (!confirm('Are you sure you want to delete this branch?')) {
      return;
    }

    try {
      setLoading(true);
      await branchService.deleteBranch(branchId);
      toast.success('Branch deleted successfully!');
      await loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error(error.message || 'Failed to delete branch');
    } finally {
      setLoading(false);
    }
  };

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
        </div>
        <p className="mt-3 text-gray-600 font-medium">Loading branches...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Store Branches</h3>
              <p className="text-sm text-gray-600">Manage your business locations</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Branch
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Add/Edit Branch Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  {editingBranch ? <Edit3 className="h-4 w-4 text-indigo-600" /> : <Plus className="h-4 w-4 text-indigo-600" />}
                </div>
                <h4 className="text-lg font-semibold text-gray-900">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </h4>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Downtown Branch"
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch Manager</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                        formErrors.manager ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Manager name"
                    />
                  </div>
                  {formErrors.manager && (
                    <p className="text-red-500 text-sm">{formErrors.manager}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none ${
                      formErrors.address ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Complete address including street, city, state, ZIP"
                  />
                </div>
                {formErrors.address && (
                  <p className="text-red-500 text-sm">{formErrors.address}</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                        formErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-red-500 text-sm">{formErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                        formErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="branch@store.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-red-500 text-sm">{formErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Business Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Opening Time
                  </label>
                  <input
                    type="time"
                    name="openingTime"
                    value={formData.openingTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Closing Time
                  </label>
                  <input
                    type="time"
                    name="closingTime"
                    value={formData.closingTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {formErrors.time && (
                <p className="text-red-500 text-sm">{formErrors.time}</p>
              )}

              {/* Working Days */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Working Days *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {weekDays.map((day) => (
                    <label 
                      key={day} 
                      className={`flex items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        formData.workingDays.includes(day)
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.workingDays.includes(day)}
                        onChange={() => handleWorkingDaysChange(day)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{day.substring(0, 3)}</span>
                    </label>
                  ))}
                </div>
                {formErrors.workingDays && (
                  <p className="text-red-500 text-sm">{formErrors.workingDays}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-500">
                    Selected: {formData.workingDays.length} day{formData.workingDays.length !== 1 ? 's' : ''}
                  </p>
                  {formData.workingDays.length > 0 && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Valid selection</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Branch Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Additional details about this branch location..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {editingBranch ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {editingBranch ? 'Update Branch' : 'Add Branch'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && !showAddForm && <LoadingSpinner />}

        {/* Branches List */}
        {!loading && (
          <div className="space-y-4">
            {branches.map((branch) => {
              const formattedBranch = branchService.formatBranchForDisplay(branch);
              
              return (
                <div key={branch.id} className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{branch.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Status Badge */}
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${formattedBranch.statusBadge}`}>
                              {branch.status}
                            </span>
                            
                            {/* Main Branch Badge */}
                            {branch.isMainBranch && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                                Main Branch
                              </span>
                            )}
                            
                            {/* Open/Closed Indicator */}
                            <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                              formattedBranch.isOpenNow 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {formattedBranch.isOpenNow ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                              {formattedBranch.isOpenNow ? 'Open' : 'Closed'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {!branch.isStoreMainBranch && (
                          <button
                            onClick={() => startEditing(branch)}
                            disabled={loading}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Edit branch"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        )}
                        
                        {!branch.isStoreMainBranch && (
                          <button
                            onClick={() => handleDelete(branch.id)}
                            disabled={loading}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete branch"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}

                        {branch.isStoreMainBranch && (
                          <span className="text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded-lg">
                            Main Branch
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Branch Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {/* Address */}
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700">Address</span>
                          <p className="text-gray-600" title={branch.address}>{formattedBranch.displayAddress}</p>
                        </div>
                      </div>
                      
                      {/* Phone */}
                      {branch.phone && (
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Phone className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-700">Phone</span>
                            <p className="text-gray-600">{formattedBranch.displayPhone}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Manager */}
                      {branch.manager && (
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <User className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-700">Manager</span>
                            <p className="text-gray-600">{branch.manager}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Email */}
                      {branch.email && (
                        <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-medium text-gray-700">Email</span>
                            <p className="text-gray-600">{branch.email}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Hours */}
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700">Hours</span>
                          <p className="text-gray-600">{formattedBranch.displayHours}</p>
                        </div>
                      </div>

                      {/* Working Days */}
                      <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700">Working Days</span>
                          <p className="text-gray-600">
                            {(branch.workingDays && Array.isArray(branch.workingDays)) 
                              ? branch.workingDays.join(', ')
                              : 'Monday to Saturday'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {branch.description && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">{branch.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {branches.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No branches yet</h3>
                <p className="text-gray-600 mb-6">Get started by adding your first branch location.</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add First Branch
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManagement;