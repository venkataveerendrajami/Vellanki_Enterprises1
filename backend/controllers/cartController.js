const { db } = require('../config/db');

// Helper to calculate cart totals
async function calculateCartTotals(userId) {
  const items = await db.query(
    `SELECT 
      ci.id as cart_item_id,
      ci.quantity,
      ci.variant_id,
      p.id as product_id,
      p.name as product_name,
      p.slug as product_slug,
      p.image as product_image,
      p.price as base_price,
      p.discount_price,
      p.stock as product_stock,
      p.status as product_status,
      pv.variant_name,
      pv.size as variant_size,
      pv.price as variant_price,
      pv.stock as variant_stock,
      pv.sku as variant_sku
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    LEFT JOIN product_variants pv ON ci.variant_id = pv.id
    WHERE ci.user_id = ?
    ORDER BY ci.created_at DESC`,
    [userId]
  );

  let subtotal = 0;
  let totalItemsCount = 0;

  const formattedItems = items.map(item => {
    // Current price is product discount price (if set), else variant price, else base price
    const unitPrice = (item.discount_price !== null && item.discount_price > 0)
      ? item.discount_price
      : (item.variant_id && item.variant_price !== null ? item.variant_price : item.base_price);

    const availableStock = item.variant_id && item.variant_stock !== null
      ? item.variant_stock
      : item.product_stock;

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;
    totalItemsCount += item.quantity;

    return {
      id: item.cart_item_id,
      productId: item.product_id,
      productName: item.product_name,
      productSlug: item.product_slug,
      productImage: item.product_image,
      variantId: item.variant_id,
      variantName: item.variant_name,
      variantSize: item.variant_size,
      unitPrice,
      quantity: item.quantity,
      itemTotal,
      availableStock,
      isOutOfStock: availableStock <= 0,
      isQuantityExceeded: item.quantity > availableStock
    };
  });

  // Fetch shipping rules from settings
  const deliverySetting = await db.get("SELECT value FROM settings WHERE key = 'delivery_charge'");
  const freeThresholdSetting = await db.get("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");

  const baseDeliveryCharge = deliverySetting ? parseFloat(deliverySetting.value) || 0 : 49;
  const freeThreshold = freeThresholdSetting ? parseFloat(freeThresholdSetting.value) || 499 : 499;

  let deliveryCharge = 0;
  if (subtotal > 0 && subtotal < freeThreshold) {
    deliveryCharge = baseDeliveryCharge;
  }

  const grandTotal = subtotal + deliveryCharge;

  return {
    items: formattedItems,
    summary: {
      itemsCount: totalItemsCount,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryCharge: Math.round(deliveryCharge * 100) / 100,
      freeShippingThreshold: freeThreshold,
      amountNeededForFreeShipping: Math.max(0, freeThreshold - subtotal),
      discount: 0,
      grandTotal: Math.round(grandTotal * 100) / 100
    }
  };
}

// Get Cart
exports.getCart = async (req, res) => {
  try {
    const data = await calculateCartTotals(req.user.id);
    return res.json({ success: true, ...data });
  } catch (err) {
    console.error('[Get Cart Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve shopping cart.' });
  }
};

// Add to Cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await db.get("SELECT * FROM products WHERE id = ? AND status = 'active'", [productId]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product is currently not available.' });
    }

    // Verify stock
    let stock = product.stock;
    if (variantId) {
      const variant = await db.get('SELECT * FROM product_variants WHERE id = ? AND product_id = ?', [variantId, productId]);
      if (!variant) {
        return res.status(404).json({ success: false, message: 'Selected variant not found.' });
      }
      stock = variant.stock;
    }

    if (stock <= 0) {
      return res.status(400).json({ success: false, message: 'Selected item is currently Out of Stock.' });
    }

    // Check if item already exists in user cart
    let existing;
    if (variantId) {
      existing = await db.get(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_id = ?',
        [req.user.id, productId, variantId]
      );
    } else {
      existing = await db.get(
        'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND variant_id IS NULL',
        [req.user.id, productId]
      );
    }

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more. Maximum available stock is ${stock}.`
        });
      }
      await db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing.id]);
    } else {
      if (qty > stock) {
        return res.status(400).json({
          success: false,
          message: `Maximum available stock is ${stock}.`
        });
      }
      await db.run(
        'INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
        [req.user.id, productId, variantId || null, qty]
      );
    }

    const cartData = await calculateCartTotals(req.user.id);
    return res.json({
      success: true,
      message: 'Item added to cart!',
      ...cartData
    });
  } catch (err) {
    console.error('[Add to Cart Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
};

// Update Cart Item (Quantity or Variant)
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, variantId } = req.body;

    const item = await db.get('SELECT * FROM cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }

    // Determine target variant and stock
    const targetVariantId = variantId !== undefined ? (variantId ? Number(variantId) : null) : item.variant_id;
    let availableStock = 0;

    if (targetVariantId) {
      const variant = await db.get('SELECT stock FROM product_variants WHERE id = ? AND product_id = ?', [targetVariantId, item.product_id]);
      if (!variant) return res.status(404).json({ success: false, message: 'Variant not found.' });
      availableStock = variant.stock;
    } else {
      const prod = await db.get('SELECT stock FROM products WHERE id = ?', [item.product_id]);
      availableStock = prod ? prod.stock : 0;
    }

    if (quantity !== undefined) {
      const newQty = parseInt(quantity, 10);
      if (newQty <= 0) {
        await db.run('DELETE FROM cart_items WHERE id = ?', [id]);
      } else {
        if (newQty > availableStock) {
          return res.status(400).json({
            success: false,
            message: `Requested quantity exceeds available stock (${availableStock}).`
          });
        }
        await db.run('UPDATE cart_items SET quantity = ?, variant_id = ? WHERE id = ?', [newQty, targetVariantId, id]);
      }
    } else if (variantId !== undefined) {
      await db.run('UPDATE cart_items SET variant_id = ? WHERE id = ?', [targetVariantId, id]);
    }

    const cartData = await calculateCartTotals(req.user.id);
    return res.json({
      success: true,
      message: 'Cart updated successfully.',
      ...cartData
    });
  } catch (err) {
    console.error('[Update Cart Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update cart item.' });
  }
};

// Remove Cart Item
exports.removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, req.user.id]);
    const cartData = await calculateCartTotals(req.user.id);
    return res.json({
      success: true,
      message: 'Item removed from cart.',
      ...cartData
    });
  } catch (err) {
    console.error('[Remove Cart Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to remove cart item.' });
  }
};

// Clear Cart
exports.clearCart = async (req, res) => {
  try {
    await db.run('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    const cartData = await calculateCartTotals(req.user.id);
    return res.json({
      success: true,
      message: 'Cart cleared successfully.',
      ...cartData
    });
  } catch (err) {
    console.error('[Clear Cart Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to clear cart.' });
  }
};
