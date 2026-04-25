const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getHistory, getAllPayments } = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify',       verifyPayment);
router.get('/history',       getHistory);
router.get('/all',           adminOnly, getAllPayments);  // admin sees all users' payments

module.exports = router;