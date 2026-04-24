const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  razorpayOrderId: { type: String, required: true, unique: true },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  plan: {
    type: String,
    enum: ['pro', 'enterprise'],
    required: true,
  },
  amount: { type: Number, required: true }, // in paise
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created',
  },
  receipt: { type: String },
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date, default: null },
});

module.exports = mongoose.model('Payment', paymentSchema);
