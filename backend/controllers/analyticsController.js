const { db } = require('../config/db');

// Admin Dashboard Summary Metrics
exports.getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Sales metrics (only count non-cancelled orders)
    const totalSalesRow = await db.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as "totalRevenue",
        COUNT(id) as "totalOrders"
      FROM orders 
      WHERE order_status != 'Cancelled'
    `);

    // Today's Sales
    const todaySalesRow = await db.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as "todayRevenue",
        COUNT(id) as "todayOrders"
      FROM orders 
      WHERE order_status != 'Cancelled' 
        AND created_at >= ?
    `, [todayStart]);

    // This Week's Sales (last 7 days)
    const weekSalesRow = await db.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as "weekRevenue",
        COUNT(id) as "weekOrders"
      FROM orders 
      WHERE order_status != 'Cancelled' 
        AND created_at >= ?
    `, [weekAgo]);

    // This Month's Sales (last 30 days)
    const monthSalesRow = await db.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as "monthRevenue",
        COUNT(id) as "monthOrders"
      FROM orders 
      WHERE order_status != 'Cancelled' 
        AND created_at >= ?
    `, [monthAgo]);

    // Order status breakdown
    const pendingOrdersRow = await db.get(`
      SELECT COUNT(id) as count FROM orders 
      WHERE order_status IN ('Order Placed', 'Payment Confirmed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery')
    `);

    const deliveredOrdersRow = await db.get(`
      SELECT COUNT(id) as count FROM orders WHERE order_status = 'Delivered'
    `);

    const cancelledOrdersRow = await db.get(`
      SELECT COUNT(id) as count FROM orders WHERE order_status = 'Cancelled'
    `);

    // 2. Product metrics
    const totalProductsRow = await db.get(`SELECT COUNT(id) as count FROM products WHERE status != 'archived'`);
    const activeProductsRow = await db.get(`SELECT COUNT(id) as count FROM products WHERE status = 'active'`);
    const outOfStockRow = await db.get(`SELECT COUNT(id) as count FROM products WHERE stock <= 0 AND status = 'active'`);

    // Low stock products warning (< 10 units)
    const lowStockItems = await db.query(`
      SELECT id, name, sku, stock, price, image 
      FROM products 
      WHERE stock <= 10 AND status = 'active'
      ORDER BY stock ASC 
      LIMIT 5
    `);

    // 3. Customer metrics
    const totalCustomersRow = await db.get(`SELECT COUNT(id) as count FROM users WHERE role = 'customer'`);
    const newCustomersRow = await db.get(`
      SELECT COUNT(id) as count FROM users 
      WHERE role = 'customer' AND created_at >= ?
    `, [monthAgo]);

    // Recent 5 Orders
    const recentOrders = await db.query(`
      SELECT o.id, o.order_number, o.total_amount, o.order_status, o.created_at, u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    return res.json({
      success: true,
      data: {
        sales: {
          todayRevenue: Number(todaySalesRow?.todayRevenue || 0),
          todayOrders: Number(todaySalesRow?.todayOrders || 0),
          weekRevenue: Number(weekSalesRow?.weekRevenue || 0),
          weekOrders: Number(weekSalesRow?.weekOrders || 0),
          monthRevenue: Number(monthSalesRow?.monthRevenue || 0),
          monthOrders: Number(monthSalesRow?.monthOrders || 0),
          totalRevenue: Number(totalSalesRow?.totalRevenue || 0),
          totalOrders: Number(totalSalesRow?.totalOrders || 0),
          pendingOrders: Number(pendingOrdersRow?.count || 0),
          deliveredOrders: Number(deliveredOrdersRow?.count || 0),
          cancelledOrders: Number(cancelledOrdersRow?.count || 0)
        },
        products: {
          total: Number(totalProductsRow?.count || 0),
          active: Number(activeProductsRow?.count || 0),
          outOfStock: Number(outOfStockRow?.count || 0),
          lowStockList: lowStockItems
        },
        customers: {
          total: Number(totalCustomersRow?.count || 0),
          newLast30Days: Number(newCustomersRow?.count || 0)
        },
        recentOrders
      }
    });
  } catch (err) {
    console.error('[Dashboard Summary Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch dashboard summary.' });
  }
};

// Admin Sales Analytics: Daily, Weekly, Monthly Trends & Top Selling Products
exports.getSalesAnalytics = async (req, res) => {
  try {
    const { range = '30d' } = req.query; // '7d', '30d', '90d', '1y'

    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;
    else if (range === '1y') days = 365;

    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Daily revenue and orders for chart
    const dailyData = await db.query(`
      SELECT 
        date(created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(id) as orders
      FROM orders
      WHERE order_status != 'Cancelled' 
        AND created_at >= ?
      GROUP BY date(created_at)
      ORDER BY date ASC
    `, [sinceDate]);

    // Top selling products
    const topProducts = await db.query(`
      SELECT 
        oi.product_id,
        oi.product_name,
        SUM(oi.quantity) as units_sold,
        SUM(oi.quantity * oi.price) as total_sales,
        p.image as product_image
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.order_status != 'Cancelled'
      GROUP BY oi.product_id, oi.product_name, p.image
      ORDER BY units_sold DESC
      LIMIT 10
    `);

    // Aggregates for the selected period
    const periodAggregates = await db.get(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as "totalRevenue",
        COUNT(id) as "totalOrders",
        COALESCE((
          SELECT SUM(oi.quantity) 
          FROM order_items oi 
          JOIN orders ord ON oi.order_id = ord.id 
          WHERE ord.order_status != 'Cancelled' 
            AND ord.created_at >= ?
        ), 0) as "productsSold"
      FROM orders
      WHERE order_status != 'Cancelled' 
        AND created_at >= ?
    `, [sinceDate, sinceDate]);

    return res.json({
      success: true,
      range,
      aggregates: {
        totalRevenue: periodAggregates ? Number(periodAggregates.totalRevenue) : 0,
        totalOrders: periodAggregates ? Number(periodAggregates.totalOrders) : 0,
        productsSold: periodAggregates ? Number(periodAggregates.productsSold) : 0
      },
      dailyData: dailyData.map(d => ({
        date: String(d.date).slice(0, 10),
        revenue: Number(d.revenue),
        orders: Number(d.orders)
      })),
      topProducts
    });
  } catch (err) {
    console.error('[Sales Analytics Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch sales analytics.' });
  }
};

// Admin: Customers List
exports.getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let whereClauses = ["role = 'customer'"];
    let params = [];

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?)');
      params.push(term, term, term);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const countRow = await db.get(`SELECT COUNT(id) as total FROM users ${whereSql}`, params);
    const total = countRow ? Number(countRow.total) : 0;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const customers = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.created_at,
        u.phone_verified, u.email_verified, u.status, u.last_login,
        COUNT(o.id) as order_count,
        COALESCE(SUM(CASE WHEN o.order_status != 'Cancelled' THEN o.total_amount ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      ${whereSql}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limitNum, offset]);

    return res.json({
      success: true,
      customers: customers.map(c => ({
        ...c,
        phone_verified: Boolean(c.phone_verified),
        email_verified: Boolean(c.email_verified),
        status: c.status || 'active',
        order_count: Number(c.order_count),
        total_spent: Number(c.total_spent)
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 0
      }
    });
  } catch (err) {
    console.error('[Get Customers Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch customers.' });
  }
};

// Admin: Toggle customer account status (active / suspended)
exports.updateCustomerStatus = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active or suspended.' });
    }

    const customer = await db.get("SELECT id, name, role FROM users WHERE id = ?", [customerId]);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer account not found.' });
    }

    if (customer.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot suspend an administrator account.' });
    }

    await db.run("UPDATE users SET status = ? WHERE id = ?", [status, customerId]);
    return res.json({
      success: true,
      message: `Customer account has been ${status === 'active' ? 'activated' : 'suspended'}.`
    });
  } catch (err) {
    console.error('[Update Customer Status Error]', err);
    return res.status(500).json({ success: false, message: 'Could not update customer status.' });
  }
};
