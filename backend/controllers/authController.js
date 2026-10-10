const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const otpService = require('../services/otpService');

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function safeUserPayload(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    phone_verified: Boolean(user.phone_verified),
    email_verified: Boolean(user.email_verified),
    status: user.status || 'active',
    last_login: user.last_login,
    created_at: user.created_at
  };
}

// 1. Register customer with optional immediate OTP verification
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, verificationOtp, verifiedChannel } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone ? phone.trim().replace(/[^\d+]/g, '') : null;

    const existingEmail = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    if (cleanPhone) {
      const existingPhone = await db.get('SELECT id FROM users WHERE phone = ? OR phone = ?', [cleanPhone, cleanPhone.replace(/^\+91/, '')]);
      if (existingPhone) {
        return res.status(400).json({ success: false, message: 'An account with this mobile phone number already exists.' });
      }
    }

    let phoneVerified = 0;
    let emailVerified = 0;

    // If customer provided an OTP during registration to verify their contact details
    if (verificationOtp) {
      const verifyTarget = (verifiedChannel === 'email') ? cleanEmail : cleanPhone;
      if (verifyTarget) {
        const verifyRes = await otpService.verifyOtp({
          identifier: verifyTarget,
          otp: verificationOtp,
          purpose: 'register'
        });
        if (verifyRes.success) {
          if (verifiedChannel === 'email') {
            emailVerified = 1;
          } else {
            phoneVerified = 1;
          }
        }
      }
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = await db.run(
      `INSERT INTO users (name, email, phone, password_hash, role, phone_verified, email_verified, status, last_login) 
       VALUES (?, ?, ?, ?, 'customer', ?, ?, 'active', CURRENT_TIMESTAMP)`,
      [name.trim(), cleanEmail, cleanPhone, password_hash, phoneVerified, emailVerified]
    );

    const user = await db.get('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: safeUserPayload(user)
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

// 2. Login customer or admin using email or phone + password
exports.login = async (req, res) => {
  try {
    const { identifier, email, phone, password } = req.body;
    const loginKey = (identifier || email || phone || '').trim().toLowerCase();

    if (!loginKey || !password) {
      return res.status(400).json({ success: false, message: 'Email/Mobile and password are required.' });
    }

    // Search by email or phone
    const user = await db.get(
      `SELECT * FROM users WHERE LOWER(email) = ? OR phone = ? OR phone = ?`,
      [loginKey, loginKey, loginKey.replace(/^\+91/, '')]
    );

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact customer support.'
      });
    }

    // Check brute-force lockout
    if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
      const waitMinutes = Math.ceil((new Date(user.lockout_until) - new Date()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${waitMinutes} minutes or reset your password.`
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      const attempts = (user.failed_login_attempts || 0) + 1;
      if (attempts >= 5) {
        const lockoutDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await db.run(
          `UPDATE users SET failed_login_attempts = ?, lockout_until = ? WHERE id = ?`,
          [attempts, lockoutDate, user.id]
        );
        return res.status(429).json({
          success: false,
          message: 'Too many failed login attempts. Your account has been locked for 15 minutes.'
        });
      } else {
        await db.run('UPDATE users SET failed_login_attempts = ? WHERE id = ?', [attempts, user.id]);
        const remaining = 5 - attempts;
        return res.status(401).json({
          success: false,
          message: `Incorrect password. (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining before lockout)`
        });
      }
    }

    // Reset failed login attempts and update last_login
    await db.run(
      `UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?`,
      [user.id]
    );

    const token = generateToken(user);
    const updatedUser = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);

    return res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: safeUserPayload(updatedUser)
    });
  } catch (err) {
    console.error('[Login Error]', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// 3. Admin Login endpoint (explicit role check)
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [cleanEmail]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Administrator account not found.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You do not have administrator permissions.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ success: false, message: 'Administrator account is suspended.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    await db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
    const token = generateToken(user);

    return res.json({
      success: true,
      message: 'Admin authentication successful.',
      token,
      user: safeUserPayload(user)
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    return res.status(500).json({ success: false, message: 'Server error during admin login.' });
  }
};

// 4. Send Email OTP via Brevo API (Supports login, register, forgot_password, verify_email)
exports.sendOtp = async (req, res) => {
  try {
    const { identifier, email, purpose = 'login' } = req.body;
    const rawInput = (email || identifier || '').trim();
    if (!rawInput) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }
    const clean = rawInput.toLowerCase();
    const isEmail = clean.includes('@');

    let deliveryTarget = clean;
    let customerName = 'Customer';

    // If identifier is not an email, try resolving customer's registered email
    if (!isEmail) {
      const existing = await db.get(
        'SELECT id, name, email, phone, status FROM users WHERE phone = ? OR phone = ? OR LOWER(email) = ?',
        [clean, clean.replace(/^\+91/, ''), clean]
      );
      if (!existing || !existing.email || existing.email.endsWith('@phone.vellanki.local')) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address to receive your verification code.'
        });
      }
      if (existing.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'This account has been suspended. Please contact customer support.'
        });
      }
      deliveryTarget = existing.email.toLowerCase();
      customerName = existing.name || 'Customer';
    } else {
      const existing = await db.get('SELECT name, status FROM users WHERE LOWER(email) = ?', [clean]);
      if (existing) {
        if (existing.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'This account has been suspended. Please contact customer support.'
          });
        }
        customerName = existing.name || 'Customer';
      } else if (purpose === 'forgot_password') {
        return res.status(404).json({
          success: false,
          message: 'No registered customer account found with this email address.'
        });
      }
    }

    const result = await otpService.sendOtp({
      identifier: clean,
      deliveryTarget,
      channel: 'email',
      purpose,
      customerName
    });

    return res.json(result);
  } catch (err) {
    if (err.message && err.message.includes('Please wait')) {
      return res.status(429).json({ success: false, message: err.message });
    }
    console.error('[Send OTP Controller Error]', err);
    return res.status(400).json({ success: false, message: err.message || 'Could not send verification code.' });
  }
};

// 5. Verify OTP and Login / Auto-Register Customer
exports.verifyOtpAndLogin = async (req, res) => {
  try {
    const { identifier, otp, name, purpose = 'login' } = req.body;
    if (!identifier || !otp) {
      return res.status(400).json({ success: false, message: 'Identifier and OTP code are required.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const verification = await otpService.verifyOtp({ identifier: cleanIdentifier, otp, purpose });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    // Find user by email or phone
    let user = await db.get(
      'SELECT * FROM users WHERE LOWER(email) = ? OR phone = ? OR phone = ?',
      [cleanIdentifier, cleanIdentifier, cleanIdentifier.replace(/^\+91/, '')]
    );

    const isEmail = cleanIdentifier.includes('@');

    // If user does not exist yet, auto-register seamless customer account
    if (!user) {
      const defaultName = name && name.trim() ? name.trim() : (isEmail ? cleanIdentifier.split('@')[0] : `Customer ${cleanIdentifier.slice(-4)}`);
      const userEmail = isEmail ? cleanIdentifier : `${cleanIdentifier}@phone.vellanki.local`;
      const userPhone = isEmail ? null : cleanIdentifier;
      const dummyHash = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10);
      const phoneVerified = isEmail ? 0 : 1;
      const emailVerified = isEmail ? 1 : 0;

      const insertRes = await db.run(
        `INSERT INTO users (name, email, phone, password_hash, role, phone_verified, email_verified, status, last_login) 
         VALUES (?, ?, ?, ?, 'customer', ?, ?, 'active', CURRENT_TIMESTAMP)`,
        [defaultName, userEmail, userPhone, dummyHash, phoneVerified, emailVerified]
      );

      user = await db.get('SELECT * FROM users WHERE id = ?', [insertRes.lastInsertRowid]);
    } else {
      // Check if suspended
      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been suspended. Please contact customer support.'
        });
      }

      // Mark the verified channel on the existing user and update name if provided
      let updateSql = "UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, last_login = CURRENT_TIMESTAMP";
      const updateParams = [];
      if (name && name.trim() && (!user.name || user.name.startsWith('Customer') || user.name === user.email.split('@')[0])) {
        updateSql += ", name = ?";
        updateParams.push(name.trim());
      }
      if (isEmail) {
        updateSql += ", email_verified = 1";
      } else {
        updateSql += ", phone_verified = 1";
      }
      updateSql += " WHERE id = ?";
      updateParams.push(user.id);
      await db.run(updateSql, updateParams);
      user = await db.get('SELECT * FROM users WHERE id = ?', [user.id]);
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      message: 'Verification successful! Logged in.',
      token,
      user: safeUserPayload(user)
    });
  } catch (err) {
    console.error('[Verify OTP Controller Error]', err);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification.' });
  }
};

// 6. Forgot Password: Verify OTP and Reset Password
exports.forgotPasswordReset = async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Identifier, OTP code, and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const verification = await otpService.verifyOtp({
      identifier: cleanIdentifier,
      otp,
      purpose: 'forgot_password'
    });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    const user = await db.get(
      'SELECT id FROM users WHERE LOWER(email) = ? OR phone = ? OR phone = ?',
      [cleanIdentifier, cleanIdentifier, cleanIdentifier.replace(/^\+91/, '')]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.run(
      `UPDATE users SET password_hash = ?, failed_login_attempts = 0, lockout_until = NULL WHERE id = ?`,
      [newHash, user.id]
    );

    return res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (err) {
    console.error('[Forgot Password Reset Error]', err);
    return res.status(500).json({ success: false, message: 'Could not reset password.' });
  }
};

// 7. Get current customer profile details
exports.getProfile = async (req, res) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const addresses = await db.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    const orderRow = await db.get('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [req.user.id]);
    const wishlistRow = await db.get('SELECT COUNT(*) as count FROM wishlists WHERE user_id = ?', [req.user.id]);

    return res.json({
      success: true,
      user: safeUserPayload(user),
      addresses,
      orderCount: Number(orderRow?.count || 0),
      wishlistCount: Number(wishlistRow?.count || 0)
    });
  } catch (err) {
    console.error('[Get Profile Error]', err);
    return res.status(500).json({ success: false, message: 'Could not fetch profile details.' });
  }
};

// 8. Update general profile details
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }

    const currentUser = await db.get('SELECT phone, phone_verified FROM users WHERE id = ?', [req.user.id]);
    const cleanPhone = phone ? phone.trim().replace(/[^\d+]/g, '') : null;
    let phoneVerified = currentUser.phone_verified;

    // If phone number is modified, require re-verification
    if (cleanPhone !== currentUser.phone) {
      phoneVerified = 0;
    }

    await db.run(
      'UPDATE users SET name = ?, phone = ?, phone_verified = ? WHERE id = ?',
      [name.trim(), cleanPhone, phoneVerified, req.user.id]
    );

    const updated = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUserPayload(updated)
    });
  } catch (err) {
    console.error('[Update Profile Error]', err);
    return res.status(500).json({ success: false, message: 'Could not update profile.' });
  }
};

// 9. Change Password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[Change Password Error]', err);
    return res.status(500).json({ success: false, message: 'Could not update password.' });
  }
};

// 10. Verify Mobile Phone Number for logged-in customer
exports.verifyPhone = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await db.get('SELECT phone FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.phone) {
      return res.status(400).json({ success: false, message: 'No mobile phone registered on this account.' });
    }

    const verification = await otpService.verifyOtp({
      identifier: user.phone,
      otp,
      purpose: 'verify_phone'
    });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    await db.run('UPDATE users SET phone_verified = 1 WHERE id = ?', [req.user.id]);
    const updated = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    return res.json({
      success: true,
      message: 'Mobile number verified successfully.',
      user: safeUserPayload(updated)
    });
  } catch (err) {
    console.error('[Verify Phone Error]', err);
    return res.status(500).json({ success: false, message: 'Could not verify mobile phone.' });
  }
};

// 11. Verify Email Address for logged-in customer
exports.verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await db.get('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.email) {
      return res.status(400).json({ success: false, message: 'No email registered on this account.' });
    }

    const verification = await otpService.verifyOtp({
      identifier: user.email,
      otp,
      purpose: 'verify_email'
    });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    await db.run('UPDATE users SET email_verified = 1 WHERE id = ?', [req.user.id]);
    const updated = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    return res.json({
      success: true,
      message: 'Email address verified successfully.',
      user: safeUserPayload(updated)
    });
  } catch (err) {
    console.error('[Verify Email Error]', err);
    return res.status(500).json({ success: false, message: 'Could not verify email address.' });
  }
};

// 12. Change Mobile Phone Number with OTP verification
exports.changePhone = async (req, res) => {
  try {
    const { newPhone, otp } = req.body;
    if (!newPhone || !otp) {
      return res.status(400).json({ success: false, message: 'New mobile number and OTP code are required.' });
    }

    const cleanNewPhone = newPhone.trim().replace(/[^\d+]/g, '');
    const existing = await db.get('SELECT id FROM users WHERE (phone = ? OR phone = ?) AND id != ?', [cleanNewPhone, cleanNewPhone.replace(/^\+91/, ''), req.user.id]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This mobile number is already linked to another account.' });
    }

    const verification = await otpService.verifyOtp({
      identifier: cleanNewPhone,
      otp,
      purpose: 'verify_phone'
    });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    await db.run('UPDATE users SET phone = ?, phone_verified = 1 WHERE id = ?', [cleanNewPhone, req.user.id]);
    const updated = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    return res.json({
      success: true,
      message: 'Mobile number updated and verified successfully.',
      user: safeUserPayload(updated)
    });
  } catch (err) {
    console.error('[Change Phone Error]', err);
    return res.status(500).json({ success: false, message: 'Could not change mobile number.' });
  }
};

// 13. Change Email Address with OTP verification
exports.changeEmail = async (req, res) => {
  try {
    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) {
      return res.status(400).json({ success: false, message: 'New email address and OTP code are required.' });
    }

    const cleanNewEmail = newEmail.trim().toLowerCase();
    const existing = await db.get('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?', [cleanNewEmail, req.user.id]);
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email address is already linked to another account.' });
    }

    const verification = await otpService.verifyOtp({
      identifier: cleanNewEmail,
      otp,
      purpose: 'verify_email'
    });

    if (!verification.success) {
      return res.status(400).json(verification);
    }

    await db.run('UPDATE users SET email = ?, email_verified = 1 WHERE id = ?', [cleanNewEmail, req.user.id]);
    const updated = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    return res.json({
      success: true,
      message: 'Email address updated and verified successfully.',
      user: safeUserPayload(updated)
    });
  } catch (err) {
    console.error('[Change Email Error]', err);
    return res.status(500).json({ success: false, message: 'Could not change email address.' });
  }
};
