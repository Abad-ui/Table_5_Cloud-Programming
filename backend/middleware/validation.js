// ==============================================
// Input Validation Middleware
// Uses express-validator to validate & sanitize
// request bodies before they reach controllers.
// ==============================================
const { body, validationResult } = require('express-validator');

// Run validation and return a consistent 400 JSON error if any check fails
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
    });
  }
  next();
};

// --- User registration ---
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be 3-30 characters long.')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('Username may only contain letters, numbers, dots, underscores, and dashes.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Invalid email format.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.')
    .isLength({ max: 72 })
    .withMessage('Password cannot exceed 72 characters.'),
  validate,
];

// --- Login ---
const loginValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format.').normalizeEmail(),
  body('password').isLength({ min: 1 }).withMessage('Password is required.'),
  validate,
];

// --- OTP verification ---
const verifyValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format.').normalizeEmail(),
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Verification code must be 6 digits.'),
  validate,
];

// --- Email-only endpoints (resend OTP / forgot password) ---
const emailValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format.').normalizeEmail(),
  validate,
];

// --- Password reset ---
const resetPasswordValidation = [
  body('email').trim().isEmail().withMessage('Invalid email format.').normalizeEmail(),
  body('code')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Reset code must be 6 digits.'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.')
    .isLength({ max: 72 })
    .withMessage('Password cannot exceed 72 characters.'),
  validate,
];

// --- Report creation ---
const createReportValidation = [
  body('category')
    .trim()
    .isIn(['Natural', 'Infrastructure', 'Utility', 'Human-Induced'])
    .withMessage('Invalid category. Must be one of: Natural, Infrastructure, Utility, Human-Induced.'),
  body('subtype')
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Invalid subtype. Please select a valid hazard subtype.'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters.'),
  body('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude. Must be between -90 and 90.'),
  body('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude. Must be between -180 and 180.'),
  validate,
];

// --- Hazard status update ---
const hazardStatusValidation = [
  body('fixedStatus')
    .trim()
    .isIn(['not fixed', 'in progress', 'fixed'])
    .withMessage('Invalid status. Must be: not fixed, in progress, or fixed.'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('Notes must be a string.')
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters.')
    .trim(),
  validate,
];

// --- Report update (whitelisted fields) ---
const updateReportValidation = [
  body('category')
    .optional()
    .trim()
    .isIn(['Natural', 'Infrastructure', 'Utility', 'Human-Induced'])
    .withMessage('Invalid category.'),
  body('subtype')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Invalid subtype.'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters.'),
  body('fixedStatus')
    .optional()
    .trim()
    .isIn(['not fixed', 'in progress', 'fixed'])
    .withMessage('Invalid fixed status.'),
  body('verifiedStatus')
    .optional()
    .trim()
    .isIn(['pending', 'verified', 'rejected'])
    .withMessage('Invalid verified status.'),
  validate,
];

module.exports = {
  registerValidation,
  loginValidation,
  verifyValidation,
  emailValidation,
  resetPasswordValidation,
  createReportValidation,
  hazardStatusValidation,
  updateReportValidation,
};