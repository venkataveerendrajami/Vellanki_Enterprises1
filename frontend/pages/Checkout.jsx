import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, 
  Plus, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle,
  Truck,
  ArrowLeft
} from 'lucide-react';
import { addressAPI, ordersAPI, paymentAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressModal from '../components/customer/AddressModal';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, summary, fetchCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [pendingRazorpayOrder, setPendingRazorpayOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    loadAddresses();
  }, [isAuthenticated, items.length]);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await addressAPI.getAddresses();
      if (res.success && res.addresses) {
        setAddresses(res.addresses);
        // Default to the first or default address
        const defaultAddr = res.addresses.find((a) => a.is_default) || res.addresses[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      }
    } catch (err) {
      console.error('Failed to load delivery addresses:', err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handlePlaceOrderWithPayment = async () => {
    if (!selectedAddressId) {
      setErrorMessage('Please select or add a delivery address to continue.');
      return;
    }

    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddress) {
      setErrorMessage('Delivery address not found.');
      return;
    }

    try {
      setProcessingPayment(true);
      setErrorMessage('');

      // 1. Get payment configuration (keyId and test mode status)
      const configRes = await paymentAPI.getConfig();
      const { keyId, isMock } = configRes;

      // 2. Create Razorpay order on backend
      const rzpOrderRes = await paymentAPI.createOrder({
        amount: summary.grandTotal,
        notes: {
          addressId: selectedAddressId,
          customerName: selectedAddress.name
        }
      });

      const rzpOrder = rzpOrderRes.order;

      // 3. If real Razorpay SDK is loaded & not mock, open official Razorpay checkout
      if (window.Razorpay && !isMock) {
        const options = {
          key: keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: 'VELLANKI ENTERPRISES',
          description: 'Payment for Eco-Friendly Disposables Order',
          order_id: rzpOrder.id,
          handler: async function (response) {
            try {
              // Place order on backend with cryptographic proof
              const orderRes = await ordersAPI.placeOrder({
                addressId: selectedAddressId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentMethod: 'Razorpay Online'
              });

              if (orderRes.success && orderRes.order) {
                await fetchCart();
                navigate(`/order-success/${orderRes.order.order_number}`);
              }
            } catch (err) {
              setErrorMessage(err.message || 'Payment confirmation failed.');
              setProcessingPayment(false);
            }
          },
          prefill: {
            name: selectedAddress.name,
            email: user?.email,
            contact: selectedAddress.phone
          },
          theme: {
            color: '#1b4332'
          },
          modal: {
            ondismiss: function () {
              setProcessingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setErrorMessage(`Payment failed: ${response.error.description}`);
          setProcessingPayment(false);
        });
        rzp.open();
      } else {
        // Mock / Development Simulation Modal
        setPendingRazorpayOrder(rzpOrder);
        setShowSimulatedModal(true);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Could not initiate Razorpay payment.');
      setProcessingPayment(false);
    }
  };

  const handleCompleteSimulatedPayment = async () => {
    try {
      const mockPaymentId = `pay_mock_${Date.now()}`;
      const mockSignature = 'mock_valid_signature';

      const orderRes = await ordersAPI.placeOrder({
        addressId: selectedAddressId,
        razorpay_order_id: pendingRazorpayOrder?.id || `order_mock_${Date.now()}`,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature,
        paymentMethod: 'Razorpay (Test Simulation)'
      });

      if (orderRes.success && orderRes.order) {
        setShowSimulatedModal(false);
        await fetchCart();
        navigate(`/order-success/${orderRes.order.order_number}`);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete order.');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="mb-8">
        <Link to="/cart" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-forest mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Cart</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Secure Checkout
        </h1>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Address Selection & Delivery details (8 Columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Select Delivery Address</h3>
                  <p className="text-xs text-gray-500">Where should we deliver your order?</p>
                </div>
              </div>

              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-forest text-forest hover:bg-forest hover:text-white text-xs font-semibold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Address</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="p-8 text-center text-gray-400">Loading saved addresses...</div>
            ) : addresses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl p-6">
                <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">No saved addresses found</p>
                <p className="text-xs text-gray-500 mt-1 mb-4">Please add a delivery address to place your order.</p>
                <button
                  onClick={() => setIsAddressModalOpen(true)}
                  className="px-5 py-2.5 bg-forest text-white text-xs font-semibold rounded-xl"
                >
                  + Add New Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                        isSelected
                          ? 'border-forest bg-forest/5 shadow-sm'
                          : 'border-gray-100 hover:border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-gray-900 text-sm">{addr.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-forest" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{addr.phone}</p>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                        {addr.house_building}, {addr.street},<br />
                        {addr.city}, {addr.district}, {addr.state} - <span className="font-semibold text-gray-700">{addr.pincode}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method Info */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Payment Method</h3>
                <p className="text-xs text-gray-500">Official Razorpay Online Payment Gateway</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-forest text-white flex items-center justify-center shrink-0">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-xs text-gray-700 space-y-1">
                <p className="font-bold text-forest text-sm">Online Payment (Razorpay)</p>
                <p className="text-gray-500">Supports UPI (GPay, PhonePe, Paytm), Credit & Debit Cards, Net Banking, and Wallets.</p>
                <p className="text-[10px] text-emerald-700 font-semibold">🔒 256-bit encrypted secure transaction</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Order Review & Finalize (4 Columns) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 sticky top-28">
            <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-4">
              Order Review
            </h3>

            {/* Items Mini List */}
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-bold text-gray-900 truncate block">{i.productName}</span>
                    <span className="text-gray-400">{i.variantSize ? `${i.variantSize} • ` : ''}Qty: {i.quantity}</span>
                  </div>
                  <span className="font-extrabold text-gray-900 shrink-0">₹{i.itemTotal}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 text-xs border-t border-gray-100 pt-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">₹{summary.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span className="font-bold text-gray-900">
                  {summary.deliveryCharge === 0 ? <span className="text-emerald-600 font-bold uppercase">FREE</span> : `₹${summary.deliveryCharge}`}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Total Payable</span>
                <span className="text-2xl font-black text-forest">₹{summary.grandTotal}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={handlePlaceOrderWithPayment}
              disabled={processingPayment || addresses.length === 0}
              className="w-full py-4 bg-forest hover:bg-forest-light text-white font-bold text-base rounded-2xl shadow-lg shadow-forest/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>{processingPayment ? 'Opening Razorpay...' : `Pay ₹${summary.grandTotal}`}</span>
            </button>

            <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
              <Truck className="w-3.5 h-3.5 text-forest" />
              <span>Ships directly from VELLANKI ENTERPRISES</span>
            </div>
          </div>
        </div>

      </div>

      {/* Address Modal */}
      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        onAddressSaved={loadAddresses}
      />

      {/* Razorpay Test Simulation Dialog (when mock keys active in dev) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-50 text-forest rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CreditCard className="w-8 h-8 text-emerald-600" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">Razorpay Payment Gateway</h3>
              <p className="text-xs text-gray-500 mt-1">Development / Test Simulation Mode</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-mono text-gray-800">{pendingRazorpayOrder?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Merchant:</span>
                <span className="font-bold text-forest">VELLANKI ENTERPRISES</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-extrabold text-base text-gray-900">₹{summary.grandTotal}</span>
              </div>
            </div>

            <p className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl font-medium">
              Payment methods verified: UPI, Cards, NetBanking. Click below to simulate successful payment authorization.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowSimulatedModal(false);
                  setProcessingPayment(false);
                }}
                className="flex-1 py-3 text-sm font-semibold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSimulatedPayment}
                className="flex-1 py-3 text-sm font-bold bg-forest hover:bg-forest-light text-white rounded-xl shadow-md transition-all"
              >
                Approve & Pay ₹{summary.grandTotal}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Checkout;
