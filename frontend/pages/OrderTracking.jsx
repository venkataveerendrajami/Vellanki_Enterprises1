import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  MapPin, 
  AlertTriangle, 
  ArrowLeft,
  XCircle,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { ordersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_ICONS = {
  'Order Placed': Clock,
  'Payment Confirmed': CheckCircle2,
  'Processing': Package,
  'Packed': Package,
  'Shipped': Truck,
  'Out for Delivery': Truck,
  'Delivered': CheckCircle2,
  'Cancelled': XCircle
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await ordersAPI.getOrderDetails(orderId);
      if (res.success && res.order) {
        setOrder(res.order);
      }
    } catch (err) {
      console.error('Failed to load order tracking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(true);
      const res = await ordersAPI.cancelOrder(order.id);
      if (res.success) {
        alert('Order has been cancelled.');
        loadOrder();
      }
    } catch (err) {
      alert(err.message || 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">Could not find order details for #{orderId}.</p>
        <Link to="/account?tab=orders" className="px-6 py-2.5 bg-forest text-white rounded-xl text-sm font-semibold">
          View My Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.order_status === 'Cancelled';
  const canCancel = ['Order Placed', 'Payment Confirmed'].includes(order.order_status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Top Header */}
      <div>
        <Link to="/account?tab=orders" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-forest mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Orders</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Order #{order.order_number}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              isCancelled
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-emerald-50 text-forest border border-emerald-200'
            }`}>
              {order.order_status}
            </span>

            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-full transition-all"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <h3 className="font-bold text-gray-900 text-base mb-6">
          Order Progress Timeline
        </h3>

        {isCancelled ? (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 text-sm">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">This order has been cancelled.</p>
              <p className="text-xs text-red-600">The items have been returned to warehouse inventory.</p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline Items */}
            <div className="space-y-6">
              {order.timeline?.map((item, idx) => {
                const isLast = idx === order.timeline.length - 1;
                const IconComponent = STATUS_ICONS[item.stage] || CheckCircle2;

                return (
                  <div key={item.stage} className="flex items-start gap-4 relative">
                    {/* Connecting vertical line */}
                    {!isLast && (
                      <div
                        className={`absolute left-5 top-10 bottom-0 w-0.5 -ml-px ${
                          item.completed ? 'bg-forest' : 'bg-gray-200'
                        }`}
                      />
                    )}

                    {/* Stage icon circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      item.completed
                        ? 'bg-forest text-white shadow-md shadow-forest/20'
                        : item.current
                        ? 'bg-emerald-100 text-forest border-2 border-forest animate-pulse'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Stage text */}
                    <div className="pt-1.5 flex-1">
                      <div className="flex items-baseline justify-between">
                        <h4 className={`text-sm font-bold ${
                          item.completed || item.current ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {item.stage}
                        </h4>
                        {item.current && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Current Stage
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.notes && (
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600">
            <span className="font-bold text-gray-800 block mb-0.5">Delivery Update Note:</span>
            {order.notes}
          </div>
        )}
      </div>

      {/* Ordered Items Breakdown */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="font-bold text-gray-900 text-base border-b border-gray-100 pb-3">
          Items in this Order
        </h3>

        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-forest/40">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.product_name}</p>
                  <p className="text-xs text-gray-400">
                    {item.variant_size ? `Size: ${item.variant_size} • ` : ''}Qty: {item.quantity} × ₹{item.price}
                  </p>
                </div>
              </div>

              <span className="text-sm font-extrabold text-gray-900 shrink-0">
                ₹{item.quantity * item.price}
              </span>
            </div>
          ))}
        </div>

        {/* Invoice Summary */}
        <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span className="font-bold text-gray-900">₹{order.subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery Charge</span>
            <span className="font-bold text-gray-900">
              {order.delivery_charge === 0 ? <span className="text-emerald-600 font-bold uppercase">FREE</span> : `₹${order.delivery_charge}`}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-100 flex justify-between items-baseline text-sm">
            <span className="font-bold text-gray-900">Grand Total</span>
            <span className="text-xl font-black text-forest">₹{order.total_amount}</span>
          </div>
        </div>
      </div>

      {/* Destination & Payment Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-forest" />
            Shipping Destination
          </span>
          {order.delivery_address && (
            <div className="text-xs text-gray-700 leading-relaxed pt-1">
              <p className="font-bold text-gray-900 text-sm">{order.delivery_address.name}</p>
              <p className="text-gray-500">Phone: {order.delivery_address.phone}</p>
              <p className="mt-1">
                {order.delivery_address.house_building}, {order.delivery_address.street}<br />
                {order.delivery_address.city}, {order.delivery_address.district}, {order.delivery_address.state} - {order.delivery_address.pincode}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-forest" />
            Payment Status
          </span>
          <div className="pt-1 text-xs text-gray-700 space-y-1">
            <p className="font-bold text-emerald-700 text-sm capitalize">
              {order.payment_status === 'paid' ? 'Paid Online via Razorpay' : 'Payment Pending'}
            </p>
            {order.payment?.razorpay_payment_id && (
              <p className="font-mono text-[11px] text-gray-400">
                Payment Ref: {order.payment.razorpay_payment_id}
              </p>
            )}
            <p className="text-gray-500 text-[11px]">
              Direct transaction verified by VELLANKI ENTERPRISES
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
