const nodemailer = require('nodemailer');

// Brevo (formerly Sendinblue) REST API v3 endpoint
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function getBrevoApiKey() {
  return (process.env.BREVO_API_KEY || process.env.SIB_API_KEY || '').trim();
}

function getSender() {
  const name = process.env.BREVO_SENDER_NAME || 'VELLANKI ENTERPRISES';
  let email = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_FROM || 'no-reply@vellankienterprises.com';
  // Strip quotes or angle brackets if present
  const match = email.match(/<([^>]+)>/);
  if (match) email = match[1];
  return { name, email };
}

function getEmailTransporter() {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
  const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_USERNAME || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  return null;
}

const emailService = {
  isConfigured() {
    return Boolean(getBrevoApiKey() || (process.env.EMAIL_HOST && process.env.EMAIL_USERNAME));
  },

  isBrevoConfigured() {
    return Boolean(getBrevoApiKey());
  },

  async sendOtpEmail({ to, customerName = 'Valued Customer', otp, purpose = 'Verification' }) {
    const brevoApiKey = getBrevoApiKey();
    const sender = getSender();
    const subject = `Your VELLANKI ENTERPRISES Verification Code: ${otp}`;

    const purposeTitle = {
      login: 'Account Sign In',
      register: 'Account Registration',
      forgot_password: 'Password Reset',
      verify_phone: 'Phone Number Verification',
      verify_email: 'Email Address Verification'
    }[purpose] || 'Verification';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f7f9f6; margin: 0; padding: 24px; color: #1c3021; }
          .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e1e9dc; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background: #1b4d2e; color: #ffffff; padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #a4dfb8; }
          .content { padding: 32px 28px; }
          .greeting { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #4b5e4f; margin-bottom: 24px; }
          .otp-badge { background: #f0f7f2; border: 2px dashed #2d6a4f; border-radius: 12px; padding: 18px; text-align: center; margin: 20px 0; }
          .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #1b4d2e; margin: 0; }
          .expiry { font-size: 12px; color: #728a77; margin-top: 8px; font-weight: 600; }
          .warning { background: #fef8ec; border-left: 4px solid #d97706; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #92400e; margin: 24px 0; }
          .footer { padding: 20px; text-align: center; font-size: 11px; color: #8a9c8e; border-top: 1px solid #f0f4ee; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌿 VELLANKI ENTERPRISES</h1>
            <p>Eco-Friendly Products for Every Occasion</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${customerName},</div>
            <p class="message">
              You requested a one-time verification code for <strong>${purposeTitle}</strong> at VELLANKI ENTERPRISES. Please enter the 6-digit code below to proceed:
            </p>
            <div class="otp-badge">
              <div class="otp-code">${otp}</div>
              <div class="expiry">⏱️ Valid for 5 minutes</div>
            </div>
            <div class="warning">
              <strong>🔒 Security Notice:</strong> Do not share this OTP with anyone. VELLANKI ENTERPRISES staff will never ask for your verification code.
            </div>
            <p class="message" style="font-size: 12px; color: #728a77;">
              If you did not request this verification code, please ignore this email or contact our support team immediately.
            </p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} VELLANKI ENTERPRISES. All rights reserved.<br>
            Quality Eco-Friendly Tableware & Sustainable Packaging Solutions
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `VELLANKI ENTERPRISES - Verification Code\n\nHello ${customerName},\n\nYour verification OTP for ${purposeTitle} is: ${otp}\nThis code expires in 5 minutes.\n\nSECURITY NOTICE: Do not share this OTP with anyone.\n\n© ${new Date().getFullYear()} VELLANKI ENTERPRISES`;

    // 1. Primary Dispatcher: Brevo REST API v3
    if (brevoApiKey) {
      try {
        console.log(`📤 [Brevo API] Dispatching OTP email to ${to} via Brevo transactional API...`);
        const response = await fetch(BREVO_API_URL, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: sender.name,
              email: sender.email
            },
            to: [
              {
                email: to,
                name: customerName
              }
            ],
            subject,
            htmlContent,
            textContent
          })
        });

        const data = await response.json();

        if (!response.ok) {
          console.warn('⚠️ [Brevo API Error]', data.message || data);
          return { success: false, error: data.message || 'Brevo API error', simulated: false };
        }

        console.log(`✅ [Brevo API Email Dispatched] Message ID: ${data.messageId} to ${to}`);
        return { success: true, messageId: data.messageId, provider: 'brevo' };
      } catch (err) {
        console.warn('⚠️ [Brevo Network/Dispatch Error]', err.message);
        return { success: false, error: err.message, simulated: false };
      }
    }

    // 2. Fallback Dispatcher: Standard SMTP (Nodemailer)
    const transporter = getEmailTransporter();
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${sender.name}" <${sender.email}>`,
          to,
          subject,
          text: textContent,
          html: htmlContent
        });
        console.log(`📧 [SMTP Email Dispatched] to ${to}, Message ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId, provider: 'smtp' };
      } catch (err) {
        console.warn('⚠️ [SMTP Email Dispatch Error]', err.message);
        return { success: false, error: err.message };
      }
    }

    // 3. Development Simulation Mode (When BREVO_API_KEY is not yet added in .env)
    console.log(`📧 [Simulated Brevo Email OTP] Sent to ${to} (Subject: "${subject}")`);
    console.log(`💡 [Brevo Notice] Add BREVO_API_KEY=your_key in .env to deliver real emails to inboxes.`);
    return { success: true, simulated: true, provider: 'simulated' };
  }
};

module.exports = emailService;
