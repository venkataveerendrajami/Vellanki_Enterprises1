import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { addressAPI } from '../../services/api';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
];

const AddressModal = ({ isOpen, onClose, addressToEdit, onAddressSaved }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    house_building: '',
    street: '',
    city: '',
    district: '',
    state: 'Andhra Pradesh',
    pincode: '',
    is_default: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        name: addressToEdit.name || '',
        phone: addressToEdit.phone || '',
        house_building: addressToEdit.house_building || '',
        street: addressToEdit.street || '',
        city: addressToEdit.city || '',
        district: addressToEdit.district || '',
        state: addressToEdit.state || 'Andhra Pradesh',
        pincode: addressToEdit.pincode || '',
        is_default: !!addressToEdit.is_default
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        house_building: '',
        street: '',
        city: '',
        district: '',
        state: 'Andhra Pradesh',
        pincode: '',
        is_default: false
      });
    }
    setError('');
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!formData.name.trim() || !formData.phone.trim() || !formData.house_building.trim() ||
        !formData.street.trim() || !formData.city.trim() || !formData.district.trim() ||
        !formData.pincode.trim()) {
      setError('Please fill in all required address fields.');
      return;
    }

    try {
      setLoading(true);
      if (addressToEdit && addressToEdit.id) {
        await addressAPI.updateAddress(addressToEdit.id, formData);
      } else {
        await addressAPI.createAddress(formData);
      }
      onAddressSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2 text-forest">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-lg text-gray-900">
              {addressToEdit ? 'Edit Delivery Address' : 'Add New Delivery Address'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Receiver's Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Flat / House No. / Building Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Flat 302, Green Meadows"
              value={formData.house_building}
              onChange={(e) => setFormData({ ...formData, house_building: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Street / Colony / Area *</label>
            <input
              type="text"
              required
              placeholder="e.g. Market Road, Near Gandhi Statue"
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City / Town / Village *</label>
              <input
                type="text"
                required
                placeholder="City / Village"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">District *</label>
              <input
                type="text"
                required
                placeholder="District"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">State *</label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest bg-white"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">PIN Code *</label>
              <input
                type="text"
                required
                maxLength="6"
                placeholder="6-digit PIN"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 text-forest rounded focus:ring-forest"
              />
              <span>Set as default delivery address</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold bg-forest hover:bg-forest-light text-white rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
