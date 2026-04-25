const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const User = require('../models/User');

// Lazy-load Razorpay so app doesn't crash if keys aren't set during dev
const getRazorpay = () => {
  const Razorpay = require('razorpay');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const PLAN_PRICES = {
  pro: 49900,        // ₹499 in paise
  enterprise: 199900, // ₹1999 in paise
};

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createOrder = async (req, res) => {
  const { plan } = req.body;

  if (!plan || !PLAN_PRICES[plan]) {
    return res.status(400).json({ success: false, message: 'Valid plan (pro/enterprise) is required' });
  }

  try {
    const razorpay = getRazorpay();
    const receipt = `rcpt_${uuidv4().slice(0, 20)}`;
    const amount = PLAN_PRICES[plan];

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt,
      notes: { userId: req.user._id.toString(), plan },
    });

    // Save order to DB
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
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      key: process.env.RAZORPAY_KEY_ID,
      user: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order' });
  }
};

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: 'All payment fields are required' });
  }

  try {
    // Verify signature
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
      return res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
    }

    // Update payment record
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
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Upgrade user plan — set expiry 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await User.findByIdAndUpdate(req.user._id, {
      plan: payment.plan,
      planExpiresAt: expiresAt,
    });

    res.json({
      success: true,
      message: 'Payment verified successfully! Your plan has been upgraded.',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      plan: payment.plan,
      expiresAt,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification' });
  }
};

// @desc    Get payment history for logged-in user
// @route   GET /api/payment/history
// @access  Private
const getHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get ALL payments (admin only)
// @route   GET /api/payment/all
// @access  Admin only
const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createOrder, verifyPayment, getHistory, getAllPayments };