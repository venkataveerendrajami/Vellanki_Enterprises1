import React, { useState, useEffect } from 'react';
import { Users, Search, Mail, Phone, Calendar, ShoppingBag, ShieldCheck, CheckCircle2, XCircle, UserCheck, UserX } from 'lucide-react';
import { analyticsAPI } from '../../services/api';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getCustomers({ limit: 100 });
      if (res.success) setCustomers(res.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (customer) => {
    const newStatus = customer.status === 'suspended' ? 'active' : 'suspended';
    const confirmMsg = customer.status === 'suspended'
      ? `Re-activate customer account for ${customer.name}?`
      : `Suspend customer account for ${customer.name}? They will be blocked from logging in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoadingId(customer.id);
      const res = await analyticsAPI.updateCustomerStatus(customer.id, { status: newStatus });
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === customer.id ? { ...c, status: newStatus } : c))
        );
      }
    } catch (err) {
      alert(err.message || 'Could not update customer status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = customers.filter((c) => {
    const term = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone && c.phone.includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Customer Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Registered customer accounts, mobile/email verification statuses, and account controls
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by customer name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="text-xs font-semibold text-gray-500">
          Total Customers: <strong className="text-gray-900">{customers.length}</strong>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            {search ? 'No matching customer accounts found.' : 'No customer accounts registered yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Email & Status</th>
                  <th className="py-3.5 px-4 font-semibold">Mobile & Status</th>
                  <th className="py-3.5 px-4 font-semibold">Registration Date</th>
                  <th className="py-3.5 px-4 font-semibold">Last Login</th>
                  <th className="py-3.5 px-4 font-semibold">Account Status</th>
                  <th className="py-3.5 px-4 font-semibold">Orders & Spend</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Customer Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-forest flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name ? c.name[0].toUpperCase() : 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{c.name}</p>
                          <span className="text-[10px] text-gray-400">ID #{c.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email & Verification */}
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      <div className="space-y-1">
                        <p>{c.email}</p>
                        {c.email_verified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>✓ Verified</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Mobile & Verification */}
                    <td className="py-3.5 px-4 text-gray-600 font-medium">
                      <div className="space-y-1">
                        <p>{c.phone || <span className="text-gray-300 italic">None</span>}</p>
                        {c.phone ? (
                          c.phone_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>✓ Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              Unverified
                            </span>
                          )
                        ) : null}
                      </div>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3.5 px-4 text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-gray-500">
                      {c.last_login ? (
                        <span>
                          {new Date(c.last_login).toLocaleDateString('en-IN', {
                            month: 'short', day: 'numeric'
                          })}{' '}
                          <span className="text-[10px] text-gray-400">
                            {new Date(c.last_login).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-300 italic">Never</span>
                      )}
                    </td>

                    {/* Account Status Badge */}
                    <td className="py-3.5 px-4">
                      {c.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>Suspended</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>

                    {/* Orders & Spend */}
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900">{c.order_count || 0} orders</p>
                      <p className="text-forest font-black">₹{c.total_spent || 0}</p>
                    </td>

                    {/* Action: Suspend / Activate */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(c)}
                        disabled={actionLoadingId === c.id}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                          c.status === 'suspended'
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                      >
                        {actionLoadingId === c.id
                          ? 'Updating...'
                          : c.status === 'suspended'
                          ? 'Re-activate'
                          : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
