const express = require('express');
const router  = express.Router();
const { submitContact, getMessages, markRead } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/contact       — any logged-in user can submit
router.post('/', protect, submitContact);

// GET  /api/contact       — admin only: see all messages
router.get('/', protect, adminOnly, getMessages);

// PUT  /api/contact/:id/read — admin marks read
router.put('/:id/read', protect, adminOnly, markRead);

module.exports = router;