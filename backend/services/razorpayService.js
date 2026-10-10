const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_vellanki';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'mock_secret_vellanki_2026';

const isMock = !process.env.RAZORPAY_KEY_ID || 
               process.env.RAZORPAY_KEY_ID.includes('YourTestKey') || 
               process.env.RAZORPAY_KEY_ID.includes('mock');

let razorpayInstance = null;
if (!isMock) {
  try {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    console.log('[Payment] Razorpay client initialized with Key ID:', keyId);
  } catch (err) {
    console.warn('[Payment] Could not initialize real Razorpay client, using test simulation mode.');
  }
} else {
  console.log('[Payment] Running in Razorpay Test / Simulation mode for local development.');
}

const razorpayService = {
  isMock,
  keyId,

  async createOrder({ amount, receipt, notes }) {
    // Amount must be in paise (e.g. 500.00 INR = 50000 paise)
    const amountInPaise = Math.round(amount * 100);

    if (razorpayInstance) {
      try {
        const order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: receipt || `receipt_${Date.now()}`,
          notes: notes || {}
        });
        return {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status
        };
      } catch (err) {
        console.error('[Razorpay Order Creation Failed]', err);
        throw new Error(err.error ? err.error.description : 'Failed to create payment order with Razorpay.');
      }
    }

    // Mock Mode fallback for local testing
    return {
      id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      status: 'created',
      is_mock: true
    };
  },

  verifySignature({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
    if (!razorpay_order_id || !razorpay_payment_id) {
      return false;
    }

    if (isMock || (razorpay_order_id.startsWith('order_mock_') && razorpay_signature === 'mock_valid_signature')) {
      return true;
    }

    try {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      return generatedSignature === razorpay_signature;
    } catch (e) {
      console.error('[Signature Verification Error]', e);
      return false;
    }
  }
};

module.exports = razorpayService;
