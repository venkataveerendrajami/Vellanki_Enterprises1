import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ArrowUpDown, 
  RotateCcw,
  Check,
  PackageOpen,
  ChevronDown
} from 'lucide-react';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/customer/ProductCard';
import EmptyState from '../components/common/EmptyState';

const COMMON_SIZES = ['6 inch', '7 inch', '8 inch', '9 inch', '10 inch', '11 inch', '12 inch', '14 inch', '100ml', '150ml', '200ml', '250ml', '300ml', '500ml'];

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const querySearch = searchParams.get('search') || '';
  const queryCategory = searchParams.get('category') || '';
  const queryFeatured = searchParams.get('featured') || '';

  // Local state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [search, setSearch] = useState(querySearch);
  const [selectedCategory, setSelectedCategory] = useState(queryCategory);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Mobile filter drawer
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if URL changes
  useEffect(() => {
    setSearch(querySearch);
    setSelectedCategory(queryCategory);
  }, [querySearch, queryCategory]);

  // Load categories
  useEffect(() => {
    categoriesAPI.getCategories().then((res) => {
      if (res.success) setCategories(res.categories || []);
    }).catch(console.error);
  }, []);

  // Fetch products based on applied filters
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        sort: sortBy,
      };

      if (search.trim()) params.search = search.trim();
      if (selectedCategory) params.category = selectedCategory;
      if (minPrice && !isNaN(minPrice)) params.min_price = minPrice;
      if (maxPrice && !isNaN(maxPrice)) params.max_price = maxPrice;
      if (selectedSize) params.size = selectedSize;
      if (inStockOnly) params.in_stock = 'true';
      if (queryFeatured === 'true') params.featured = 'true';

      const res = await productsAPI.getProducts(params);
      if (res.success) {
        setProducts(res.products || []);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Error fetching shop products:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, minPrice, maxPrice, selectedSize, inStockOnly, sortBy, queryFeatured]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (search.trim()) {
      newParams.set('search', search.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSelectedSize('');
    setInStockOnly(false);
    setSortBy('newest');
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(
    search || selectedCategory || minPrice || maxPrice || selectedSize || inStockOnly || queryFeatured
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header and Breadcrumbs */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Product Catalog
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Explore our range of eco-friendly disposable paper plates, cups, and food containers.
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Search by name, SKU, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-forest focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </form>

        {/* Filter Toggle (Mobile) & Sort By Dropdown */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-forest"></span>
            )}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-gray-400 hidden sm:inline" />
            <span className="text-xs text-gray-500 font-semibold hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-forest bg-white font-medium text-gray-700"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Layout: Filters Sidebar + Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-forest" />
                Filter Products
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-forest hover:underline flex items-center gap-1 font-semibold"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Categories
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                    !selectedCategory ? 'bg-forest text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${
                      selectedCategory === cat.slug ? 'bg-forest text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      selectedCategory === cat.slug ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {cat.product_count || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Price Range (₹)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
                Product Size / Variant
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SIZES.map((sz) => {
                  const active = selectedSize.toLowerCase() === sz.toLowerCase();
                  return (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(active ? '' : sz)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        active 
                          ? 'bg-forest text-white' 
                          : 'bg-gray-50 text-gray-600 border border-gray-200 hover:border-forest'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div className="pt-2 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-forest rounded focus:ring-forest"
                />
                <span>In-Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Products Grid Area */}
        <div className="lg:col-span-3">
          
          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs text-gray-400 font-semibold">Active:</span>
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-forest text-xs font-bold rounded-full">
                  Category: {selectedCategory}
                  <button onClick={() => setSelectedCategory('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedSize && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-forest text-xs font-bold rounded-full">
                  Size: {selectedSize}
                  <button onClick={() => setSelectedSize('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-forest text-xs font-bold rounded-full">
                  ₹{minPrice || '0'} - ₹{maxPrice || '∞'}
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-forest text-xs font-bold rounded-full">
                  In-Stock Only
                  <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-red-600 hover:underline font-semibold ml-2"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Product Items Count */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 font-medium">
            <span>Showing {products.length} of {totalCount} products</span>
          </div>

          {/* Grid Render */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-72 animate-pulse space-y-4">
                  <div className="bg-gray-100 h-40 rounded-xl"></div>
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={PackageOpen}
              title={hasActiveFilters ? "No matching products found" : "No products available yet"}
              message={
                hasActiveFilters
                  ? "Try loosening your search terms or clearing price and size filters."
                  : "Welcome to VELLANKI ENTERPRISES. Products coming soon. Please check back later."
              }
              actionText={hasActiveFilters ? "Reset All Filters" : "Return to Home"}
              actionLink={hasActiveFilters ? undefined : "/"}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 flex flex-col overflow-y-auto z-10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Filter Products</h3>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Category</h4>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Price Range (₹)</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
                />
              </div>
            </div>

            {/* Size */}
            <div>
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Size / Variant</h4>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl"
              >
                <option value="">All Sizes</option>
                {COMMON_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* In stock */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 text-forest rounded"
                />
                <span>In-Stock Only</span>
              </label>
            </div>

            {/* Actions */}
            <div className="mt-auto pt-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 text-gray-700 rounded-xl"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold bg-forest text-white rounded-xl shadow"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
