const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, promoteUser, getAllUsers } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// GET  /api/auth/me
router.get('/me', protect, getMe);

// PUT  /api/auth/profile
router.put('/profile', protect, updateProfile);

// PUT  /api/auth/change-password
router.put('/change-password', protect, changePassword);

// GET  /api/auth/users          — list all users (admin only)
router.get('/users', protect, adminOnly, getAllUsers);

// PUT  /api/auth/promote/:userId — toggle admin/user role (admin only)
router.put('/promote/:userId', protect, adminOnly, promoteUser);

module.exports = router;
