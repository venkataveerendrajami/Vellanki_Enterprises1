const { db } = require('../config/db');

// Public: Get all store settings
exports.getSettings = async (req, res) => {
  try {
    const rows = await db.query('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });

    return res.json({ success: true, settings });
  } catch (err) {
    console.error('[Get Settings Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch settings.' });
  }
};

// Admin: Update settings (key-value pairs)
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body; // e.g. { phone: '+91 ...', delivery_charge: '50' }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid settings payload.' });
    }

    for (const [key, value] of Object.entries(updates)) {
      const existing = await db.get('SELECT key FROM settings WHERE key = ?', [key]);
      if (existing) {
        await db.run('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [String(value), key]);
      } else {
        await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
      }
    }

    const rows = await db.query('SELECT key, value FROM settings');
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = r.value;
    });

    return res.json({
      success: true,
      message: 'Store settings updated successfully.',
      settings
    });
  } catch (err) {
    console.error('[Update Settings Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to update settings.' });
  }
};

// Public: Submit Contact Inquiry
exports.submitContactMessage = (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
    }

    console.log(`[Contact Inquiry Received] From: ${name} (${email}, ${phone || 'N/A'}): ${message}`);

    return res.json({
      success: true,
      message: 'Thank you for reaching out to VELLANKI ENTERPRISES! Our team will get back to you shortly.'
    });
  } catch (err) {
    console.error('[Contact Submit Error]', err);
    return res.status(500).json({ success: false, message: 'Could not submit inquiry.' });
  }
};
