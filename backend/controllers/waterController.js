const WaterData = require('../models/WaterData');
const Alert = require('../models/Alert');

// Thresholds for alerts
const THRESHOLDS = {
  ph: { min: 6.5, max: 8.5, unit: '' },
  turbidity: { max: 100, warn: 70, unit: 'NTU' },
  temperature: { min: 5, max: 40, unit: '°C' },
  dissolvedOxygen: { min: 6.0, unit: 'mg/L' },
  tds: { max: 500, unit: 'ppm' },
};

// Check and generate alerts for a reading
const checkThresholds = async (data) => {
  const alerts = [];
  const { ph, turbidity, temperature, dissolvedOxygen, tds } = data.readings;

  if (ph < THRESHOLDS.ph.min || ph > THRESHOLDS.ph.max) {
    alerts.push({ parameter: 'pH', value: ph, threshold: ph < 6.5 ? 6.5 : 8.5, unit: '', severity: 'critical', message: `pH level ${ph} is outside safe range (6.5–8.5) at ${data.stationName}` });
  }
  if (turbidity > THRESHOLDS.turbidity.max) {
    alerts.push({ parameter: 'Turbidity', value: turbidity, threshold: 100, unit: 'NTU', severity: 'critical', message: `Turbidity ${turbidity} NTU exceeds critical limit at ${data.stationName}` });
  } else if (turbidity > THRESHOLDS.turbidity.warn) {
    alerts.push({ parameter: 'Turbidity', value: turbidity, threshold: 70, unit: 'NTU', severity: 'warning', message: `Turbidity ${turbidity} NTU is elevated at ${data.stationName}` });
  }
  if (tds > THRESHOLDS.tds.max) {
    alerts.push({ parameter: 'TDS', value: tds, threshold: 500, unit: 'ppm', severity: 'critical', message: `TDS ${tds} ppm exceeds safe limit at ${data.stationName}` });
  }
  if (dissolvedOxygen < THRESHOLDS.dissolvedOxygen.min) {
    alerts.push({ parameter: 'Dissolved Oxygen', value: dissolvedOxygen, threshold: 6.0, unit: 'mg/L', severity: 'warning', message: `DO₂ ${dissolvedOxygen} mg/L is below minimum at ${data.stationName}` });
  }

  for (const a of alerts) {
    await Alert.create({
      stationId: data.stationId,
      stationName: data.stationName,
      ...a,
      notifiedVia: ['email'],
    });
  }
  return alerts;
};

// @desc    Add water quality reading (manual or IoT)
// @route   POST /api/water
// @access  Private
const addReading = async (req, res) => {
  try {
    const { stationId, stationName, location, readings, source } = req.body;

    if (!stationId || !stationName || !readings) {
      return res.status(400).json({ success: false, message: 'stationId, stationName, and readings are required' });
    }
    const required = ['ph', 'turbidity', 'temperature', 'dissolvedOxygen', 'tds'];
    for (const field of required) {
      if (readings[field] === undefined || readings[field] === null) {
        return res.status(400).json({ success: false, message: `readings.${field} is required` });
      }
    }

    const waterData = new WaterData({
      stationId,
      stationName,
      location: location || {},
      readings,
      source: source || 'manual',
      enteredBy: req.user ? req.user._id : null,
    });

    await waterData.save();

    // Check thresholds and generate alerts
    const triggeredAlerts = await checkThresholds(waterData);

    res.status(201).json({
      success: true,
      message: 'Reading saved successfully',
      data: waterData,
      alerts: triggeredAlerts.length,
      wqi: waterData.wqi,
      status: waterData.status,
    });
  } catch (error) {
    console.error('Add reading error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving reading' });
  }
};

// @desc    Get latest readings for all stations
// @route   GET /api/water/latest
// @access  Private
const getLatestReadings = async (req, res) => {
  try {
    const stations = await WaterData.aggregate([
      { $match: { deleted: { $ne: true } } },
      { $sort: { recordedAt: -1 } },
      {
        $group: {
          _id: '$stationId',
          stationName: { $first: '$stationName' },
          location: { $first: '$location' },
          readings: { $first: '$readings' },
          wqi: { $first: '$wqi' },
          status: { $first: '$status' },
          recordedAt: { $first: '$recordedAt' },
        },
      },
    ]);
    res.json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get readings for a specific station
// @route   GET /api/water/station/:stationId
// @access  Private
const getStationReadings = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { limit = 50, from, to } = req.query;

    const query = { stationId };
    if (from || to) {
      query.recordedAt = {};
      if (from) query.recordedAt.$gte = new Date(from);
      if (to) query.recordedAt.$lte = new Date(to);
    }

    const readings = await WaterData.find(query)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit))
      .populate('enteredBy', 'name email');

    res.json({ success: true, count: readings.length, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get analytics - daily averages
// @route   GET /api/water/analytics
// @access  Private
const getAnalytics = async (req, res) => {
  try {
    const { stationId, days = 7 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const matchQuery = { recordedAt: { $gte: since } };
    if (stationId && stationId !== 'all') matchQuery.stationId = stationId;

    const analytics = await WaterData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } },
            stationId: '$stationId',
          },
          stationName: { $first: '$stationName' },
          avgPh: { $avg: '$readings.ph' },
          avgTurbidity: { $avg: '$readings.turbidity' },
          avgTemp: { $avg: '$readings.temperature' },
          avgDO: { $avg: '$readings.dissolvedOxygen' },
          avgTDS: { $avg: '$readings.tds' },
          avgWQI: { $avg: '$wqi' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Turbidity distribution
    const distribution = await WaterData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, analytics, distribution });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all alerts
// @route   GET /api/water/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const { limit = 50, severity } = req.query;
    const query = severity ? { severity } : {};
    const alerts = await Alert.find(query).sort({ createdAt: -1 }).limit(parseInt(limit));
    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Resolve an alert
// @route   PUT /api/water/alerts/:id/resolve
// @access  Private
const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all readings (admin) or user-entered readings
// @route   GET /api/water
// @access  Private
const getAllReadings = async (req, res) => {
  try {
    const { limit = 100, stationId } = req.query;
    const query = { deleted: { $ne: true } };
    if (stationId) query.stationId = stationId;
    if (req.user.role !== 'admin') query.enteredBy = req.user._id;

    const readings = await WaterData.find(query)
      .sort({ recordedAt: -1 })
      .limit(parseInt(limit))
      .populate('enteredBy', 'name email');

    res.json({ success: true, count: readings.length, data: readings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Soft-delete a reading (admin only) — marks deleted, not removed from DB
// @route   DELETE /api/water/:id
// @access  Admin only
const deleteReading = async (req, res) => {
  try {
    const reading = await WaterData.findById(req.params.id);
    if (!reading) {
      return res.status(404).json({ success: false, message: 'Reading not found' });
    }
    // Soft-delete: keep the record but flag it
    reading.deleted = true;
    reading.deletedAt = new Date();
    reading.deletedBy = req.user._id;
    await reading.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Reading deleted', id: req.params.id });
  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Restore a soft-deleted reading (undo)
// @route   PUT /api/water/:id/restore
// @access  Admin only
const restoreReading = async (req, res) => {
  try {
    const reading = await WaterData.findById(req.params.id);
    if (!reading) {
      return res.status(404).json({ success: false, message: 'Reading not found' });
    }
    reading.deleted = false;
    reading.deletedAt = null;
    reading.deletedBy = null;
    await reading.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Reading restored', data: reading });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a reading (admin only)
// @route   PUT /api/water/:id
// @access  Admin only
const updateReading = async (req, res) => {
  try {
    const reading = await WaterData.findOne({ _id: req.params.id, deleted: { $ne: true } });
    if (!reading) return res.status(404).json({ success: false, message: 'Reading not found' });

    const { stationName, location, readings } = req.body;
    if (stationName) reading.stationName = stationName;
    if (location)    reading.location    = { ...reading.location, ...location };
    if (readings)    reading.readings    = { ...reading.readings, ...readings };

    // Recalculate WQI + status by triggering pre-save
    reading.markModified('readings');
    await reading.save();

    // Mark any old unresolved alerts for this station as resolved since data changed
    await Alert.updateMany(
      { stationId: reading.stationId, resolved: false },
      { resolved: true, resolvedAt: new Date() }
    );

    // Re-check thresholds with new values
    await checkThresholds(reading);

    res.json({ success: true, message: 'Reading updated successfully', data: reading, wqi: reading.wqi, status: reading.status });
  } catch (error) {
    console.error('Update reading error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { addReading, getLatestReadings, getStationReadings, getAnalytics, getAlerts, resolveAlert, getAllReadings, deleteReading, restoreReading, updateReading };