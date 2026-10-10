const { db } = require('../config/db');

// Get all saved addresses for user
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    return res.json({ success: true, addresses });
  } catch (err) {
    console.error('[Get Addresses Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch addresses.' });
  }
};

// Create new address
exports.createAddress = async (req, res) => {
  try {
    const { name, phone, house_building, street, city, district, state, pincode, is_default } = req.body;

    if (!name || !phone || !house_building || !street || !city || !district || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'All address fields (Name, Phone, House/Building, Street, City, District, State, PIN Code) are required.'
      });
    }

    // If setting as default or if this is the first address, clear other defaults
    const existingList = await db.query('SELECT id FROM addresses WHERE user_id = ?', [req.user.id]);
    const shouldBeDefault = is_default || existingList.length === 0;

    if (shouldBeDefault) {
      await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    const result = await db.run(
      `INSERT INTO addresses (user_id, name, phone, house_building, street, city, district, state, pincode, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        name.trim(),
        phone.trim(),
        house_building.trim(),
        street.trim(),
        city.trim(),
        district.trim(),
        state.trim(),
        pincode.trim(),
        shouldBeDefault ? 1 : 0
      ]
    );

    const newAddress = await db.get('SELECT * FROM addresses WHERE id = ?', [result.lastInsertRowid]);
    return res.status(201).json({
      success: true,
      message: 'Address saved successfully.',
      address: newAddress
    });
  } catch (err) {
    console.error('[Create Address Error]', err);
    return res.status(500).json({ success: false, message: 'Could not save address.' });
  }
};

// Update existing address
exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.get('SELECT * FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }

    const { name, phone, house_building, street, city, district, state, pincode, is_default } = req.body;

    if (is_default) {
      await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }

    await db.run(
      `UPDATE addresses SET 
        name = ?, phone = ?, house_building = ?, street = ?, 
        city = ?, district = ?, state = ?, pincode = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      [
        name !== undefined ? name.trim() : existing.name,
        phone !== undefined ? phone.trim() : existing.phone,
        house_building !== undefined ? house_building.trim() : existing.house_building,
        street !== undefined ? street.trim() : existing.street,
        city !== undefined ? city.trim() : existing.city,
        district !== undefined ? district.trim() : existing.district,
        state !== undefined ? state.trim() : existing.state,
        pincode !== undefined ? pincode.trim() : existing.pincode,
        is_default !== undefined ? (is_default ? 1 : 0) : existing.is_default,
        id,
        req.user.id
      ]
    );

    const updated = await db.get('SELECT * FROM addresses WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Address updated successfully.',
      address: updated
    });
  } catch (err) {
    console.error('[Update Address Error]', err);
    return res.status(500).json({ success: false, message: 'Could not update address.' });
  }
};

// Set address as default
exports.setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    await db.run('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, req.user.id]);

    const updated = await db.get('SELECT * FROM addresses WHERE id = ?', [id]);
    return res.json({
      success: true,
      message: 'Default address set.',
      address: updated
    });
  } catch (err) {
    console.error('[Set Default Address Error]', err);
    return res.status(500).json({ success: false, message: 'Could not set default address.' });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, req.user.id]);
    return res.json({ success: true, message: 'Address deleted successfully.' });
  } catch (err) {
    console.error('[Delete Address Error]', err);
    return res.status(500).json({ success: false, message: 'Could not delete address.' });
  }
};
