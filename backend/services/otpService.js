const crypto = require('crypto');
const { db } = require('../config/db');
const emailService = require('./emailService');

const OTP_SECRET_SALT = process.env.JWT_SECRET || 'vellanki_secret_salt_2026';

// Compute cryptographic SHA-256 hash of OTP
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp.toString().trim() + OTP_SECRET_SALT).digest('hex');
}

// Phone number normalization to international E.164 format (+91 for India by default)
function formatPhoneE164(phone) {
  if (!phone) return phone;
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

// Telephony configuration resolvers (supports both explicit and aliased env keys)
function getTwilioCredentials() {
  const accountSid = process.env.SMS_API_KEY || process.env.VOICE_API_KEY || process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.SMS_AUTH_TOKEN || process.env.VOICE_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.SMS_SENDER_ID || process.env.TWILIO_PHONE_NUMBER;
  return { accountSid, authToken, fromNumber };
}

// Zero-dependency native Twilio Voice Call dispatcher
async function dispatchTwilioCall({ to, voiceScript }) {
  const { accountSid, authToken, fromNumber } = getTwilioCredentials();
  if (!accountSid || !authToken || !fromNumber) return null;

  try {
    const e164 = formatPhoneE164(to);
    const twiml = `<Response><Pause length="1"/><Say voice="Polly.Aditi" language="en-IN">${voiceScript}</Say><Pause length="2"/><Say voice="Polly.Aditi" language="en-IN">Repeating once again: ${voiceScript}</Say><Pause length="1"/><Say voice="Polly.Aditi" language="en-IN">Thank you for choosing Vellanki Enterprises. Goodbye.</Say></Response>`;
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const body = new URLSearchParams({
      To: e164,
      From: fromNumber,
      Twiml: twiml
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('⚠️ [Twilio Voice Call Warning]', data.message || data);
    } else {
      console.log(`📞 [Twilio Voice Call Placed] Call SID: ${data.sid} to ${e164}`);
    }
    return data;
  } catch (err) {
    console.warn('⚠️ [Twilio Voice Call Error]', err.message);
    return null;
  }
}

// Zero-dependency native Twilio SMS dispatcher
async function dispatchTwilioSms({ to, text }) {
  const { accountSid, authToken, fromNumber } = getTwilioCredentials();
  if (!accountSid || !authToken || !fromNumber) return null;

  try {
    const e164 = formatPhoneE164(to);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: e164,
      From: fromNumber,
      Body: text
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('⚠️ [Twilio SMS Warning]', data.message || data);
    } else {
      console.log(`💬 [Twilio SMS Dispatched] Message SID: ${data.sid} to ${e164}`);
    }
    return data;
  } catch (err) {
    console.warn('⚠️ [Twilio SMS Error]', err.message);
    return null;
  }
}

// Fast2SMS dispatcher for Indian mobile numbers
async function dispatchFast2Sms({ to, otp }) {
  const apiKey = process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY;
  if (!apiKey) return null;
  try {
    const rawNumber = to.replace(/[^\d]/g, '').slice(-10);
    const res = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&variables_values=${otp}&flash=0&numbers=${rawNumber}`);
    const data = await res.json();
    console.log(`💬 [Fast2SMS Dispatched] to ${rawNumber}:`, data);
    return data;
  } catch (err) {
    console.warn('⚠️ [Fast2SMS Error]', err.message);
    return null;
  }
}

function isSmsConfigured() {
  const { accountSid, authToken, fromNumber } = getTwilioCredentials();
  return Boolean(
    (accountSid && authToken && fromNumber) ||
    process.env.FAST2SMS_API_KEY ||
    (process.env.SMS_PROVIDER && process.env.SMS_API_KEY)
  );
}

function isVoiceConfigured() {
  const { accountSid, authToken, fromNumber } = getTwilioCredentials();
  return Boolean(accountSid && authToken && fromNumber);
}

const otpService = {
  // Generate cryptographically secure 6-digit numeric OTP
  generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  },

  hashOtp,

  // Send OTP via Email using Brevo API (or fallback simulation)
  async sendOtp({ identifier, deliveryTarget, channel = 'email', purpose = 'login', customerName = 'Customer' }) {
    const cleanIdentifier = identifier.trim().toLowerCase();
    
    // Resolve email delivery target
    let target = (deliveryTarget || cleanIdentifier).trim().toLowerCase();
    if (!target.includes('@')) {
      const existingUser = await db.get(
        'SELECT name, email FROM users WHERE phone = ? OR phone = ? OR LOWER(email) = ?',
        [cleanIdentifier, cleanIdentifier.replace(/^\+91/, ''), cleanIdentifier]
      );
      if (existingUser && existingUser.email && !existingUser.email.endsWith('@phone.vellanki.local')) {
        target = existingUser.email.toLowerCase();
        customerName = existingUser.name || customerName;
      } else {
        throw new Error('Please enter a valid email address to receive your verification code.');
      }
    }

    const otp = this.generateOtp();
    const otpHash = hashOtp(otp);

    // 1. Enforce rate limiting: check if an OTP was sent in the last 30 seconds
    const thirtySecsAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const tenMinsLater = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const recent = await db.get(
      `SELECT created_at FROM otp_verifications 
       WHERE LOWER(identifier) = ? AND created_at >= ? 
       ORDER BY id DESC LIMIT 1`,
      [cleanIdentifier, thirtySecsAgo]
    );

    if (recent) {
      throw new Error('Please wait 30 seconds before requesting another verification code.');
    }

    // 2. Invalidate previous unverified OTPs for this identifier and purpose
    await db.run(
      `UPDATE otp_verifications SET verified = 2 WHERE LOWER(identifier) = ? AND verified = 0`,
      [cleanIdentifier]
    );

    // 3. Save new OTP with cryptographic hash and 10 minutes validity
    await db.run(
      `INSERT INTO otp_verifications (identifier, otp_code, otp_hash, channel, purpose, expires_at, verified, attempts, max_attempts) 
       VALUES (?, ?, ?, 'email', ?, ?, 0, 0, 5)`,
      [cleanIdentifier, otp, otpHash, purpose, tenMinsLater]
    );

    // Masked representation for privacy display
    const maskedTarget = target.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 3)) + c);

    console.log('====================================================');
    console.log(`🔐 [Brevo Email OTP Dispatched]`);
    console.log(`   Customer Input: ${cleanIdentifier}`);
    console.log(`   Email Target:   ${target} (${maskedTarget})`);
    console.log(`   Purpose:        ${purpose}`);
    console.log(`   Channel:        EMAIL 📧 (Brevo API)`);
    console.log(`   Code:           ${otp} (SHA-256 Hash: ${otpHash.slice(0, 16)}...)`);
    console.log('====================================================');

    const emailDispatch = await emailService.sendOtpEmail({
      to: target,
      customerName,
      otp,
      purpose
    });

    if (!emailDispatch.success) {
      throw new Error(emailDispatch.error || 'Failed to dispatch verification email via Brevo.');
    }

    const isSimulated = Boolean(emailDispatch.simulated);
    const channelMessage = isSimulated
      ? `Verification code sent to email ${maskedTarget} (Development Simulation mode).`
      : `Verification code sent to your email address: ${maskedTarget}`;

    return {
      success: true,
      message: channelMessage,
      channel: 'email',
      purpose,
      identifier: cleanIdentifier,
      target,
      maskedTarget,
      expiresInSeconds: 600,
      simulated: isSimulated,
      previewOtp: isSimulated ? otp : undefined,
      provider: emailDispatch.provider || (isSimulated ? 'simulated' : 'brevo')
    };
  },

  // Verify submitted OTP with cryptographic hash verification and lockout protection
  async verifyOtp({ identifier, otp, purpose }) {
    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanOtp = (otp || '').toString().trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit verification code.'
      };
    }

    const nowIso = new Date().toISOString();

    // Query active unverified row within validity window
    let query = `
      SELECT * FROM otp_verifications 
      WHERE LOWER(identifier) = ? 
        AND verified = 0 
        AND expires_at > ?
    `;
    let params = [cleanIdentifier, nowIso];

    // For authentication (login/register), accept OTP issued for either login or register
    if (purpose === 'login' || purpose === 'register') {
      query += ` AND (purpose IN ('login', 'register'))`;
    } else if (purpose) {
      query += ` AND (purpose = ? OR purpose IN ('login', 'register'))`;
      params.push(purpose);
    }

    query += ` ORDER BY id DESC LIMIT 1`;

    let record = await db.get(query, params);

    // If not found with exact purpose filter, check for ANY active unverified OTP for this identifier
    if (!record) {
      record = await db.get(
        `SELECT * FROM otp_verifications 
         WHERE LOWER(identifier) = ? 
           AND verified = 0 
           AND expires_at > ? 
         ORDER BY id DESC LIMIT 1`,
        [cleanIdentifier, nowIso]
      );
    }

    if (!record) {
      return {
        success: false,
        message: 'OTP expired or not found. Please request a new verification code.'
      };
    }

    const maxAttempts = record.max_attempts || 5;
    if (record.attempts >= maxAttempts) {
      await db.run('UPDATE otp_verifications SET verified = 2 WHERE id = ?', [record.id]);
      return {
        success: false,
        message: 'Too many attempts. Please try again later.'
      };
    }

    const inputHash = hashOtp(cleanOtp);
    const isCodeMatch = (record.otp_hash && record.otp_hash === inputHash) || (record.otp_code && record.otp_code === cleanOtp);

    if (!isCodeMatch) {
      await db.run('UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?', [record.id]);
      const remaining = maxAttempts - (record.attempts + 1);
      if (remaining <= 0) {
        await db.run('UPDATE otp_verifications SET verified = 2 WHERE id = ?', [record.id]);
        return {
          success: false,
          message: 'Too many attempts. Please try again later.'
        };
      }
      return {
        success: false,
        message: `Invalid OTP. Please try again. (${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining)`
      };
    }

    // Success: Mark verified
    await db.run('UPDATE otp_verifications SET verified = 1 WHERE id = ?', [record.id]);
    return {
      success: true,
      message: 'OTP verified successfully.',
      channel: record.channel,
      purpose: record.purpose
    };
  }
};

module.exports = otpService;
