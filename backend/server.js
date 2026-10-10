require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { initDatabase, db } = require('./config/db');
const apiRoutes = require('./routes/api');

// Initialize database tables and configuration
Promise.resolve(initDatabase()).catch((err) => {
  console.error('[Fatal Error] Failed to initialize database:', err);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists and serve statically
const uploadDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// System Health Check
app.get('/api/health', async (req, res) => {
  try {
    const productCountRow = await db.get('SELECT COUNT(*) as count FROM products');
    const categoryCountRow = await db.get('SELECT COUNT(*) as count FROM categories');
    const productCount = productCountRow ? Number(productCountRow.count) : 0;
    const categoryCount = categoryCountRow ? Number(categoryCountRow.count) : 0;
    return res.json({
      success: true,
      status: 'online',
      message: 'VELLANKI ENTERPRISES API is operational',
      databaseType: db.isPostgres ? 'supabase (postgresql)' : 'sqlite',
      productsCount: productCount,
      categoriesCount: categoryCount,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, status: 'error', message: err.message });
  }
});

// API Routes
app.use('/api', apiRoutes);

// Serve frontend build in production / single-server mode if dist exists
const frontendDist = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log(`[Frontend] Serving static frontend build from: ${frontendDist}`);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  if (err.name === 'MulterError') {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  return res.status(500).json({
    success: false,
    message: err.message || 'Internal server error occurred.'
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log('========================================================');
  console.log(`🌿 VELLANKI ENTERPRISES Server running on port ${PORT}`);
  console.log(`🌐 Website URL:  http://localhost:${PORT}`);
  console.log(`🌐 API Endpoint: http://localhost:${PORT}/api`);
  console.log(`🩺 Healthcheck:  http://localhost:${PORT}/api/health`);
  console.log('========================================================');
});

