const express = require('express');
const router = express.Router();

const {
  createOrder,
  verifyPayment,
  getHistory,
  getAllPayments
} = require('../controllers/paymentController');

const { protect, adminOnly } = require('../middleware/auth');

// ===============================
// PAYMENT ROUTES
// ===============================

// Create Razorpay order
router.post('/create-order', protect, createOrder);

// Verify payment (after Razorpay success)
router.post('/verify', protect, verifyPayment);

// Get logged-in user payments
router.get('/history', protect, getHistory);

// Admin: view all payments
router.get('/all', protect, adminOnly, getAllPayments);

module.exports = router;
