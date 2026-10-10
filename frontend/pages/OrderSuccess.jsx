import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { ordersAPI } from '../services/api';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await ordersAPI.getOrderDetails(orderId);
        if (res.success && res.order) {
          setOrder(res.order);
        }
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-8">
      {/* Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-forest flex items-center justify-center mx-auto shadow-md shadow-emerald-600/10 animate-in zoom-in duration-300">
        <CheckCircle2 className="w-12 h-12 text-forest" />
      </div>

      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
          Payment & Order Confirmed
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mt-3">
          Thank you for choosing eco-friendly!
        </h1>
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
          Your order has been placed with <strong>VELLANKI ENTERPRISES</strong> and is now being processed for packing.
        </p>
      </div>

      {/* Order Card Preview */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
          <div>
            <span className="text-xs text-gray-400 font-medium">Order Number:</span>
            <p className="text-xl font-extrabold text-forest font-mono">{orderId}</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-forest border border-emerald-200">
            Status: {order?.order_status || 'Payment Confirmed'}
          </span>
        </div>

        {order && (
          <>
            {/* Delivery address snapshot */}
            {order.delivery_address && (
              <div className="text-xs text-gray-600 space-y-1">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-forest" />
                  Delivery Destination:
                </span>
                <p>
                  {order.delivery_address.name} ({order.delivery_address.phone})<br />
                  {order.delivery_address.house_building}, {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between items-baseline pt-4 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total Paid (Razorpay)</span>
              <span className="text-2xl font-black text-forest">₹{order.total_amount}</span>
            </div>
          </>
        )}
      </div>

      {/* Action Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to={`/orders/${orderId}`}
          className="w-full sm:w-auto px-8 py-3.5 bg-forest hover:bg-forest-light text-white font-bold text-sm rounded-2xl shadow-lg shadow-forest/20 flex items-center justify-center gap-2 transition-all"
        >
          <Package className="w-4 h-4" />
          <span>Track Order Status</span>
        </Link>
        <Link
          to="/shop"
          className="w-full sm:w-auto px-8 py-3.5 border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm rounded-2xl transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccess;
