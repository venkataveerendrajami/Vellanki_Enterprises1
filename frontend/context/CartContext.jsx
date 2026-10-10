import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    itemsCount: 0,
    subtotal: 0,
    deliveryCharge: 0,
    freeShippingThreshold: 499,
    amountNeededForFreeShipping: 499,
    discount: 0,
    grandTotal: 0
  });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSummary({
        itemsCount: 0,
        subtotal: 0,
        deliveryCharge: 0,
        freeShippingThreshold: 499,
        amountNeededForFreeShipping: 499,
        discount: 0,
        grandTotal: 0
      });
      return;
    }

    try {
      setLoading(true);
      const res = await cartAPI.getCart();
      if (res.success) {
        setItems(res.items || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId, variantId = null, quantity = 1) => {
    if (!isAuthenticated) {
      throw new Error('Please login to add items to your cart.');
    }
    const res = await cartAPI.addToCart({ productId, variantId, quantity });
    if (res.success) {
      setItems(res.items || []);
      if (res.summary) setSummary(res.summary);
      return res;
    }
    throw new Error(res.message || 'Could not add item to cart');
  };

  const updateQuantity = async (cartItemId, quantity) => {
    const res = await cartAPI.updateCartItem(cartItemId, { quantity });
    if (res.success) {
      setItems(res.items || []);
      if (res.summary) setSummary(res.summary);
      return res;
    }
    throw new Error(res.message || 'Could not update cart quantity');
  };

  const removeItem = async (cartItemId) => {
    const res = await cartAPI.removeFromCart(cartItemId);
    if (res.success) {
      setItems(res.items || []);
      if (res.summary) setSummary(res.summary);
      return res;
    }
    throw new Error(res.message || 'Could not remove item from cart');
  };

  const clearCart = async () => {
    const res = await cartAPI.clearCart();
    if (res.success) {
      setItems([]);
      if (res.summary) setSummary(res.summary);
    }
  };

  const totalCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      summary,
      loading,
      cartCount: totalCount,
      fetchCart,
      addToCart,
      updateQuantity,
      removeItem,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
