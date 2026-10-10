import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  ExternalLink,
  Plus
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getDashboardSummary();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin summary:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { sales, products, customers, recentOrders } = data || {};

  return (
    <div className="space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Store Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time analytics and operations for VELLANKI ENTERPRISES
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/products"
            className="px-4 py-2.5 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
          <Link
            to="/admin/orders"
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner if products with stock <= 10 exist */}
      {products?.lowStockList && products.lowStockList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span>Low-Stock Inventory Alert ({products.lowStockList.length} items low)</span>
            </div>
            <Link
              to="/admin/inventory"
              className="text-xs font-bold text-amber-800 hover:underline flex items-center gap-1"
            >
              <span>Restock in Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {products.lowStockList.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <p className="font-bold text-gray-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400 font-mono">SKU: {item.sku}</p>
                </div>
                <span className="px-2.5 py-1 bg-red-100 text-red-700 font-black rounded-lg shrink-0">
                  {item.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. SALES METRIC CARDS */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Sales & Revenue Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Today's Sales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-forest flex items-center justify-center font-bold text-xs">
                ₹
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">₹{sales?.todayRevenue || 0}</p>
            <p className="text-xs text-gray-500 font-medium">{sales?.todayOrders || 0} orders today</p>
          </div>

          {/* This Week's Sales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">This Week (7 Days)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-forest flex items-center justify-center font-bold text-xs">
                7D
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">₹{sales?.weekRevenue || 0}</p>
            <p className="text-xs text-gray-500 font-medium">{sales?.weekOrders || 0} orders this week</p>
          </div>

          {/* This Month's Sales */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs font-bold uppercase tracking-wider">This Month (30 Days)</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-forest flex items-center justify-center font-bold text-xs">
                30D
              </div>
            </div>
            <p className="text-2xl font-black text-gray-900">₹{sales?.monthRevenue || 0}</p>
            <p className="text-xs text-gray-500 font-medium">{sales?.monthOrders || 0} orders this month</p>
          </div>

          {/* Total Lifetime Sales */}
          <div className="bg-forest rounded-2xl p-5 shadow-md shadow-forest/10 space-y-2 text-white">
            <div className="flex items-center justify-between text-emerald-200">
              <span className="text-xs font-bold uppercase tracking-wider">Total Lifetime Sales</span>
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-white">₹{sales?.totalRevenue || 0}</p>
            <p className="text-xs text-emerald-100 font-medium">{sales?.totalOrders || 0} total lifetime orders</p>
          </div>

        </div>
      </div>

      {/* 2. ORDER BREAKDOWN & PRODUCT/CUSTOMER METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm">Order Status Summary</h3>
            <Link to="/admin/orders" className="text-xs font-bold text-forest hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-amber-50/60 rounded-xl text-amber-900">
              <span className="flex items-center gap-2 font-medium">
                <Clock className="w-4 h-4 text-amber-600" />
                Pending Orders
              </span>
              <span className="font-extrabold text-sm">{sales?.pendingOrders || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl text-emerald-900">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Delivered Orders
              </span>
              <span className="font-extrabold text-sm">{sales?.deliveredOrders || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-red-50/60 rounded-xl text-red-900">
              <span className="flex items-center gap-2 font-medium">
                <XCircle className="w-4 h-4 text-red-600" />
                Cancelled Orders
              </span>
              <span className="font-extrabold text-sm">{sales?.cancelledOrders || 0}</span>
            </div>
          </div>
        </div>

        {/* Product Catalog Summary */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm">Product Catalog</h3>
            <Link to="/admin/products" className="text-xs font-bold text-forest hover:underline">
              Manage
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-gray-700">
              <span className="font-medium">Total Products</span>
              <span className="font-extrabold text-sm text-gray-900">{products?.total || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl text-emerald-900">
              <span className="font-medium">Active In-Store</span>
              <span className="font-extrabold text-sm text-emerald-800">{products?.active || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-red-50/60 rounded-xl text-red-900">
              <span className="font-medium">Out of Stock</span>
              <span className="font-extrabold text-sm text-red-700">{products?.outOfStock || 0}</span>
            </div>
          </div>
        </div>

        {/* Customer Summary */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-bold text-gray-900 text-sm">Customer Base</h3>
            <Link to="/admin/customers" className="text-xs font-bold text-forest hover:underline">
              View Directory
            </Link>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-gray-700">
              <span className="font-medium">Registered Customers</span>
              <span className="font-extrabold text-sm text-gray-900">{customers?.total || 0}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-emerald-50/60 rounded-xl text-emerald-900">
              <span className="font-medium">New Customers (30 Days)</span>
              <span className="font-extrabold text-sm text-emerald-800">{customers?.newLast30Days || 0}</span>
            </div>

            <div className="p-3 bg-forest/5 rounded-xl border border-forest/10 text-[11px] text-gray-600 leading-relaxed">
              Customers purchase directly from VELLANKI ENTERPRISES with zero 3rd-party seller intermediaries.
            </div>
          </div>
        </div>

      </div>

      {/* 3. RECENT ORDERS TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Recent Customer Orders</h3>
            <p className="text-xs text-gray-400">Latest transactions through the store</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-forest hover:underline flex items-center gap-1"
          >
            <span>See all orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="pb-3 font-semibold">Order Number</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Total</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80">
                    <td className="py-3 font-mono font-bold text-forest">#{ord.order_number}</td>
                    <td className="py-3 font-semibold text-gray-800">{ord.customer_name}</td>
                    <td className="py-3 text-gray-500">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 font-extrabold text-gray-900">₹{ord.total_amount}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.order_status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.order_status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.order_status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/admin/orders?order=${ord.order_number}`}
                        className="text-xs font-bold text-forest hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400 text-xs">
            No orders placed yet. Orders will appear here as customers complete checkout.
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminDashboard;
