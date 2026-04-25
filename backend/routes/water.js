const express = require('express');
const router = express.Router();
const {
  addReading, getLatestReadings, getStationReadings,
  getAnalytics, getAlerts, resolveAlert, getAllReadings,
  deleteReading, restoreReading, updateReading,
} = require('../controllers/waterController');
const { protect, adminOnly, premiumOnly } = require('../middleware/auth');

router.use(protect);

// Specific routes FIRST — before /:id wildcards
router.post('/',                          adminOnly,  addReading);
router.get('/',                                       getAllReadings);
router.get('/latest',                                 getLatestReadings);
router.get('/analytics',                 premiumOnly, getAnalytics);
router.get('/alerts',                                 getAlerts);
router.put('/alerts/:id/resolve',                     resolveAlert);
router.get('/station/:stationId',                     getStationReadings);

// Generic :id routes LAST
router.put('/:id/restore',  adminOnly, restoreReading);  // must be before PUT /:id
router.put('/:id',          adminOnly, updateReading);
router.delete('/:id',       adminOnly, deleteReading);

module.exports = router;