const jwt = require('jsonwebtoken');
const { db } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'vellanki_super_secret_jwt_key_2026_change_in_production';

// Verify JWT token for authenticated requests
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please login.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT id, name, email, phone, role FROM users WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please login again.' });
  }
}

// Require Admin authorization
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// Optional Auth (extracts user if token is present, continues otherwise)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await db.get('SELECT id, name, email, phone, role FROM users WHERE id = ?', [decoded.id]);
      if (user) {
        req.user = user;
      }
    } catch (e) {
      // Ignore token parse error for optional auth
    }
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin,
  optionalAuth,
  JWT_SECRET
};
