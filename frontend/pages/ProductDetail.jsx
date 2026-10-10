import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Zap, 
  Check, 
  ShieldCheck, 
  Truck, 
  Leaf, 
  ArrowLeft,
  ChevronRight,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { productsAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ProductDetail = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const res = await productsAPI.getProduct(idOrSlug);
        if (res.success && res.product) {
          const prod = res.product;
          setProduct(prod);

          // Select primary image
          if (prod.images && prod.images.length > 0) {
            setSelectedImage(prod.images[0].image_url);
          } else if (prod.image) {
            setSelectedImage(prod.image);
          }

          // Select first variant if variants exist
          if (prod.variants && prod.variants.length > 0) {
            setSelectedVariant(prod.variants[0]);
          }
        }
      } catch (err) {
        console.error('Error loading product details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [idOrSlug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-forest border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/shop" className="px-6 py-2.5 bg-forest text-white font-semibold rounded-xl">
          Return to Shop
        </Link>
      </div>
    );
  }

  // Calculate current price, stock, and discount dynamically based on selected variant
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const currentSku = selectedVariant?.sku || product.sku || 'N/A';

  const hasDiscount = Boolean(
    product.discount_price && 
    Number(product.discount_price) > 0 && 
    Number(product.price) > Number(product.discount_price)
  );

  let currentPrice;
  let originalPrice = null;
  let discountPercent = 0;

  if (hasDiscount) {
    currentPrice = Number(product.discount_price);
    originalPrice = Number(product.price);
    discountPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  } else {
    currentPrice = Number(product.price) || (selectedVariant ? Number(selectedVariant.price) : 0);
    originalPrice = null;
    discountPercent = 0;
  }

  const handleVariantSelect = (variant) => {
    setSelectedVariant(variant);
    // Reset quantity if it exceeds variant's available stock
    if (quantity > variant.stock) {
      setQuantity(Math.max(1, variant.stock));
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${idOrSlug}` } });
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id, selectedVariant?.id || null, quantity);
      setToastMessage('Added to cart successfully!');
      setTimeout(() => setToastMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${idOrSlug}` } });
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(product.id, selectedVariant?.id || null, quantity);
      navigate('/checkout');
    } catch (err) {
      alert(err.message || 'Failed to initiate purchase');
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-forest text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom">
          <Check className="w-5 h-5 text-emerald-300" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 font-medium">
        <Link to="/" className="hover:text-forest">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/shop" className="hover:text-forest">Shop</Link>
        {product.category_name && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to={`/shop?category=${encodeURIComponent(product.category_slug)}`} className="hover:text-forest">
              {product.category_name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-900 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Gallery / Image Carousel (5 Columns) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Large Display */}
          <div className="aspect-square bg-white rounded-3xl border border-gray-100 p-4 shadow-sm overflow-hidden flex items-center justify-center relative">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Leaf className="w-16 h-16 mx-auto mb-2 text-forest/20" />
                <span className="text-xs uppercase tracking-wider font-semibold">VELLANKI Eco Disposables</span>
              </div>
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] flex items-center justify-center">
                <span className="bg-red-600 text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image_url)}
                  className={`w-16 h-16 rounded-xl border-2 p-1 bg-white shrink-0 overflow-hidden transition-all ${
                    selectedImage === img.image_url ? 'border-forest ring-2 ring-forest/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img.image_url} alt="Thumbnail" className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Title & Category */}
          <div>
            {product.category_name && (
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                {product.category_name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              {product.name}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              SKU: <span className="font-mono text-gray-600">{currentSku}</span>
            </p>
          </div>

          {/* Pricing & Stock Status */}
          <div className="flex items-baseline gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex-wrap">
            <span className="text-3xl font-black text-forest">
              ₹{currentPrice}
            </span>
            {originalPrice && originalPrice > currentPrice && (
              <span className="text-base text-gray-400 line-through">
                ₹{originalPrice}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
            <span className="text-xs text-gray-500 ml-2">Inclusive of all taxes</span>

            <div className="ml-auto">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Out of Stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  In Stock ({currentStock} available)
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Variants / Sizes Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
                Select Size / Variant:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.id === v.id;
                  const vOutOfStock = v.stock <= 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVariantSelect(v)}
                      className={`p-3 rounded-2xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-forest bg-forest/5 ring-2 ring-forest/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${vOutOfStock ? 'opacity-60' : ''}`}
                    >
                      <p className="text-sm font-bold text-gray-900">{v.size}</p>
                      <p className="text-xs font-extrabold text-forest mt-0.5">₹{v.price}</p>
                      <p className="text-[10px] text-gray-400">
                        {vOutOfStock ? 'Out of stock' : `${v.stock} in stock`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="flex items-center gap-4 pt-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Quantity:
              </span>
              <div className="flex items-center border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 font-bold"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-bold text-gray-900">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="px-3.5 py-2 text-gray-600 hover:bg-gray-100 font-bold"
                  disabled={quantity >= currentStock}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Purchase Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || addingToCart}
              className="py-3.5 px-6 rounded-2xl border-2 border-forest text-forest hover:bg-forest hover:text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-forest"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>{isOutOfStock ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock || addingToCart}
              className="py-3.5 px-6 rounded-2xl bg-forest hover:bg-forest-light text-white font-bold text-sm shadow-lg shadow-forest/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
            >
              <Zap className="w-5 h-5 text-amber-300" />
              <span>{isOutOfStock ? 'Currently Unavailable' : 'Buy Now'}</span>
            </button>
          </div>

          {/* Eco Guarantee Callout */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <Leaf className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Eco-Friendly Materials</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Fast Doorstep Delivery</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Secure Razorpay Payments</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Food Grade & Chemical-Free</span>
            </div>
          </div>

          {/* Description & Specifications Tabs */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
              Product Overview
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description || 'Premium quality eco-friendly disposable product from VELLANKI ENTERPRISES.'}
            </p>

            {/* Specifications Table */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Specifications</h4>
              <div className="grid grid-cols-2 gap-y-2 text-xs">
                <span className="text-gray-500">Material:</span>
                <span className="font-semibold text-gray-800">{product.material || 'Eco Paper / Plant Fiber'}</span>
                
                <span className="text-gray-500">Weight:</span>
                <span className="font-semibold text-gray-800">{selectedVariant?.weight || product.weight || 'Standard'}</span>

                <span className="text-gray-500">Brand / Seller:</span>
                <span className="font-semibold text-gray-800">VELLANKI ENTERPRISES</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
