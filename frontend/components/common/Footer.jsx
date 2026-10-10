import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { settingsAPI } from '../../services/api';

const Footer = () => {
  const [settings, setSettings] = useState({
    store_name: 'VELLANKI ENTERPRISES',
    phone: '+91 94943 45678',
    email: 'contact@vellankienterprises.com',
    address: 'Main Road, Industrial Estate, Andhra Pradesh, India - 530001'
  });

  useEffect(() => {
    settingsAPI.getSettings().then((res) => {
      if (res.success && res.settings) {
        setSettings((prev) => ({ ...prev, ...res.settings }));
      }
    }).catch(() => {});
  }, []);
  return (
    <footer className="bg-forest-dark text-slate-300 mt-auto border-t border-forest">
      {/* Brand value pillars */}
      <div className="border-b border-forest/40 py-10 bg-forest/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Leaf className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">100% Eco-Friendly</h4>
              <p className="text-xs text-slate-400 mt-0.5">Compostable & Biodegradable Materials</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Food Grade Certified</h4>
              <p className="text-xs text-slate-400 mt-0.5">Hygienic, Chemical-Free & Safe</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Fast Reliable Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">Safely packed & tracked to your door</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Razorpay Secure</h4>
              <p className="text-xs text-slate-400 mt-0.5">UPI, Cards, NetBanking & Wallets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-light flex items-center justify-center text-white">
                <Leaf className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight text-white block">
                  VELLANKI ENTERPRISES
                </span>
                <span className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase block">
                  Eco Disposable Products
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Leading the shift towards sustainable living with premium quality eco-friendly disposable plates, cups, bowls, and food packaging products for homes, events, and food businesses.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-emerald-400 transition-colors">Home Page</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-emerald-400 transition-colors">Shop All Products</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 transition-colors">About VELLANKI</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-400 transition-colors">Contact Us & Support</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-emerald-400 transition-colors">Shopping Cart</Link>
              </li>
            </ul>
          </div>

          {/* Customer Area */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/account?tab=orders" className="hover:text-emerald-400 transition-colors">Track My Order</Link>
              </li>
              <li>
                <Link to="/account?tab=profile" className="hover:text-emerald-400 transition-colors">Saved Addresses</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-emerald-400 transition-colors">Customer Login</Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-emerald-400 transition-colors">Create Account</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-emerald-400 transition-colors text-xs text-slate-500 hover:text-slate-300">
                  Staff / Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-sm tracking-wider uppercase mb-4">Store Information</h4>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{settings.address || 'Main Road, Industrial Estate, Andhra Pradesh, India - 530001'}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`tel:${settings.phone || '+919494345678'}`} className="hover:text-emerald-400 transition-colors">
                  {settings.phone || '+91 94943 45678'}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${settings.email || 'contact@vellankienterprises.com'}`} className="truncate hover:text-emerald-400 transition-colors">
                  {settings.email || 'contact@vellankienterprises.com'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-forest/40 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} VELLANKI ENTERPRISES. All Rights Reserved. Eco-Friendly Products for Every Occasion.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Powered by Razorpay Payments</span>
            <span>•</span>
            <span>Made with sustainable pride</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
