import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Package, 
  Calendar, 
  DollarSign, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { analyticsAPI } from '../../services/api';

const AdminAnalytics = () => {
  const [range, setRange] = useState('30d'); // '7d', '30d', '90d', '1y'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [range]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getSalesAnalytics({ range });
      if (res.success) {
        setAnalytics(res);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const { aggregates, dailyData = [], topProducts = [] } = analytics || {};

  return (
    <div className="space-y-8">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Sales & Revenue Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Performance charts, revenue trends, and best-selling eco products
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-200 shadow-sm">
          {[
            { id: '7d', label: '7 Days (Weekly)' },
            { id: '30d', label: '30 Days (Monthly)' },
            { id: '90d', label: '90 Days' },
            { id: '1y', label: '1 Year' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setRange(btn.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                range === btn.id
                  ? 'bg-forest text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate Cards for Selected Range */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue in Period</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-forest flex items-center justify-center font-bold text-xs">
              ₹
            </div>
          </div>
          <p className="text-3xl font-black text-forest">₹{aggregates?.totalRevenue || 0}</p>
          <p className="text-xs text-gray-500 font-medium">From successful completed orders</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Orders in Period</span>
            <ShoppingBag className="w-5 h-5 text-forest" />
          </div>
          <p className="text-3xl font-black text-gray-900">{aggregates?.totalOrders || 0}</p>
          <p className="text-xs text-gray-500 font-medium">Customer orders placed</p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Products Sold</span>
            <Package className="w-5 h-5 text-forest" />
          </div>
          <p className="text-3xl font-black text-gray-900">{aggregates?.productsSold || 0}</p>
          <p className="text-xs text-gray-500 font-medium">Total individual units dispatched</p>
        </div>
      </div>

      {/* REVENUE OVER TIME CHART */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Revenue Timeline</h3>
            <p className="text-xs text-gray-400">Daily sales trend for selected range</p>
          </div>
          <span className="text-xs font-bold text-forest bg-emerald-50 px-3 py-1 rounded-full">
            ₹ Trend Line
          </span>
        </div>

        <div className="h-72 w-full">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1b4332" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1b4332" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1b4332" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              No sales recorded for this date range yet.
            </div>
          )}
        </div>
      </div>

      {/* ORDERS VOLUME BAR CHART */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-base">Order Volume</h3>
            <p className="text-xs text-gray-400">Total orders received per day</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
            Orders Count
          </span>
        </div>

        <div className="h-64 w-full">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  formatter={(val) => [`${val} orders`, 'Orders']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="orders" fill="#52b788" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              No orders recorded for this date range yet.
            </div>
          )}
        </div>
      </div>

      {/* TOP SELLING PRODUCTS */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="font-extrabold text-gray-900 text-base border-b border-gray-100 pb-4">
          Top-Selling Eco Products
        </h3>

        {topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-semibold">Rank</th>
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold">Units Sold</th>
                  <th className="pb-3 font-semibold text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topProducts.map((p, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 font-bold text-gray-400">#{index + 1}</td>
                    <td className="py-3 font-bold text-gray-900">{p.product_name}</td>
                    <td className="py-3 text-forest font-extrabold">{p.units_sold} units</td>
                    <td className="py-3 font-black text-gray-900 text-right">₹{p.total_sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-xs">
            No sales data available to rank top-selling products yet.
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAnalytics;
