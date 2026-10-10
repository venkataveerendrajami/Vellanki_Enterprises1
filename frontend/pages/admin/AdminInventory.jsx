import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Search, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Check, 
  RefreshCw,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { productsAPI } from '../../services/api';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStock, setFilterStock] = useState('all'); // 'all', 'low', 'out'
  const [adjustingId, setAdjustingId] = useState(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await productsAPI.getProducts({ all: 'true', limit: 200 });
      if (res.success) setProducts(res.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdjust = async (productId, variantId, qtyDelta) => {
    try {
      setAdjustingId(variantId ? `var_${variantId}` : `prod_${productId}`);
      await productsAPI.adjustStock({
        productId,
        variantId,
        quantity: Math.abs(qtyDelta),
        type: qtyDelta > 0 ? 'add' : 'reduce'
      });
      await loadInventory();
    } catch (err) {
      alert(err.message || 'Failed to update stock');
    } finally {
      setAdjustingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(term) || (p.sku && p.sku.toLowerCase().includes(term));

    if (!matchesSearch) return false;
    if (filterStock === 'low') return p.stock > 0 && p.stock <= 10;
    if (filterStock === 'out') return p.stock <= 0;
    return true;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Inventory & Stock Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track product units, variant supplies, and adjust warehouse inventory levels
          </p>
        </div>

        <button
          onClick={loadInventory}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setFilterStock('all')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            filterStock === 'all' ? 'border-forest bg-forest/5 shadow-sm' : 'border-gray-100 bg-white'
          }`}
        >
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Products</span>
          <p className="text-2xl font-black text-gray-900 mt-1">{products.length}</p>
        </div>

        <div
          onClick={() => setFilterStock('low')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            filterStock === 'low' ? 'border-amber-500 bg-amber-50/50 shadow-sm' : 'border-gray-100 bg-white'
          }`}
        >
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Low-Stock Alert (&le;10 Units)
          </span>
          <p className="text-2xl font-black text-amber-700 mt-1">{lowStockCount}</p>
        </div>

        <div
          onClick={() => setFilterStock('out')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            filterStock === 'out' ? 'border-red-500 bg-red-50/50 shadow-sm' : 'border-gray-100 bg-white'
          }`}
        >
          <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Out of Stock</span>
          <p className="text-2xl font-black text-red-700 mt-1">{outOfStockCount}</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search inventory by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Filter view:</span>
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-white text-gray-700 font-semibold"
          >
            <option value="all">All Inventory</option>
            <option value="low">Low Stock Only (&le;10)</option>
            <option value="out">Out of Stock Only</option>
          </select>
        </div>
      </div>

      {/* Inventory Table with Variant-Level Control */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading inventory...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            No products match the selected inventory filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Product Name</th>
                  <th className="py-3.5 px-4 font-semibold">SKU</th>
                  <th className="py-3.5 px-4 font-semibold">Total Stock</th>
                  <th className="py-3.5 px-4 font-semibold">Variant Level Breakdown & Quick Adjust</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.category_name || 'Tableware'}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-gray-500">
                      {p.sku}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        p.stock <= 0
                          ? 'bg-red-100 text-red-700'
                          : p.stock <= 10
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>

                    {/* Variant Breakdown & Controls */}
                    <td className="py-3.5 px-4">
                      {p.variants && p.variants.length > 0 ? (
                        <div className="space-y-1.5 py-1">
                          {p.variants.map((v) => (
                            <div key={v.id} className="flex items-center justify-between gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200/60 max-w-sm">
                              <div>
                                <span className="font-bold text-gray-800">{v.size}:</span>{' '}
                                <span className={`font-semibold ${v.stock <= 5 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {v.stock} in stock
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleQuickAdjust(p.id, v.id, -5)}
                                  disabled={adjustingId === `var_${v.id}` || v.stock <= 0}
                                  className="w-6 h-6 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center text-gray-700 disabled:opacity-40"
                                  title="Reduce 5 units"
                                >
                                  -5
                                </button>
                                <button
                                  onClick={() => handleQuickAdjust(p.id, v.id, 10)}
                                  disabled={adjustingId === `var_${v.id}`}
                                  className="px-2 h-6 rounded-lg bg-forest hover:bg-forest-light font-bold flex items-center justify-center text-white text-[11px]"
                                  title="Restock 10 units"
                                >
                                  +10
                                </button>
                                <button
                                  onClick={() => handleQuickAdjust(p.id, v.id, 50)}
                                  disabled={adjustingId === `var_${v.id}`}
                                  className="px-2 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold flex items-center justify-center text-white text-[11px]"
                                  title="Restock 50 units"
                                >
                                  +50
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickAdjust(p.id, null, -5)}
                            disabled={adjustingId === `prod_${p.id}` || p.stock <= 0}
                            className="w-7 h-6 rounded-lg bg-gray-200 hover:bg-gray-300 font-bold flex items-center justify-center text-gray-700 disabled:opacity-40"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(p.id, null, 10)}
                            disabled={adjustingId === `prod_${p.id}`}
                            className="px-2.5 h-6 rounded-lg bg-forest text-white font-bold text-[11px]"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(p.id, null, 50)}
                            disabled={adjustingId === `prod_${p.id}`}
                            className="px-2.5 h-6 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                          >
                            +50
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.stock <= 0 ? (
                        <span className="text-red-600 font-bold text-[11px] uppercase tracking-wider">
                          Out of Stock
                        </span>
                      ) : p.stock <= 10 ? (
                        <span className="text-amber-600 font-bold text-[11px] uppercase tracking-wider">
                          Low Stock
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[11px] uppercase tracking-wider">
                          Healthy
                        </span>
                      )}
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

export default AdminInventory;
