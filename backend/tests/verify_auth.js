// backend/tests/verify_auth.js
// Automated verification suite for Brevo Email Verification & Customer Authentication
const path = require('path');
const { db } = require('../config/db');

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Brevo Email Verification & Auth Test Suite...\n');

  // Test customer credentials
  const testEmail = 'brevo_test_customer@example.com';
  const newEmail = 'brevo_updated_customer@example.com';
  const testPhone = '9876599901';
  const testPassword = 'OriginalPassword@123';
  const newPassword = 'NewSecretPassword@456';

  // Cleanup any lingering test records
  db.run('DELETE FROM users WHERE email IN (?, ?) OR phone = ?', [testEmail, newEmail, testPhone]);
  db.run('DELETE FROM otp_verifications WHERE identifier IN (?, ?, ?)', [testEmail, newEmail, testPhone]);

  // 1. Customer Registration
  console.log('--- 1. Customer Registration ---');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Brevo Test Customer',
      email: testEmail,
      phone: testPhone,
      password: testPassword
    })
  });
  const regData = await regRes.json();
  console.log('Registration status:', regRes.status, regData.message);
  if (!regData.success || !regData.token) {
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }
  let token = regData.token;
  let userId = regData.user.id;
  console.log('Registered User:', {
    id: regData.user.id,
    name: regData.user.name,
    email: regData.user.email,
    email_verified: regData.user.email_verified,
    status: regData.user.status
  });

  // 2. Email Verification via Brevo Email OTP
  console.log('\n--- 2. Email Address Verification via Brevo ---');
  const emailOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      purpose: 'verify_email'
    })
  });
  const emailOtpData = await emailOtpRes.json();
  console.log('Send Brevo Email OTP status:', emailOtpRes.status, emailOtpData.message);
  console.log('Channel:', emailOtpData.channel, '| Provider:', emailOtpData.provider);
  const emailOtpToUse = emailOtpData.previewOtp || db.get('SELECT otp_code FROM otp_verifications WHERE LOWER(identifier) = ? AND verified = 0 ORDER BY id DESC LIMIT 1', [testEmail])?.otp_code;
  console.log('Preview Code (Email):', emailOtpToUse);
  if (!emailOtpToUse) throw new Error('Email OTP code missing!');

  const verifyEmailRes = await fetch(`${BASE_URL}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ otp: emailOtpToUse })
  });
  const verifyEmailData = await verifyEmailRes.json();
  console.log('Verify Email status:', verifyEmailRes.status, verifyEmailData.message);
  console.log('email_verified is now:', verifyEmailData.user.email_verified);
  if (verifyEmailData.user.email_verified !== true && verifyEmailData.user.email_verified !== 1) {
    throw new Error('Email was not marked verified!');
  }

  // 3. Password Login
  console.log('\n--- 3. Password Login ---');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  console.log('Password Login status:', loginRes.status, loginData.message);
  console.log('User status after login:', {
    name: loginData.user.name,
    email_verified: loginData.user.email_verified,
    last_login: loginData.user.last_login
  });
  if (!loginData.success) throw new Error('Password login failed!');

  // 4. Rate-Limiting Cooldown & Forgot Password Flow
  console.log('\n--- 4. Forgot Password Flow with Rate-Limiting Cooldown ---');
  // Attempt immediate OTP send to test cooldown
  const immediateRes = await fetch(`${BASE_URL}/auth/forgot-password/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail
    })
  });
  const immediateData = await immediateRes.json();
  console.log('Immediate OTP Request status (Rate limit active):', immediateRes.status, immediateData.message);
  if (immediateRes.status === 429) {
    console.log('✓ Rate limiting cooldown verified! Waiting for 31s cooldown window to expire...');
    await new Promise(r => setTimeout(r, 31000));
  }

  // Send Forgot Password OTP via Brevo Email
  const forgotOtpRes = await fetch(`${BASE_URL}/auth/forgot-password/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail
    })
  });
  const forgotOtpData = await forgotOtpRes.json();
  console.log('Forgot Password Send OTP status:', forgotOtpRes.status, forgotOtpData.message);
  const forgotOtpToUse = forgotOtpData.previewOtp || db.get('SELECT otp_code FROM otp_verifications WHERE LOWER(identifier) = ? AND verified = 0 ORDER BY id DESC LIMIT 1', [testEmail])?.otp_code;
  console.log('Preview Code (Email):', forgotOtpToUse);
  if (!forgotOtpToUse) throw new Error('Forgot password OTP code missing!');

  const resetRes = await fetch(`${BASE_URL}/auth/forgot-password/reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      otp: forgotOtpToUse,
      newPassword: newPassword
    })
  });
  const resetData = await resetRes.json();
  console.log('Reset Password status:', resetRes.status, resetData.message);
  if (!resetData.success) throw new Error('Forgot password reset failed: ' + resetData.message);

  // Confirm login with new password
  const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: newPassword
    })
  });
  const newLoginData = await newLoginRes.json();
  console.log('Login with New Password status:', newLoginRes.status, newLoginData.message);
  if (!newLoginData.success) throw new Error('Login with new password failed!');
  token = newLoginData.token;

  // 5. Change Email Address with Brevo OTP Verification
  console.log('\n--- 5. Change Email Address with Brevo OTP ---');
  const changeOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newEmail,
      purpose: 'verify_email'
    })
  });
  const changeOtpData = await changeOtpRes.json();
  console.log('Send Change Email OTP status:', changeOtpRes.status, changeOtpData.message);

  const changeOtpToUse = changeOtpData.previewOtp || db.get('SELECT otp_code FROM otp_verifications WHERE LOWER(identifier) = ? AND verified = 0 ORDER BY id DESC LIMIT 1', [newEmail])?.otp_code;
  console.log('Preview Code (Change Email):', changeOtpToUse);
  if (!changeOtpToUse) throw new Error('Change email OTP code missing!');

  const changeEmailRes = await fetch(`${BASE_URL}/auth/change-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      newEmail: newEmail,
      otp: changeOtpToUse
    })
  });
  const changeEmailData = await changeEmailRes.json();
  console.log('Change Email status:', changeEmailRes.status, changeEmailData.message);
  console.log('Updated user email:', changeEmailData.user?.email, '| verified:', changeEmailData.user?.email_verified);
  if (changeEmailData.user?.email !== newEmail) throw new Error('Email was not updated!');

  // 6. Customer Wishlist Management
  console.log('\n--- 6. Customer Wishlist Management ---');
  let catInsert = db.run('INSERT INTO categories (name, slug, status) VALUES (?, ?, ?)', ['Test Brevo Cat', 'test-brevo-cat', 'active']);
  let testCatId = catInsert.lastInsertRowid;
  let prodInsert = db.run(
    'INSERT INTO products (name, slug, category_id, price, discount_price, stock, status, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['Test Eco Cup', 'test-eco-cup', testCatId, 80, 65, 100, 'active', 0]
  );
  let testProductId = prodInsert.lastInsertRowid;

  try {
    const addWishRes = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId: testProductId })
    });
    const addWishData = await addWishRes.json();
    console.log('Toggle Wishlist status (Add):', addWishRes.status, addWishData.message, 'Action:', addWishData.action);

    const getWishRes = await fetch(`${BASE_URL}/wishlist`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getWishData = await getWishRes.json();
    console.log('Wishlist items count after add:', getWishData.wishlist?.length);
    if (getWishData.wishlist?.length !== 1) throw new Error('Item not found in wishlist!');

    // Remove from wishlist
    const delWishRes = await fetch(`${BASE_URL}/wishlist/${testProductId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delWishData = await delWishRes.json();
    console.log('Remove from Wishlist status:', delWishRes.status, delWishData.message);

    const checkEmptyRes = await fetch(`${BASE_URL}/wishlist`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkEmptyData = await checkEmptyRes.json();
    console.log('Wishlist count after removal:', checkEmptyData.wishlist?.length);
    if (checkEmptyData.wishlist?.length !== 0) throw new Error('Item was not removed from wishlist!');
  } finally {
    db.run('DELETE FROM wishlists WHERE product_id = ?', [testProductId]);
    db.run('DELETE FROM products WHERE id = ?', [testProductId]);
    db.run('DELETE FROM categories WHERE id = ?', [testCatId]);
  }

  // 7. Security Protection: 5 Failed Password Attempts Lockout
  console.log('\n--- 7. Security Protection: 5 Failed Password Attempts ---');
  for (let i = 1; i <= 5; i++) {
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: newEmail,
        password: 'WrongPassword' + i
      })
    });
    const badData = await badLoginRes.json();
    console.log(`Attempt ${i} status:`, badLoginRes.status, badData.message);
  }

  // 8. Admin Customer Controls (Suspend & Reactivate)
  console.log('\n--- 8. Admin Customer Controls ---');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/admin-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@vellanki.com',
      password: 'Admin@12345'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  // Suspend
  const suspendRes = await fetch(`${BASE_URL}/admin/customers/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'suspended' })
  });
  const suspendData = await suspendRes.json();
  console.log('Admin suspend status:', suspendRes.status, suspendData.message);

  // Check login blocked
  const blockedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: newEmail,
      password: newPassword
    })
  });
  const blockedData = await blockedLoginRes.json();
  console.log('Suspended customer login status (Expected 403):', blockedLoginRes.status, blockedData.message);
  if (blockedLoginRes.status !== 403) throw new Error('Suspended user was not blocked with 403!');

  // Reactivate
  const activateRes = await fetch(`${BASE_URL}/admin/customers/${userId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({ status: 'active' })
  });
  const activateData = await activateRes.json();
  console.log('Admin re-activate status:', activateRes.status, activateData.message);

  // Final cleanup
  db.run('DELETE FROM users WHERE id = ?', [userId]);
  db.run('DELETE FROM otp_verifications WHERE identifier IN (?, ?, ?)', [testEmail, newEmail, testPhone]);
  console.log('\n✓ Cleaned up test customer and test OTP records.');

  console.log('\n🎉 ALL BREVO EMAIL VERIFICATION & AUTH TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
