import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Layers } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const isOutOfStock = product.stock <= 0;
  const hasVariants = product.variants && product.variants.length > 0;
  const defaultVariant = hasVariants ? product.variants[0] : null;

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
    currentPrice = Number(product.price) || (defaultVariant ? Number(defaultVariant.price) : 0);
    originalPrice = null;
    discountPercent = 0;
  }

  // Primary image
  const displayImage = product.image || (product.images && product.images.length > 0 ? product.images[0].image_url : null);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    // If variants exist, select first variant with stock
    const variantId = product.variants && product.variants.length > 0
      ? (product.variants.find(v => v.stock > 0)?.id || product.variants[0].id)
      : null;

    try {
      await addToCart(product.id, variantId, 1);
    } catch (err) {
      alert(err.message || 'Please log in to add to cart.');
    }
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden relative">
      {/* Product Image Container */}
      <Link to={`/products/${product.slug || product.id}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50/50 text-forest/40 p-4 text-center">
            <Layers className="w-12 h-12 mb-2 stroke-1" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800/60">
              {product.category_name || 'Eco Tableware'}
            </span>
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-sm">
              {discountPercent}% OFF
            </span>
          )}
          {product.featured === 1 && (
            <span className="bg-forest text-white text-[10px] font-semibold px-2 py-0.5 rounded-lg shadow-sm">
              Featured
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category tag */}
        {product.category_name && (
          <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-700 mb-1">
            {product.category_name}
          </p>
        )}

        {/* Product title */}
        <Link to={`/products/${product.slug || product.id}`} className="block mb-1.5">
          <h3 className="font-bold text-gray-900 group-hover:text-forest transition-colors text-sm sm:text-base line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Variants / Sizes badge */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mb-3">
            <span className="text-[11px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded">
              {product.variants.length} {product.variants.length === 1 ? 'Size' : 'Sizes'} Available
            </span>
          </div>
        )}

        {/* Price & Action Row */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-extrabold text-forest">
                ₹{currentPrice}
              </span>
              {originalPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ₹{originalPrice}
                </span>
              )}
            </div>
            {product.variants && product.variants.length > 1 && (
              <span className="text-[10px] text-gray-400 block -mt-0.5">Starting price</span>
            )}
          </div>

          <Link
            to={`/products/${product.slug || product.id}`}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-forest hover:bg-forest-light text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            aria-label="View Details"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
