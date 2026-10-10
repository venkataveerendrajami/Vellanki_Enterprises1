import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Package, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Key,
  ShoppingBag,
  ExternalLink,
  Heart,
  Phone,
  Mail,
  PhoneCall,
  MessageSquare,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ordersAPI, addressAPI, authAPI, wishlistAPI } from '../services/api';
import AddressModal from '../components/customer/AddressModal';
import EmptyState from '../components/common/EmptyState';

const Account = () => {
  const { 
    user, 
    logout, 
    reloadProfile, 
    sendOtp, 
    verifyPhone, 
    verifyEmail, 
    changePhone, 
    changeEmail, 
    changePassword 
  } = useAuth();
  const { addToCart } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get('tab') || 'orders';

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState(null);

  // Wishlist State
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);
  const [addingWishlistId, setAddingWishlistId] = useState(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState('');

  // Modals for Phone/Email verification and changes
  const [verifyModal, setVerifyModal] = useState({ open: false, type: 'phone', step: 1, target: '' });
  const [changeModal, setChangeModal] = useState({ open: false, type: 'phone', step: 1, newTarget: '', channel: 'both' });
  const [modalOtpCode, setModalOtpCode] = useState(['', '', '', '', '', '']);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [modalCountdown, setModalCountdown] = useState(0);

  // Incoming Call Simulation State
  const [simulationInfo, setSimulationInfo] = useState(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  useEffect(() => {
    let timer;
    if (modalCountdown > 0) {
      timer = setInterval(() => setModalCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [modalCountdown]);

  useEffect(() => {
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'addresses') loadAddresses();
    if (activeTab === 'wishlist') loadWishlist();
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await ordersAPI.getMyOrders();
      if (res.success) setOrders(res.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await addressAPI.getAddresses();
      if (res.success) setAddresses(res.addresses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const loadWishlist = async () => {
    try {
      setLoadingWishlist(true);
      const res = await wishlistAPI.getWishlist();
      if (res.success) setWishlist(res.wishlist || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWishlist(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileMessage('');
      const res = await authAPI.updateProfile({ name: profileName });
      if (res.success) {
        setProfileMessage('Profile name updated successfully.');
        reloadProfile();
      }
    } catch (err) {
      setProfileMessage(err.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setPasswordMessage('');
      const res = await authAPI.changePassword(passwordData);
      if (res.success) {
        setPasswordMessage('Password changed successfully.');
        setPasswordData({ currentPassword: '', newPassword: '' });
      }
    } catch (err) {
      setPasswordMessage(err.message || 'Failed to change password.');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await addressAPI.deleteAddress(id);
      loadAddresses();
    } catch (e) {
      alert('Could not delete address');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await addressAPI.setDefault(id);
      loadAddresses();
    } catch (e) {
      alert('Could not set default address');
    }
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((item) => item.id !== productId));
    } catch (e) {
      alert('Could not remove from wishlist');
    }
  };

  const handleAddToCartFromWishlist = async (product) => {
    try {
      setAddingWishlistId(product.id);
      await addToCart(product.id, null, 1);
      await wishlistAPI.removeFromWishlist(product.id);
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
    } catch (err) {
      alert(err.message || 'Could not add to cart.');
    } finally {
      setAddingWishlistId(null);
    }
  };

  // ==========================================
  // OTP Verification & Contact Change Handlers
  // ==========================================
  const handleOpenVerifyModal = async (type) => {
    const target = type === 'phone' ? user?.phone : user?.email;
    if (!target) {
      alert(`No ${type} linked to this account. Please add one first.`);
      return;
    }

    setVerifyModal({ open: true, type, step: 2, target });
    setModalOtpCode(['', '', '', '', '', '']);
    setModalError('');
    setModalSuccess('');
    setModalCountdown(30);

    const channel = type === 'phone' ? 'both' : 'email';
    const purpose = type === 'phone' ? 'verify_phone' : 'verify_email';

    try {
      setModalLoading(true);
      const res = await sendOtp(target, channel, purpose);
      setModalSuccess(res.message);
      if (res.simulated) {
        setSimulationInfo({
          previewOtp: res.previewOtp,
          voiceScript: res.voiceScript,
          smsText: res.smsText,
          emailSubject: res.emailSubject,
          channel,
          maskedTarget: res.maskedTarget || target
        });
        if ((channel === 'call' || channel === 'both') && res.voiceScript) {
          setIsCallModalOpen(true);
        }
      }
    } catch (err) {
      setModalError(err.message || 'Could not send verification code.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmVerify = async () => {
    const code = modalOtpCode.join('');
    if (code.length !== 6) {
      setModalError('Please enter all 6 digits of the OTP.');
      return;
    }

    try {
      setModalLoading(true);
      setModalError('');
      if (verifyModal.type === 'phone') {
        const res = await verifyPhone(code);
        setModalSuccess(res.message || 'Mobile number verified!');
      } else {
        const res = await verifyEmail(code);
        setModalSuccess(res.message || 'Email verified!');
      }
      reloadProfile();
      setTimeout(() => setVerifyModal({ open: false, type: 'phone', step: 1, target: '' }), 1500);
    } catch (err) {
      setModalError(err.message || 'Verification failed.');
    } finally {
      setModalLoading(false);
    }
  };

  // Change Phone or Email Modal Handlers
  const handleStartChangeContact = (type) => {
    setChangeModal({ open: true, type, step: 1, newTarget: '', channel: type === 'phone' ? 'both' : 'email' });
    setModalOtpCode(['', '', '', '', '', '']);
    setModalError('');
    setModalSuccess('');
  };

  const handleSendChangeOtp = async () => {
    const cleanTarget = changeModal.newTarget.trim();
    if (!cleanTarget) {
      setModalError(`Please enter a valid new ${changeModal.type === 'phone' ? 'mobile number' : 'email address'}.`);
      return;
    }

    setModalError('');
    setModalSuccess('');

    const channel = changeModal.type === 'phone' ? changeModal.channel : 'email';
    const purpose = changeModal.type === 'phone' ? 'verify_phone' : 'verify_email';

    try {
      setModalLoading(true);
      const res = await sendOtp(cleanTarget, channel, purpose);
      setChangeModal((prev) => ({ ...prev, step: 2 }));
      setModalCountdown(30);
      setModalSuccess(res.message);

      if (res.simulated) {
        setSimulationInfo({
          previewOtp: res.previewOtp,
          voiceScript: res.voiceScript,
          smsText: res.smsText,
          emailSubject: res.emailSubject,
          channel,
          maskedTarget: res.maskedTarget || cleanTarget
        });
        if ((channel === 'call' || channel === 'both') && res.voiceScript) {
          setIsCallModalOpen(true);
        }
      }
    } catch (err) {
      setModalError(err.message || 'Could not send verification code.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmChangeContact = async () => {
    const code = modalOtpCode.join('');
    if (code.length !== 6) {
      setModalError('Please enter all 6 digits of the OTP.');
      return;
    }

    try {
      setModalLoading(true);
      setModalError('');
      if (changeModal.type === 'phone') {
        const res = await changePhone(changeModal.newTarget, code);
        setModalSuccess(res.message || 'Mobile number updated and verified!');
      } else {
        const res = await changeEmail(changeModal.newTarget, code);
        setModalSuccess(res.message || 'Email updated and verified!');
      }
      reloadProfile();
      setTimeout(() => setChangeModal({ open: false, type: 'phone', step: 1, newTarget: '', channel: 'both' }), 1500);
    } catch (err) {
      setModalError(err.message || 'Failed to update contact detail.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...modalOtpCode];
    newOtp[index] = value.slice(-1);
    setModalOtpCode(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`modal-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !modalOtpCode[index] && index > 0) {
      const prevInput = document.getElementById(`modal-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Account Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-forest flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-gray-900">{user?.name}</h1>
            <p className="text-xs text-gray-500">
              {user?.email} • {user?.phone || 'No phone set'}
            </p>
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start pt-1">
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                VELLANKI Customer
              </span>

              {/* Mobile Verification Badge */}
              {user?.phone_verified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✓ Mobile Verified</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenVerifyModal('phone')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-200 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verify Mobile (OTP)</span>
                </button>
              )}

              {/* Email Verification Badge */}
              {user?.email_verified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>✓ Email Verified</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenVerifyModal('email')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-200 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verify Email (OTP)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="px-5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors shrink-0"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setSearchParams({ tab: 'orders' })}
          className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'orders'
              ? 'border-b-2 border-forest text-forest'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>My Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'wishlist' })}
          className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'wishlist'
              ? 'border-b-2 border-forest text-forest'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Wishlist ({wishlist.length})</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'addresses' })}
          className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'addresses'
              ? 'border-b-2 border-forest text-forest'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Saved Addresses</span>
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'profile' })}
          className={`pb-3 flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'profile'
              ? 'border-b-2 border-forest text-forest'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Security</span>
        </button>
      </div>

      {/* Tab 1: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {loadingOrders ? (
            <div className="p-12 text-center text-gray-400">Loading your orders...</div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No orders placed yet"
              description="Your order history will appear here once you place your first order."
              actionText="Shop Now"
              actionLink="/shop"
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-gray-900 text-sm">
                        Order #{order.order_number}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        order.order_status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.order_status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Placed on {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 1} items
                    </p>
                    <p className="text-xs font-semibold text-gray-700">
                      Total: ₹{order.total_amount}
                    </p>
                  </div>

                  <Link
                    to={`/orders/${order.order_number}`}
                    className="px-4 py-2 bg-gray-50 hover:bg-forest hover:text-white text-gray-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-gray-200"
                  >
                    <span>Track Order</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-4">
          {loadingWishlist ? (
            <div className="p-12 text-center text-gray-400">Loading your saved items...</div>
          ) : wishlist.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Save your favorite eco-friendly tableware items here to order them whenever you're ready."
              actionText="Explore Catalog"
              actionLink="/shop"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden mb-3 group">
                      <img
                        src={item.image || '/placeholder-product.png'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        onClick={() => handleRemoveWishlist(item.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow hover:bg-white"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <Link to={`/products/${item.slug || item.id}`}>
                      <h4 className="font-bold text-gray-900 text-sm hover:text-forest line-clamp-1">
                        {item.name}
                      </h4>
                    </Link>
                    <p className="text-xs font-black text-forest mt-1">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => handleAddToCartFromWishlist(item)}
                    disabled={addingWishlistId === item.id}
                    className="mt-3 w-full py-2 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{addingWishlistId === item.id ? 'Adding...' : 'Move to Cart'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Saved Addresses */}
      {activeTab === 'addresses' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">Your Delivery Addresses</h2>
            <button
              onClick={() => {
                setAddressToEdit(null);
                setIsAddressModalOpen(true);
              }}
              className="px-4 py-2 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Address</span>
            </button>
          </div>

          {loadingAddresses ? (
            <div className="p-12 text-center text-gray-400">Loading addresses...</div>
          ) : addresses.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No saved addresses"
              description="Add your delivery address to speed up your checkout process."
              actionText="Add Delivery Address"
              onAction={() => setIsAddressModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white rounded-3xl border p-5 shadow-sm space-y-3 relative ${
                    addr.is_default === 1 ? 'border-forest ring-1 ring-forest/20' : 'border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{addr.full_name}</span>
                        {addr.is_default === 1 && (
                          <span className="text-[10px] bg-emerald-100 text-forest font-bold px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      {addr.address_type}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    {addr.address_line1}, {addr.address_line2 ? `${addr.address_line2}, ` : ''}
                    {addr.landmark ? `Near ${addr.landmark}, ` : ''}
                    {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                  </p>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    {addr.is_default !== 1 ? (
                      <button
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="text-forest hover:underline font-semibold"
                      >
                        Set as Default
                      </button>
                    ) : <span></span>}

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          setAddressToEdit(addr);
                          setIsAddressModalOpen(true);
                        }}
                        className="text-gray-500 hover:text-gray-900 flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Profile Settings & Security */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Profile details */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-900 text-base">Personal Information</h3>
            {profileMessage && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl font-medium">
                {profileMessage}
              </p>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              {/* Mobile Number (Standard shipping contact) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Mobile Number <span className="text-gray-400 font-normal">(For delivery & order updates)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={user?.phone || ''}
                    placeholder="+91 98765 43210"
                    onChange={(e) => {
                      if (user) user.phone = e.target.value;
                    }}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              {/* Email Address with Brevo Verification Status & Change Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Email Address</label>
                  <button
                    type="button"
                    onClick={() => handleStartChangeContact('email')}
                    className="text-xs font-bold text-forest hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-24 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                  />
                  <div className="absolute right-2.5">
                    {user?.email_verified ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenVerifyModal('email')}
                        className="text-[11px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Email</span>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Protected with Brevo Transactional Email Verification
                </p>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Save Profile
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-900 text-base">Security & Password</h3>
            {passwordMessage && (
              <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl font-medium">
                {passwordMessage}
              </p>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Minimum 6 characters long</span>
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Address Edit/Add Modal */}
      {isAddressModalOpen && (
        <AddressModal
          isOpen={isAddressModalOpen}
          onClose={() => setIsAddressModalOpen(false)}
          addressToEdit={addressToEdit}
          onAddressSaved={loadAddresses}
        />
      )}

      {/* Modal 1: Verify Existing Email */}
      {verifyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-forest" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Verify Email Address
                </h3>
              </div>
              <button
                onClick={() => setVerifyModal({ open: false, type: 'email', step: 1, target: '' })}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <p className="text-xs text-gray-500">
              A 6-digit verification code has been dispatched to <strong>{verifyModal.target}</strong> via Brevo. Please enter it below:
            </p>

            <div className="flex justify-between gap-1.5">
              {modalOtpCode.map((d, idx) => (
                <input
                  key={idx}
                  id={`modal-otp-${idx}`}
                  type="text"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                  className="w-10 h-12 text-center text-lg font-black border-2 border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleConfirmVerify}
              disabled={modalLoading || modalOtpCode.join('').length !== 6}
              className="w-full py-3 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
            >
              {modalLoading ? 'Verifying...' : 'Verify & Confirm'}
            </button>
          </div>
        </div>
      )}

      {/* Modal 2: Change Email Address */}
      {changeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full space-y-5 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-forest" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Change Email Address
                </h3>
              </div>
              <button
                onClick={() => setChangeModal({ open: false, type: 'email', step: 1, newTarget: '', channel: 'email' })}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{modalSuccess}</span>
              </div>
            )}

            {changeModal.step === 1 ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    New Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={changeModal.newTarget}
                    onChange={(e) => setChangeModal({ ...changeModal, newTarget: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    We will send a verification code via Brevo to verify this new email.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSendChangeOtp}
                  disabled={modalLoading || !changeModal.newTarget.trim()}
                  className="w-full py-3 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {modalLoading ? 'Sending Code...' : 'Send Verification OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-gray-500">
                  Enter the 6-digit code sent to <strong>{changeModal.newTarget}</strong>:
                </p>

                <div className="flex justify-between gap-1.5">
                  {modalOtpCode.map((d, idx) => (
                    <input
                      key={idx}
                      id={`modal-otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className="w-10 h-12 text-center text-lg font-black border-2 border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleConfirmChangeContact}
                  disabled={modalLoading || modalOtpCode.join('').length !== 6}
                  className="w-full py-3 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : 'Verify & Update Email'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
