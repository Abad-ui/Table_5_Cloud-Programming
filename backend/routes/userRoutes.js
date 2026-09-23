const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const {
  authLimiter,
  loginLimiter,
  otpLimiter,
  emailLimiter
} = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  verifyValidation,
  emailValidation,
  resetPasswordValidation
} = require('../middleware/validation');

const {
  getAllUsers,
  getUserById,
  getCurrentUser,
  registerUser,
  loginUser,
  verifyAccount,
  resendOTP,
  requestPasswordReset,      // NEW IMPORT
  resetPassword,             // NEW IMPORT
  resendPasswordResetOTP,    // NEW IMPORT
  deleteUser,
  updateUser,
} = require('../controllers/userController');

const router = express.Router();

// ================================
// Register & Login Routes
// ================================

// Register a new user
router.post('/register', authLimiter, registerValidation, registerUser);

// Login a user
router.post('/login', loginLimiter, loginValidation, loginUser);

// Verify account
router.post('/verify', otpLimiter, verifyValidation, verifyAccount);

// Resend OTP
router.post('/resend-otp', emailLimiter, emailValidation, resendOTP);

// ================================
// Password Reset Routes (NEW)
// ================================

// Request password reset
router.post('/forgot-password', emailLimiter, emailValidation, requestPasswordReset);

// Reset password with OTP
router.post('/reset-password', otpLimiter, resetPasswordValidation, resetPassword);

// Resend password reset OTP
router.post('/resend-reset-otp', emailLimiter, emailValidation, resendPasswordResetOTP);

// ================================
// User Management Routes
// ================================

// GET all users (Admin only)
router.get('/', requireAuth, requireAdmin, getAllUsers);

// GET current authenticated user (token validation)
router.get('/me', requireAuth, getCurrentUser);

// GET a single user
router.get('/:id', requireAuth, getUserById);

// DELETE a user (Admin only - prevents unauthorized deletion)
router.delete('/:id', requireAuth, requireAdmin, deleteUser);

// UPDATE a user
router.patch('/:id', requireAuth, updateUser);

// ================================
// Export Router
// ================================
module.exports = router;