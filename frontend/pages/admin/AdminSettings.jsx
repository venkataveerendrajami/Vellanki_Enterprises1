import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { settingsAPI } from '../../services/api';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    store_name: 'VELLANKI ENTERPRISES',
    tagline: 'Eco-Friendly Products for Every Occasion',
    phone: '+91 94943 45678',
    email: 'contact@vellankienterprises.com',
    address: 'Main Road, Industrial Estate, Andhra Pradesh, India - 530001',
    google_maps_url: 'https://maps.google.com',
    delivery_charge: '49',
    free_shipping_threshold: '499',
    about_us: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsAPI.getSettings();
      if (res.success && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const res = await settingsAPI.updateSettings(settings);
      if (res.success) {
        setMessage('Store settings updated successfully.');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Store & Delivery Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Configure business profile, public contact information, and shipping thresholds
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Branding & Contact */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="font-extrabold text-gray-900 text-base border-b border-gray-100 pb-3">
            Business Profile & Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Business Store Name</label>
              <input
                type="text"
                required
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Support Phone</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Email Address</label>
              <input
                type="email"
                required
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Business Physical Address</label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">About Us Description</label>
              <textarea
                rows={4}
                value={settings.about_us}
                onChange={(e) => setSettings({ ...settings, about_us: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
            </div>
          </div>
        </div>

        {/* Shipping & Delivery Rules */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Truck className="w-5 h-5 text-forest" />
            <h3 className="font-extrabold text-gray-900 text-base">
              Delivery Charges & Rules
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Delivery Charge (₹)</label>
              <input
                type="number"
                step="1"
                required
                value={settings.delivery_charge}
                onChange={(e) => setSettings({ ...settings, delivery_charge: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Default fee charged on orders below threshold</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Free Delivery Minimum Order (₹)</label>
              <input
                type="number"
                step="1"
                required
                value={settings.free_shipping_threshold}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">Orders equal or above this amount automatically receive Free Delivery</span>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-forest hover:bg-forest-light text-white font-bold text-sm rounded-xl shadow-md shadow-forest/20 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
