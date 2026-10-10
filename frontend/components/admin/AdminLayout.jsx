import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Leaf,
  ShieldCheck
} from 'lucide-react';

const AdminLayout = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    navigate('/admin/login', { replace: true, state: { from: location } });
    return null;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Categories', path: '/admin/categories', icon: Layers },
    { name: 'Inventory', path: '/admin/inventory', icon: Boxes },
    { name: 'Orders & Delivery', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Sales Analytics', path: '/admin/analytics', icon: TrendingUp },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Store Settings', path: '/admin/settings', icon: Settings },
  ];

  const isCurrentActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-forest-dark text-white flex flex-col transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-forest/50">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-light flex items-center justify-center text-white">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block leading-none">
                VELLANKI
              </span>
              <span className="text-[10px] tracking-widest text-emerald-400 font-bold uppercase block mt-1">
                Admin Console
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrentActive(item);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-forest/50 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-emerald-400/80'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / User Profile & Store Link */}
        <div className="p-4 border-t border-forest/50 space-y-2">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-forest/40 hover:bg-forest/70 text-slate-200 text-xs font-semibold transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              Customer Website
            </span>
            <span className="text-[10px] bg-forest text-emerald-300 px-2 py-0.5 rounded-full">Live</span>
          </Link>

          <div className="pt-2 flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-xl"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              VELLANKI ENTERPRISES — Administration
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Single Seller Store
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
