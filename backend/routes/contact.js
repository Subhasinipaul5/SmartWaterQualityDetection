const express = require('express');
const router  = express.Router();

const { submitContact, getMessages, markRead } = require('../controllers/contactController');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/contact — logged-in user
router.post('/', submitContact);

// GET /api/contact — admin only
router.get('/', protect, adminOnly, getMessages);

// PUT /api/contact/:id/read — admin only
router.put('/:id/read', protect, adminOnly, markRead);

module.exports = router;
