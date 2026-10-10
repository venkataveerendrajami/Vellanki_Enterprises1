import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  PackageOpen, 
  Layers, 
  HeartHandshake, 
  Recycle,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { productsAPI, categoriesAPI, settingsAPI } from '../services/api';
import ProductCard from '../components/customer/ProductCard';
import EmptyState from '../components/common/EmptyState';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [latestProducts, setLatestProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storeSettings, setStoreSettings] = useState({});

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        const [catRes, featRes, latestRes, settingsRes] = await Promise.allSettled([
          categoriesAPI.getCategories(),
          productsAPI.getProducts({ featured: 'true', limit: 8 }),
          productsAPI.getProducts({ limit: 8, sort: 'newest' }),
          settingsAPI.getSettings()
        ]);

        if (catRes.status === 'fulfilled' && catRes.value.success) {
          setCategories(catRes.value.categories || []);
        }
        if (featRes.status === 'fulfilled' && featRes.value.success) {
          setFeaturedProducts(featRes.value.products || []);
        }
        if (latestRes.status === 'fulfilled' && latestRes.value.success) {
          setLatestProducts(latestRes.value.products || []);
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value.success) {
          setStoreSettings(settingsRes.value.settings || {});
        }
      } catch (err) {
        console.error('Failed to load home page content:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const totalProductsCount = latestProducts.length;

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white py-16 lg:py-24 border-b border-gray-100">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-earth-200/40 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & Call to Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-forest text-xs font-bold uppercase tracking-wider shadow-sm">
                <Leaf className="w-3.5 h-3.5 text-emerald-600" />
                <span>Eco-Friendly Products for Every Occasion</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15]">
                Sustainable Tableware for a <span className="text-forest underline decoration-emerald-400 decoration-wavy decoration-2">Greener Tomorrow</span>.
              </h1>

              <p className="text-gray-600 text-base sm:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Welcome to <strong>VELLANKI ENTERPRISES</strong>. We offer high-grade eco-friendly disposable paper plates, paper cups, meal trays, and sustainable food packaging designed for homes, catering, and businesses.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/shop"
                  className="w-full sm:w-auto px-8 py-3.5 bg-forest hover:bg-forest-light text-white text-base font-bold rounded-2xl shadow-lg shadow-forest/20 flex items-center justify-center gap-2 group transition-all"
                >
                  <span>Explore Catalog</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  to="/about"
                  className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-base font-semibold rounded-2xl shadow-sm transition-all"
                >
                  Our Eco Mission
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-gray-200/80 text-center lg:text-left">
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-forest">100%</p>
                  <p className="text-xs text-gray-500 font-medium">Biodegradable</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-forest">0% Plastic</p>
                  <p className="text-xs text-gray-500 font-medium">Earth-Safe</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-extrabold text-forest">Wholesale</p>
                  <p className="text-xs text-gray-500 font-medium">Direct from Seller</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none bg-gradient-to-tr from-forest-light to-forest p-8 rounded-3xl shadow-2xl text-white overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Leaf className="w-64 h-64 text-white" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <Sparkles className="w-7 h-7 text-emerald-300" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white">Purely Sustainable</h3>
                    <p className="text-emerald-100 text-sm mt-2 leading-relaxed">
                      Say goodbye to single-use harmful plastics. VELLANKI ENTERPRISES brings you durable, moisture-resistant, and aesthetically clean disposables made from natural paper and plant fibers.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-sm text-emerald-50 bg-white/5 p-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Multiple dynamic sizes & variants for every requirement</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-emerald-50 bg-white/5 p-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Direct seller pricing with no middleman markup</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-emerald-50 bg-white/5 p-2.5 rounded-xl border border-white/10">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Secure Razorpay payment integration</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. DYNAMIC CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Explore By Category</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Product Categories
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-forest hover:text-forest-light"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/shop?category=${encodeURIComponent(cat.slug)}`}
                className="group relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all flex flex-col items-center text-center overflow-hidden"
              >
                <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center text-forest mb-4 group-hover:scale-110 transition-transform overflow-hidden">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <Leaf className="w-8 h-8 text-emerald-600" />
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base group-hover:text-forest transition-colors">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-[200px]">
                    {cat.description}
                  </p>
                )}
                <span className="mt-3 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {cat.product_count || 0} {cat.product_count === 1 ? 'Product' : 'Products'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-50/50 rounded-2xl p-8 text-center border border-dashed border-emerald-200">
            <Layers className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
            <h4 className="font-bold text-gray-800 text-base">Categories Updating</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              Categories will be dynamically populated once the administrator adds them to the store catalog.
            </p>
          </div>
        )}
      </section>

      {/* 3. FEATURED PRODUCTS & ZERO-PRODUCT EMPTY STATE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Handpicked Disposables</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Featured Products
            </h2>
          </div>
          {totalProductsCount > 0 && (
            <Link
              to="/shop?featured=true"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-forest hover:text-forest-light"
            >
              <span>View All Featured</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-72 animate-pulse space-y-4">
                <div className="bg-gray-100 h-40 rounded-xl"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : totalProductsCount === 0 ? (
          /* MANDATED REQUIREMENT: When 0 products exist, display: Products coming soon. Please check back later. */
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 text-forest rounded-full flex items-center justify-center mx-auto mb-5">
              <PackageOpen className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to VELLANKI ENTERPRISES
            </h3>
            <p className="text-forest font-semibold text-lg mb-2">
              Products coming soon. Please check back later.
            </p>
            <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed mb-6">
              Our eco-friendly disposable product catalog is being dynamically curated. Check back shortly for premium paper plates, cups, and food packaging containers.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/about"
                className="px-6 py-2.5 bg-forest hover:bg-forest-light text-white text-sm font-bold rounded-xl shadow-sm transition-all"
              >
                About Our Company
              </Link>
              <Link
                to="/contact"
                className="px-6 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-semibold rounded-xl transition-all"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Featured Items Yet"
            message="Check our full catalog to discover all eco-friendly disposable products."
            actionText="Browse Full Catalog"
            actionLink="/shop"
          />
        )}
      </section>

      {/* 4. LATEST PRODUCTS SECTION (If products exist) */}
      {latestProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2 text-forest font-bold text-xs uppercase tracking-wider">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>New Additions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
                Latest Eco Products
              </h2>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-forest hover:text-forest-light"
            >
              <span>View All Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {latestProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 5. WHY VELLANKI ENTERPRISES - ECO PILLARS */}
      <section className="bg-emerald-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest block mb-2">
              Our Eco-Friendly Promise
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Why Choose VELLANKI Disposable Products?
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base mt-3 leading-relaxed">
              We design and manufacture single-use dining essentials that offer high structural rigidity without hurting mother nature.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-emerald-800/60 border border-emerald-700/60 p-8 rounded-3xl backdrop-blur-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Recycle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">100% Biodegradable</h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Decomposes naturally in compost environments without leaving microplastic residues, harmful toxins, or chemical leaching.
              </p>
            </div>

            <div className="bg-emerald-800/60 border border-emerald-700/60 p-8 rounded-3xl backdrop-blur-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Hygienic & Food Safe</h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Manufactured under sanitary clean-room conditions using food-grade raw materials. Suitable for hot, cold, and oily cuisines.
              </p>
            </div>

            <div className="bg-emerald-800/60 border border-emerald-700/60 p-8 rounded-3xl backdrop-blur-sm space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Direct Seller Reliability</h3>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Single dedicated business handling your order directly. Consistent stock, guaranteed quality, and prompt customer support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION & INQUIRY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-forest to-forest-light rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Planning an Event or Need Bulk Disposables?
            </h3>
            <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
              From family gatherings and weddings to restaurants and catering businesses, VELLANKI ENTERPRISES provides sustainable solutions at affordable prices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              to="/contact"
              className="px-7 py-3.5 bg-white text-forest hover:bg-emerald-50 font-bold text-sm rounded-xl shadow-md transition-all text-center w-full sm:w-auto"
            >
              Get In Touch
            </Link>
            <Link
              to="/shop"
              className="px-7 py-3.5 bg-emerald-700/80 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl border border-white/20 transition-all text-center w-full sm:w-auto"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
