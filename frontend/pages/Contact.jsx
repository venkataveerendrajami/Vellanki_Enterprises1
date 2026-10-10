import React, { useState, useEffect } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { settingsAPI } from '../services/api';

const Contact = () => {
  const [settings, setSettings] = useState({});
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    settingsAPI.getSettings().then((res) => {
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatusMessage({ type: '', text: '' });
      const res = await settingsAPI.submitContact(formData);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message });
        setFormData({ name: '', email: '', phone: '', message: '' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to send message.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
          Contact VELLANKI ENTERPRISES
        </h1>
        <p className="text-sm text-gray-600">
          Have an inquiry regarding our eco-friendly disposable products or bulk order requirements? Reach out to our dedicated support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Contact Info (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="font-extrabold text-xl text-gray-900 border-b border-gray-100 pb-4">
              Get in Touch
            </h3>

            <div className="space-y-5 text-sm text-gray-700">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-forest flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider text-gray-400">Head Office & Works:</span>
                  <p className="mt-0.5 leading-relaxed font-medium">
                    {settings.address || 'Main Road, Industrial Estate, Andhra Pradesh, India - 530001'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-forest flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider text-gray-400">Direct Phone:</span>
                  <a href={`tel:${settings.phone || '+919494345678'}`} className="font-bold text-forest hover:underline">
                    {settings.phone || '+91 94943 45678'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-forest flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider text-gray-400">Email Address:</span>
                  <a href={`mailto:${settings.email || 'contact@vellankienterprises.com'}`} className="font-semibold text-gray-800 hover:text-forest">
                    {settings.email || 'contact@vellankienterprises.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-forest flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 block text-xs uppercase tracking-wider text-gray-400">Working Hours:</span>
                  <p className="font-medium text-gray-700">Monday – Saturday: 9:00 AM – 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Maps Embed / Link */}
          <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-sm overflow-hidden">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3 px-2">Store Location Map</h4>
            <div className="aspect-video w-full rounded-2xl bg-gray-100 overflow-hidden relative border border-gray-200 flex items-center justify-center text-center p-4">
              <iframe
                title="Vellanki Enterprises Location"
                src="https://maps.google.com/maps?q=Andhra%20Pradesh%20India&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen=""
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Contact Form (7 Columns) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-10 shadow-sm space-y-6">
            <div>
              <h3 className="text-xl font-black text-gray-900">Send Us an Inquiry</h3>
              <p className="text-xs text-gray-500 mt-1">
                Fill out the form below and we will respond to your queries as soon as possible.
              </p>
            </div>

            {statusMessage.text && (
              <div className={`p-4 rounded-2xl flex items-center gap-2 text-xs font-semibold ${
                statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
              }`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh V"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 Mobile Number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Your Message or Order Query *</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Tell us what eco-friendly products or sizes you are looking for..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Sending Inquiry...' : 'Submit Message'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
