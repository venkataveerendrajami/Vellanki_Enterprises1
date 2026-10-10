const { db } = require('../config/db');
const razorpayService = require('../services/razorpayService');

// Helper to generate sequential order number: VE100001
async function generateOrderNumber() {
  const lastOrder = await db.get('SELECT order_number FROM orders ORDER BY id DESC LIMIT 1');
  if (!lastOrder || !lastOrder.order_number) {
    return 'VE100001';
  }
  const match = lastOrder.order_number.match(/VE(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `VE${nextNum}`;
  }
  return `VE${Date.now().toString().slice(-6)}`;
}

// Customer: Place Order (From Cart or Direct Buy)
exports.placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      addressId,
      items: directItems,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentMethod = 'Online / Razorpay'
    } = req.body;

    if (!addressId) {
      return res.status(400).json({ success: false, message: 'Delivery address is required.' });
    }

    // Get address snapshot
    const address = await db.get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
    if (!address) {
      return res.status(404).json({ success: false, message: 'Selected address not found.' });
    }

    const deliveryAddressJson = JSON.stringify({
      name: address.name,
      phone: address.phone,
      house_building: address.house_building,
      street: address.street,
      city: address.city,
      district: address.district,
      state: address.state,
      pincode: address.pincode
    });

    // Gather items to order
    let orderItemsData = [];

    if (directItems && Array.isArray(directItems) && directItems.length > 0) {
      // Direct checkout
      orderItemsData = directItems;
    } else {
      // Fetch from cart
      const cartItems = await db.query(
        `SELECT 
          ci.id, ci.product_id, ci.variant_id, ci.quantity,
          p.name as product_name, p.price as base_price, p.discount_price, p.stock as product_stock, p.status,
          pv.size as variant_size, pv.price as variant_price, pv.stock as variant_stock
         FROM cart_items ci
         JOIN products p ON ci.product_id = p.id
         LEFT JOIN product_variants pv ON ci.variant_id = pv.id
         WHERE ci.user_id = ?`,
        [userId]
      );

      if (cartItems.length === 0) {
        return res.status(400).json({ success: false, message: 'Your cart is empty.' });
      }

      orderItemsData = cartItems.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        variant_size: item.variant_size || null,
        quantity: item.quantity,
        price: (item.discount_price && item.discount_price > 0)
          ? item.discount_price
          : (item.variant_id && item.variant_price !== null ? item.variant_price : item.base_price)
      }));
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    for (const item of orderItemsData) {
      const product = await db.get("SELECT * FROM products WHERE id = ? AND status = 'active'", [item.product_id]);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.product_name} is no longer available.` });
      }

      let availableStock = product.stock;
      if (item.variant_id) {
        const variant = await db.get('SELECT * FROM product_variants WHERE id = ? AND product_id = ?', [item.variant_id, item.product_id]);
        if (!variant) {
          return res.status(400).json({ success: false, message: `Selected variant for ${item.product_name} is no longer available.` });
        }
        availableStock = variant.stock;
        item.variant_size = variant.size;
        item.price = variant.price;
      } else {
        item.price = product.discount_price && product.discount_price > 0 ? product.discount_price : product.price;
      }

      item.product_name = product.name;

      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product_name} (${item.variant_size || 'Standard'}). Available: ${availableStock}`
        });
      }

      subtotal += item.price * item.quantity;
    }

    // Calculate delivery charges
    const deliverySetting = await db.get("SELECT value FROM settings WHERE key = 'delivery_charge'");
    const freeThresholdSetting = await db.get("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");
    const baseDelivery = deliverySetting ? parseFloat(deliverySetting.value) || 0 : 49;
    const freeThreshold = freeThresholdSetting ? parseFloat(freeThresholdSetting.value) || 499 : 499;

    const deliveryCharge = subtotal >= freeThreshold ? 0 : baseDelivery;
    const discount = 0;
    const totalAmount = subtotal + deliveryCharge - discount;

    // Verify payment if payment details sent
    let paymentStatus = 'pending';
    let initialOrderStatus = 'Order Placed';

    if (razorpay_payment_id) {
      const isSignatureValid = razorpayService.verifySignature({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      });

      if (!isSignatureValid) {
        return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
      }

      paymentStatus = 'paid';
      initialOrderStatus = 'Payment Confirmed';
    }

    const orderNumber = await generateOrderNumber();

    // Begin database order creation
    const orderRes = await db.run(
      `INSERT INTO orders (
        order_number, user_id, address_id, delivery_address_json,
        subtotal, delivery_charge, discount, total_amount,
        payment_status, order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderNumber,
        userId,
        addressId,
        deliveryAddressJson,
        subtotal,
        deliveryCharge,
        discount,
        totalAmount,
        paymentStatus,
        initialOrderStatus
      ]
    );

    const orderId = orderRes.lastInsertRowid;

    // Insert order items & reduce stock safely
    for (const item of orderItemsData) {
      await db.run(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_size, quantity, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.variant_id || null,
          item.product_name,
          item.variant_size || null,
          item.quantity,
          item.price
        ]
      );

      // Reduce stock (ANSI SQL CASE expression compatible across Postgres and SQLite)
      if (item.variant_id) {
        await db.run('UPDATE product_variants SET stock = CASE WHEN stock >= ? THEN stock - ? ELSE 0 END WHERE id = ?', [item.quantity, item.quantity, item.variant_id]);
      }
      await db.run('UPDATE products SET stock = CASE WHEN stock >= ? THEN stock - ? ELSE 0 END WHERE id = ?', [item.quantity, item.quantity, item.product_id]);
    }

    // Save payment record if paid
    if (paymentStatus === 'paid') {
      await db.run(
        `INSERT INTO payments (order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, method)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          razorpay_order_id || null,
          razorpay_payment_id,
          razorpay_signature || null,
          totalAmount,
          'captured',
          paymentMethod
        ]
      );
    }

    // Clear cart
    await db.run('DELETE FROM cart_items WHERE user_id = ?', [userId]);

    const finalOrder = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        ...finalOrder,
        delivery_address: JSON.parse(finalOrder.delivery_address_json)
      }
    });
  } catch (err) {
    console.error('[Place Order Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
};

// Customer: Get My Orders
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await db.query(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    const populatedOrders = await Promise.all(orders.map(async ord => {
      const items = await db.query(
        `SELECT oi.*, p.image as product_image, p.slug as product_slug 
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [ord.id]
      );

      return {
        ...ord,
        delivery_address: JSON.parse(ord.delivery_address_json),
        items
      };
    }));

    return res.json({ success: true, orders: populatedOrders });
  } catch (err) {
    console.error('[Get My Orders Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch your orders.' });
  }
};

// Customer / Admin: Get Single Order Details with Tracking Timeline
exports.getOrderDetails = async (req, res) => {
  try {
    const { idOrNumber } = req.params;
    const isId = !isNaN(idOrNumber);

    const order = await db.get(
      `SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE ${isId ? 'o.id = ?' : 'o.order_number = ?'}`,
      [isId ? Number(idOrNumber) : idOrNumber]
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Role check: customer can only view their own order
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const items = await db.query(
      `SELECT oi.*, p.image as product_image, p.slug as product_slug 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    const payment = await db.get('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC LIMIT 1', [order.id]);

    // Construct tracking stages timeline
    const allStages = [
      'Order Placed',
      'Payment Confirmed',
      'Processing',
      'Packed',
      'Shipped',
      'Out for Delivery',
      'Delivered'
    ];

    const currentIdx = allStages.indexOf(order.order_status);
    const timeline = allStages.map((stage, idx) => ({
      stage,
      completed: order.order_status === 'Delivered' || (currentIdx >= idx && order.order_status !== 'Cancelled'),
      current: order.order_status === stage,
      isCancelled: order.order_status === 'Cancelled'
    }));

    return res.json({
      success: true,
      order: {
        ...order,
        delivery_address: JSON.parse(order.delivery_address_json),
        items,
        payment,
        timeline
      }
    });
  } catch (err) {
    console.error('[Get Order Details Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch order details.' });
  }
};

// Customer: Cancel Order (Only if not yet packed/shipped)
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await db.get('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (!['Order Placed', 'Payment Confirmed'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in its current status: ${order.order_status}.`
      });
    }

    // Restore stock
    const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      if (item.variant_id) {
        await db.run('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [item.quantity, item.variant_id]);
      }
      if (item.product_id) {
        await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }
    }

    await db.run("UPDATE orders SET order_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [id]);

    return res.json({ success: true, message: 'Order cancelled successfully.' });
  } catch (err) {
    console.error('[Cancel Order Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
};

// Admin: Get All Orders with Filters & Search
exports.getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    let whereClauses = [];
    let params = [];

    if (status && status !== 'all') {
      whereClauses.push('o.order_status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      whereClauses.push(`(
        LOWER(o.order_number) LIKE ? OR 
        LOWER(u.name) LIKE ? OR 
        LOWER(u.email) LIKE ? OR 
        LOWER(u.phone) LIKE ?
      )`);
      params.push(term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await db.get(
      `SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id ${whereSql}`,
      params
    );
    const total = countRow ? Number(countRow.total) : 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const sql = `
      SELECT o.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${whereSql}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const orders = await db.query(sql, [...params, limitNum, offset]);

    const populated = orders.map(ord => ({
      ...ord,
      delivery_address: JSON.parse(ord.delivery_address_json)
    }));

    return res.json({
      success: true,
      orders: populated,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0
      }
    });
  } catch (err) {
    console.error('[Admin Orders Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch orders list.' });
  }
};

// Admin: Update Order Status & Notes
exports.updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, paymentStatus } = req.body;

    const order = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const validStatuses = [
      'Order Placed',
      'Payment Confirmed',
      'Processing',
      'Packed',
      'Shipped',
      'Out for Delivery',
      'Delivered',
      'Cancelled'
    ];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status provided.' });
    }

    // If changing to Cancelled from an active status, restore inventory
    if (status === 'Cancelled' && order.order_status !== 'Cancelled') {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        if (item.variant_id) {
          await db.run('UPDATE product_variants SET stock = stock + ? WHERE id = ?', [item.quantity, item.variant_id]);
        }
        if (item.product_id) {
          await db.run('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
      }
    }

    const newStatus = status || order.order_status;
    const newNotes = notes !== undefined ? notes : order.notes;
    const newPaymentStatus = paymentStatus || order.payment_status;

    await db.run(
      `UPDATE orders SET order_status = ?, notes = ?, payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newStatus, newNotes, newPaymentStatus, id]
    );

    const updated = await db.get('SELECT * FROM orders WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: `Order status updated to ${newStatus}.`,
      order: {
        ...updated,
        delivery_address: JSON.parse(updated.delivery_address_json)
      }
    });
  } catch (err) {
    console.error('[Update Order Status Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update order status.' });
  }
};
