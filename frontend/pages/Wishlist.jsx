import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { wishlistAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/common/EmptyState';

const Wishlist = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const res = await wishlistAPI.getWishlist();
      if (res.success) {
        setWishlist(res.wishlist || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      alert('Could not remove item from wishlist.');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      setAddingId(product.id);
      await addToCart(product.id, null, 1);
      // Remove from wishlist once added to cart
      await wishlistAPI.removeFromWishlist(product.id);
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
    } catch (err) {
      alert(err.message || 'Could not add to cart.');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Heart className="w-7 h-7 text-red-500 fill-red-500" />
            <span>My Wishlist</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Eco-friendly tableware items you've saved for later
          </p>
        </div>

        <Link
          to="/shop"
          className="text-xs font-bold text-forest hover:text-forest-light flex items-center gap-1.5 transition-colors"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {loading ? (
        <div className="p-16 text-center text-gray-400 text-sm">
          Loading your saved products...
        </div>
      ) : wishlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Browse our eco-friendly tableware and click the heart icon to save products here."
          actionText="Explore Products"
          actionLink="/shop"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const hasDiscount = Boolean(
              product.discount_price && 
              Number(product.discount_price) > 0 && 
              Number(product.price) > Number(product.discount_price)
            );

            const currentPrice = hasDiscount ? Number(product.discount_price) : Number(product.price);
            const originalPrice = hasDiscount ? Number(product.price) : null;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square bg-gray-50 overflow-hidden group">
                    <img
                      src={product.image || '/placeholder-product.png'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(product.id)}
                      title="Remove from Wishlist"
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 shadow flex items-center justify-center transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {product.category_name && (
                      <span className="absolute bottom-3 left-3 text-[10px] font-bold bg-white/90 backdrop-blur-sm text-forest px-2.5 py-1 rounded-full shadow-sm">
                        {product.category_name}
                      </span>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <Link to={`/products/${product.slug || product.id}`}>
                      <h3 className="font-bold text-gray-900 text-sm hover:text-forest line-clamp-1 transition-colors">
                        {product.name}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-black text-forest">
                        ₹{currentPrice}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={addingId === product.id}
                    className="w-full py-2.5 bg-forest hover:bg-forest-light text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{addingId === product.id ? 'Adding to Cart...' : 'Move to Cart'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
