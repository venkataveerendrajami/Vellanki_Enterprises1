import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  Truck, 
  X, 
  Save,
  FileText
} from 'lucide-react';
import { ordersAPI } from '../../services/api';

const ALL_STATUSES = [
  'Order Placed',
  'Payment Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const urlOrderParam = searchParams.get('order') || '';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState(urlOrderParam);

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalStatus, setModalStatus] = useState('');
  const [modalNotes, setModalNotes] = useState('');
  const [modalPaymentStatus, setModalPaymentStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100
      };
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await ordersAPI.getAllOrdersAdmin(params);
      if (res.success) {
        setOrders(res.orders || []);

        // If URL requested a specific order, auto-open modal
        if (urlOrderParam) {
          const match = res.orders?.find((o) => o.order_number === urlOrderParam);
          if (match) openOrderDetails(match.order_number);
        }
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderDetails = async (orderIdOrNumber) => {
    try {
      const res = await ordersAPI.getOrderDetails(orderIdOrNumber);
      if (res.success && res.order) {
        setSelectedOrder(res.order);
        setModalStatus(res.order.order_status);
        setModalNotes(res.order.notes || '');
        setModalPaymentStatus(res.order.payment_status);
      }
    } catch (e) {
      alert('Could not fetch order details');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      setUpdating(true);
      const res = await ordersAPI.updateOrderStatusAdmin(selectedOrder.id, {
        status: modalStatus,
        notes: modalNotes,
        paymentStatus: modalPaymentStatus
      });

      if (res.success && res.order) {
        alert(res.message);
        setSelectedOrder({
          ...selectedOrder,
          order_status: modalStatus,
          notes: modalNotes,
          payment_status: modalPaymentStatus
        });
        loadOrders();
      }
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const term = searchTerm.toLowerCase();
    return (
      ord.order_number.toLowerCase().includes(term) ||
      (ord.customer_name && ord.customer_name.toLowerCase().includes(term)) ||
      (ord.customer_phone && ord.customer_phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Order & Delivery Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track customer orders, delivery destinations, and advance fulfillment statuses
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by order #, customer, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:inline" />
          <span className="text-xs text-gray-400 hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-semibold text-gray-700 w-full md:w-auto"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No orders match the current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Order #</th>
                  <th className="py-3.5 px-4 font-semibold">Customer & Phone</th>
                  <th className="py-3.5 px-4 font-semibold">Date</th>
                  <th className="py-3.5 px-4 font-semibold">Items</th>
                  <th className="py-3.5 px-4 font-semibold">Total</th>
                  <th className="py-3.5 px-4 font-semibold">Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Order Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-forest text-sm">
                      #{ord.order_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{ord.customer_name}</p>
                      <p className="text-[11px] text-gray-500">{ord.customer_phone || ord.customer_email}</p>
                    </td>

                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-gray-600">
                      {ord.item_count || 1} items
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-gray-900 text-sm">
                      ₹{ord.total_amount}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.payment_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        ord.order_status === 'Delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.order_status === 'Cancelled'
                          ? 'bg-red-100 text-red-800'
                          : ord.order_status === 'Shipped' || ord.order_status === 'Out for Delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.order_status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openOrderDetails(ord.order_number)}
                        className="px-3 py-1.5 bg-forest/10 hover:bg-forest hover:text-white text-forest text-xs font-bold rounded-lg transition-all"
                      >
                        Manage Delivery
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ORDER DETAILS & DELIVERY STATUS UPDATE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-forest">Order Fulfillment Console</span>
                <h3 className="font-extrabold text-lg text-gray-900 font-mono">
                  #{selectedOrder.order_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              
              {/* Delivery Address & Customer Phone */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                <span className="font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-forest" />
                  Delivery Address & Customer Info
                </span>
                {selectedOrder.delivery_address && (
                  <div className="text-gray-600 space-y-0.5 leading-relaxed">
                    <p className="font-bold text-gray-900 text-sm">{selectedOrder.delivery_address.name}</p>
                    <p className="flex items-center gap-1 text-forest font-bold">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedOrder.delivery_address.phone}
                    </p>
                    <p>
                      {selectedOrder.delivery_address.house_building}, {selectedOrder.delivery_address.street}
                    </p>
                    <p>
                      {selectedOrder.delivery_address.city}, {selectedOrder.delivery_address.district}, {selectedOrder.delivery_address.state} - <strong>{selectedOrder.delivery_address.pincode}</strong>
                    </p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider">Ordered Products</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl p-3 bg-white">
                  {selectedOrder.items?.map((it) => (
                    <div key={it.id} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{it.product_name}</p>
                        <p className="text-[11px] text-gray-400">
                          {it.variant_size ? `Size: ${it.variant_size} • ` : ''}Qty: {it.quantity} × ₹{it.price}
                        </p>
                      </div>
                      <span className="font-extrabold text-gray-900 text-sm">₹{it.price * it.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Update Dropdown */}
              <div className="bg-emerald-50/60 rounded-2xl p-5 border border-emerald-100 space-y-4">
                <h4 className="font-bold text-forest text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  Update Order & Delivery Status
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Fulfillment Status:
                    </label>
                    <select
                      value={modalStatus}
                      onChange={(e) => setModalStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold text-gray-900"
                    >
                      {ALL_STATUSES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Payment Status:
                    </label>
                    <select
                      value={modalPaymentStatus}
                      onChange={(e) => setModalPaymentStatus(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white font-bold text-gray-900"
                    >
                      <option value="paid">Paid (Razorpay)</option>
                      <option value="pending">Payment Pending</option>
                      <option value="failed">Failed / Refunded</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Delivery Note / Tracking Number (Visible to Customer):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Dispatched via Express Courier. Tracking ID: EXP-88912"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
                  />
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="px-6 py-2 text-xs font-bold bg-forest hover:bg-forest-light text-white rounded-xl shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{updating ? 'Updating...' : 'Save & Notify Customer'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminOrders;
