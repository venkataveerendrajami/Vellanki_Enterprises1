import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Award, Recycle, ShieldCheck, ArrowRight, HeartHandshake } from 'lucide-react';
import { settingsAPI } from '../services/api';

const About = () => {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    settingsAPI.getSettings().then((res) => {
      if (res.success && res.settings) {
        setSettings(res.settings);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="space-y-16 pb-20">
      {/* Header Banner */}
      <section className="bg-gradient-to-b from-emerald-50/70 to-white py-16 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-forest text-xs font-bold uppercase tracking-wider">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>Eco-Friendly Mission</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            About VELLANKI ENTERPRISES
          </h1>
          <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            {settings.tagline || 'Eco-Friendly Products for Every Occasion'}
          </p>
        </div>
      </section>

      {/* Main Story Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Sustainable Dining Solutions Built For Tomorrow
            </h2>
            <div className="text-gray-600 text-sm leading-relaxed space-y-4">
              <p>
                {settings.about_us || 
                  'VELLANKI ENTERPRISES is committed to providing high-quality, eco-friendly disposable products including sustainable paper plates, bowls, cups, and food packaging containers. We empower homes, events, and food businesses to embrace clean, green and sustainable dining solutions without compromising on durability or elegance.'
                }
              </p>
              <p>
                Our disposable products are crafted to offer superior rigidity, heat tolerance, and oil resistance while remaining 100% biodegradable and compostable. By choosing disposable tableware free from harmful plastic layers, our customers contribute directly to reducing plastic landfill accumulation.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl shadow-md transition-all"
              >
                <span>Browse Our Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Pillars Box */}
          <div className="bg-emerald-900 text-white p-8 sm:p-10 rounded-3xl shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-white">Our Core Commitments</h3>
            </div>

            <div className="space-y-4 text-xs text-emerald-100">
              <div className="border-b border-emerald-800 pb-3">
                <p className="font-bold text-white text-sm">Natural Biodegradability</p>
                <p className="mt-0.5 text-emerald-200/80">Tableware designed to naturally return to the soil without synthetic lingering toxins.</p>
              </div>

              <div className="border-b border-emerald-800 pb-3">
                <p className="font-bold text-white text-sm">Hygienic Food-Grade Manufacturing</p>
                <p className="mt-0.5 text-emerald-200/80">Strict adherence to sanitation standards, free from chlorine bleaching and toxic adhesives.</p>
              </div>

              <div>
                <p className="font-bold text-white text-sm">Honest Seller Direct Supply</p>
                <p className="mt-0.5 text-emerald-200/80">Direct fulfillment ensuring consistency, transparent sizing, and reliable customer service.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Value Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-forest rounded-2xl flex items-center justify-center mx-auto">
              <Recycle className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Plastic Free</h4>
            <p className="text-xs text-gray-500">Every plate and cup helps replace harmful single-use plastic and Styrofoam.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-forest rounded-2xl flex items-center justify-center mx-auto">
              <Award className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">High Quality</h4>
            <p className="text-xs text-gray-500">Extra sturdy construction designed to hold heavy, warm Indian curries and foods without bending.</p>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-forest rounded-2xl flex items-center justify-center mx-auto">
              <HeartHandshake className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Single Seller Trust</h4>
            <p className="text-xs text-gray-500">Full accountability from raw material quality to safe doorstep delivery.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
