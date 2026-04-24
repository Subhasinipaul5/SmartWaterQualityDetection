const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  stationId: { type: String, required: true },
  stationName: { type: String, required: true },
  parameter: { type: String, required: true },
  value: { type: Number, required: true },
  threshold: { type: Number, required: true },
  unit: { type: String, default: '' },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
  message: { type: String, required: true },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  notifiedVia: [{ type: String, enum: ['email', 'sms', 'push'] }],
  createdAt: { type: Date, default: Date.now, index: true },
});

alertSchema.index({ stationId: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
