import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ShoppingBag, 
  Search, 
  User, 
  Menu, 
  X, 
  Leaf, 
  LogOut, 
  Package, 
  ShieldCheck, 
  ChevronDown,
  Heart
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop Products', path: '/shop' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all">
      {/* Top Notification Bar */}
      <div className="bg-forest text-white py-1.5 px-4 text-xs font-medium text-center flex items-center justify-center gap-2">
        <Leaf className="w-3.5 h-3.5 text-emerald-400" />
        <span>100% Eco-Friendly, Biodegradable & Compostable Disposables | Free Delivery on Orders Over ₹499</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-11 h-11 rounded-xl bg-forest flex items-center justify-center text-white shadow-md shadow-forest/20 group-hover:scale-105 transition-transform">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-forest block leading-none">
                VELLANKI
              </span>
              <span className="text-[11px] font-bold tracking-widest text-emerald-700 block uppercase mt-0.5">
                ENTERPRISES
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search paper plates, cups, packaging..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-forest focus:ring-2 focus:ring-forest/10 focus:bg-white transition-all placeholder:text-gray-400"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`text-sm font-semibold transition-colors ${
                  isActive(link.path) 
                    ? 'text-forest border-b-2 border-forest pb-0.5' 
                    : 'text-gray-600 hover:text-forest'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Buttons: Wishlist, Cart & User Account */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2.5 rounded-xl text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center"
              aria-label="View Saved Wishlist"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-gray-700 hover:text-forest hover:bg-emerald-50 transition-colors flex items-center"
              aria-label="View Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-forest text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* User Account / Auth Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-gray-200 hover:border-forest text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-forest flex items-center justify-center font-bold text-xs">
                    {user?.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-800 hover:bg-emerald-50 font-semibold"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Admin Dashboard
                      </Link>
                    )}

                    <Link
                      to="/account?tab=orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Package className="w-4 h-4 text-gray-500" />
                      My Orders
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Heart className="w-4 h-4 text-red-500" />
                      My Wishlist
                    </Link>

                    <Link
                      to="/account?tab=profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      My Profile & Addresses
                    </Link>

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                          navigate('/');
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-forest hover:bg-emerald-50 rounded-xl transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold bg-forest hover:bg-forest-light text-white rounded-xl shadow-sm transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-forest rounded-xl"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search eco plates, cups, containers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:border-forest"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top duration-200">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-xl text-base font-semibold ${
                  isActive(link.path)
                    ? 'bg-emerald-50 text-forest'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-emerald-800 font-semibold bg-emerald-50"
                  >
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/account?tab=orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-50 font-medium"
                >
                  <Package className="w-5 h-5 text-gray-500" />
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/');
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-xl font-medium"
                >
                  <LogOut className="w-5 h-5 text-red-500" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold border border-forest text-forest rounded-xl"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 text-sm font-semibold bg-forest text-white rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
