const { db } = require('../config/db');

// Get authenticated customer's wishlist items with product details
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const items = await db.query(`
      SELECT 
        w.id as wishlist_id,
        w.created_at as saved_at,
        p.id,
        p.name,
        p.slug,
        p.price,
        p.discount_price,
        p.stock,
        p.image,
        p.status,
        c.name as category_name
      FROM wishlists w
      JOIN products p ON p.id = w.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE w.user_id = ?
      ORDER BY w.created_at DESC
    `, [userId]);

    const enriched = await Promise.all(items.map(async item => {
      const variants = await db.query('SELECT * FROM product_variants WHERE product_id = ? ORDER BY price ASC', [item.id]);
      let displayPrice = item.discount_price && item.discount_price > 0 ? item.discount_price : item.price;
      if (variants.length > 0) {
        displayPrice = variants[0].price;
      }
      return {
        ...item,
        display_price: displayPrice,
        variants
      };
    }));

    return res.json({
      success: true,
      wishlist: enriched
    });
  } catch (err) {
    console.error('[Get Wishlist Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch wishlist.' });
  }
};

// Toggle product in wishlist (Add if absent, Remove if present)
exports.toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    const product = await db.get('SELECT id, name FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const existing = await db.get('SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);

    if (existing) {
      await db.run('DELETE FROM wishlists WHERE id = ?', [existing.id]);
      return res.json({
        success: true,
        action: 'removed',
        message: `${product.name} removed from your wishlist.`
      });
    } else {
      await db.run('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [userId, productId]);
      return res.json({
        success: true,
        action: 'added',
        message: `${product.name} added to your wishlist.`
      });
    }
  } catch (err) {
    console.error('[Toggle Wishlist Error]', err);
    return res.status(500).json({ success: false, message: 'Could not update wishlist.' });
  }
};

// Remove single product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId;

    await db.run('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [userId, productId]);
    return res.json({
      success: true,
      message: 'Item removed from wishlist.'
    });
  } catch (err) {
    console.error('[Remove Wishlist Error]', err);
    return res.status(500).json({ success: false, message: 'Could not remove item from wishlist.' });
  }
};
