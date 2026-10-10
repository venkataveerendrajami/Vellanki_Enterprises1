import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Customer Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Customer Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderTracking from './pages/OrderTracking';
import Account from './pages/Account';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Wishlist from './pages/Wishlist';
import ProtectedRoute from './components/common/ProtectedRoute';

// Admin Components & Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminInventory from './pages/admin/AdminInventory';
import AdminOrders from './pages/admin/AdminOrders';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';

// Layout wrapper for customer-facing pages
const CustomerLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fcfdfa]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            {/* Customer Facing Routes */}
            <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
            <Route path="/shop" element={<CustomerLayout><Shop /></CustomerLayout>} />
            <Route path="/products/:idOrSlug" element={<CustomerLayout><ProductDetail /></CustomerLayout>} />
            <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
            <Route path="/checkout" element={<CustomerLayout><ProtectedRoute><Checkout /></ProtectedRoute></CustomerLayout>} />
            <Route path="/order-success/:orderId" element={<CustomerLayout><OrderSuccess /></CustomerLayout>} />
            <Route path="/orders/:orderId" element={<CustomerLayout><OrderTracking /></CustomerLayout>} />
            <Route path="/account" element={<CustomerLayout><ProtectedRoute><Account /></ProtectedRoute></CustomerLayout>} />
            <Route path="/wishlist" element={<CustomerLayout><ProtectedRoute><Wishlist /></ProtectedRoute></CustomerLayout>} />
            <Route path="/about" element={<CustomerLayout><About /></CustomerLayout>} />
            <Route path="/contact" element={<CustomerLayout><Contact /></CustomerLayout>} />
            <Route path="/login" element={<CustomerLayout><Login /></CustomerLayout>} />
            <Route path="/register" element={<CustomerLayout><Register /></CustomerLayout>} />
            <Route path="/forgot-password" element={<CustomerLayout><ForgotPassword /></CustomerLayout>} />

            {/* Admin Standalone Login */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Protected Dashboard Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Catch-all redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
