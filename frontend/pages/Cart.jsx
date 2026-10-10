import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  AlertCircle,
  PackageOpen
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';

const Cart = () => {
  const { items, summary, loading, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view your cart"
          message="Please log in or create an account to view and manage items in your shopping cart."
          actionText="Log In Now"
          actionLink="/login"
        />
      </div>
    );
  }

  const handleQtyChange = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      if (window.confirm('Remove this product from your cart?')) {
        await removeItem(itemId);
      }
      return;
    }

    try {
      setUpdatingId(itemId);
      await updateQuantity(itemId, newQty);
    } catch (err) {
      alert(err.message || 'Could not update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleProceedCheckout = () => {
    // Check if any item in cart exceeds stock
    const hasExceeded = items.some(i => i.isQuantityExceeded || i.isOutOfStock);
    if (hasExceeded) {
      alert('Please adjust quantities or remove items that are currently out of stock before proceeding.');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          message="You haven't added any eco-friendly products to your cart yet. Explore our sustainable disposables collection."
          actionText="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  const percentToFreeDelivery = Math.min(
    100, 
    Math.round((summary.subtotal / summary.freeShippingThreshold) * 100)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {summary.itemsCount} {summary.itemsCount === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all items from your cart?')) clearCart();
            }}
            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
          >
            Clear Cart
          </button>
        )}
      </div>

      {/* Free Delivery Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-forest mb-2">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            {summary.amountNeededForFreeShipping > 0
              ? `Add ₹${summary.amountNeededForFreeShipping} more to qualify for FREE Delivery!`
              : '🎉 You have unlocked FREE Delivery!'}
          </span>
          <span>{percentToFreeDelivery}%</span>
        </div>
        <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
          <div
            className="bg-forest h-full rounded-full transition-all duration-500"
            style={{ width: `${percentToFreeDelivery}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cart Items List (8 Columns) */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center gap-4 transition-all"
            >
              {/* Product Thumbnail */}
              <Link to={`/products/${item.productSlug || item.productId}`} className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-forest/40">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                )}
              </Link>

              {/* Item Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <Link
                  to={`/products/${item.productSlug || item.productId}`}
                  className="font-bold text-gray-900 hover:text-forest transition-colors text-base block truncate"
                >
                  {item.productName}
                </Link>

                {item.variantSize && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Size: <span className="font-semibold text-gray-700">{item.variantSize}</span>
                  </p>
                )}

                <p className="text-sm font-extrabold text-forest mt-1">
                  ₹{item.unitPrice} <span className="text-xs font-normal text-gray-400">each</span>
                </p>

                {item.isOutOfStock ? (
                  <span className="text-xs font-bold text-red-600 flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Currently Out of Stock
                  </span>
                ) : item.isQuantityExceeded ? (
                  <span className="text-xs font-bold text-amber-600 flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Only {item.availableStock} in stock
                  </span>
                ) : null}
              </div>

              {/* Quantity Controls & Total */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity, -1)}
                    disabled={updatingId === item.id}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="px-3.5 py-1.5 text-sm font-bold text-gray-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQtyChange(item.id, item.quantity, 1)}
                    disabled={updatingId === item.id || item.quantity >= item.availableStock}
                    className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 font-bold text-sm disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-[70px]">
                  <p className="font-extrabold text-base text-gray-900">
                    ₹{item.itemTotal}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                  aria-label="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Card (4 Columns) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6 sticky top-28">
            <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-4">
              Order Summary
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({summary.itemsCount} items)</span>
                <span className="font-bold text-gray-900">₹{summary.subtotal}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Delivery Charges</span>
                <span className="font-bold text-gray-900">
                  {summary.deliveryCharge === 0 ? (
                    <span className="text-emerald-600 uppercase text-xs">FREE</span>
                  ) : (
                    `₹${summary.deliveryCharge}`
                  )}
                </span>
              </div>

              {summary.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Special Discount</span>
                  <span className="font-bold">-₹{summary.discount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                <span className="text-base font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-black text-forest">₹{summary.grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handleProceedCheckout}
              className="w-full py-4 bg-forest hover:bg-forest-light text-white font-bold text-base rounded-2xl shadow-lg shadow-forest/20 flex items-center justify-center gap-2 group transition-all"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <div className="pt-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure Checkout via Razorpay</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
