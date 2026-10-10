const razorpayService = require('../services/razorpayService');
const { db } = require('../config/db');

// Get Razorpay Public Key for Frontend SDK
exports.getPaymentConfig = (req, res) => {
  return res.json({
    success: true,
    keyId: razorpayService.keyId,
    isMock: razorpayService.isMock
  });
};

// Create Razorpay Order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, receipt, notes } = req.body;

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required.' });
    }

    const orderData = await razorpayService.createOrder({
      amount: Number(amount),
      receipt: receipt || `rec_${Date.now()}`,
      notes: notes || { userId: req.user.id }
    });

    return res.json({
      success: true,
      order: orderData
    });
  } catch (err) {
    console.error('[Create Payment Order Error]', err);
    return res.status(500).json({ success: false, message: err.message || 'Payment initiation failed.' });
  }
};

// Verify Payment Signature
exports.verifyPayment = (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Payment details missing.' });
    }

    const isValid = razorpayService.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    return res.json({
      success: true,
      message: 'Payment verified successfully.'
    });
  } catch (err) {
    console.error('[Verify Payment Error]', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};
