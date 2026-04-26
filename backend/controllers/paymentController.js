const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Lazy Razorpay init (safe for missing env)
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys not configured');
  }

  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const PLAN_PRICES = {
  pro: 49900,         // ₹499
  enterprise: 199900, // ₹1999
};

// ===============================
// CREATE ORDER
// ===============================
const createOrder = async (req, res) => {
  const { plan } = req.body;

  if (!plan || !PLAN_PRICES[plan]) {
    return res.status(400).json({
      success: false,
      message: 'Valid plan (pro/enterprise) is required',
    });
  }

  try {
    const razorpay = getRazorpay();

    const receipt = `rcpt_${uuidv4().slice(0, 20)}`;
    const amount = PLAN_PRICES[plan];

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        userId: req.user._id.toString(),
        plan,
      },
    });

    // Save order
    await Payment.create({
      userId: req.user._id,
      razorpayOrderId: order.id,
      plan,
      amount,
      receipt,
      status: 'created',
    });

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        name: req.user.name,
        email: req.user.email,
        contact: req.user.phone || '',
      },
    });

  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
    });
  }
};

// ===============================
// VERIFY PAYMENT
// ===============================
const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'All payment fields are required',
    });
  }

  try {
    // 🔐 Signature verification
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' }
      );

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed (signature mismatch)',
      });
    }

    // Prevent double verification
    const existing = await Payment.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Payment already verified',
      });
    }

    // Update payment
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid',
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // ⏳ Plan expiry (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await User.findByIdAndUpdate(payment.userId, {
      plan: payment.plan,
      planExpiresAt: expiresAt,
    });

    res.json({
      success: true,
      message: 'Payment successful 🎉 Plan upgraded!',
      paymentId: razorpay_payment_id,
      plan: payment.plan,
      expiresAt,
    });

  } catch (error) {
    console.error('Verify payment error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Server error during payment verification',
    });
  }
};

// ===============================
// USER PAYMENT HISTORY
// ===============================
const getHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// ===============================
// ADMIN - ALL PAYMENTS
// ===============================
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');

    res.json({
      success: true,
      count: payments.length,
      data: payments,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getHistory,
  getAllPayments,
};
