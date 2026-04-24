const mongoose = require('mongoose');

const waterDataSchema = new mongoose.Schema({
  stationId: {
    type: String,
    required: true,
    trim: true,
  },
  stationName: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    name: { type: String, default: '' },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
  },
  readings: {
    ph: { type: Number, required: true },
    turbidity: { type: Number, required: true },   // NTU
    temperature: { type: Number, required: true },  // °C
    dissolvedOxygen: { type: Number, required: true }, // mg/L
    tds: { type: Number, required: true },          // ppm
    conductivity: { type: Number, default: 0 },     // µS/cm
  },
  wqi: {
    type: Number,  // Water Quality Index 0-100
    default: 0,
  },
  status: {
    type: String,
    enum: ['safe', 'caution', 'unsafe'],
    default: 'safe',
  },
  recordedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  source: {
    type: String,
    enum: ['sensor', 'manual', 'simulated'],
    default: 'manual',
  },
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Soft-delete fields
  deleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

// Calculate WQI and status before saving
waterDataSchema.pre('save', function (next) {
  const { ph, turbidity, tds, dissolvedOxygen, temperature } = this.readings;

  let score = 100;
  // pH scoring (ideal 7.0-7.5)
  if (ph < 6.5 || ph > 8.5) score -= 25;
  else if (ph < 6.8 || ph > 8.0) score -= 10;

  // Turbidity scoring (lower is better)
  if (turbidity > 100) score -= 25;
  else if (turbidity > 70) score -= 15;
  else if (turbidity > 40) score -= 5;

  // TDS scoring
  if (tds > 1000) score -= 25;
  else if (tds > 500) score -= 15;
  else if (tds > 300) score -= 5;

  // Dissolved Oxygen (higher is better)
  if (dissolvedOxygen < 4) score -= 20;
  else if (dissolvedOxygen < 6) score -= 10;

  // Temperature
  if (temperature > 40 || temperature < 5) score -= 10;
  else if (temperature > 35) score -= 5;

  this.wqi = Math.max(0, score);

  if (score >= 70) this.status = 'safe';
  else if (score >= 50) this.status = 'caution';
  else this.status = 'unsafe';

  next();
});

// Index for efficient queries
waterDataSchema.index({ stationId: 1, recordedAt: -1 });

module.exports = mongoose.model('WaterData', waterDataSchema);
