// ==============================================
// Rate Limiting Middleware
// Protects abuse-prone endpoints from brute force,
// credential stuffing, spam, and resource exhaustion.
// ==============================================
const rateLimit = require('express-rate-limit');

// Generic handler that returns a consistent JSON error
const standardHandler = (req, res, next, message) => {
  res.status(429).json({
    success: false,
    message
  });
};

// Shared options
const baseOptions = (windowMs, max, message) => ({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => standardHandler(req, res, null, message),
  message
});

// --- Auth & account endpoints (brute force / credential stuffing targets) ---
// 10 attempts per 15 minutes
const authLimiter = rateLimit(baseOptions(
  15 * 60 * 1000,
  10,
  'Too many attempts. Please try again in 15 minutes.'
));

// Login-specific: 5 attempts per 15 minutes to slow brute force
const loginLimiter = rateLimit(baseOptions(
  15 * 60 * 1000,
  5,
  'Too many login attempts. Please try again in 15 minutes.'
));

// OTP/verification: prevents OTP guessing
const otpLimiter = rateLimit(baseOptions(
  15 * 60 * 1000,
  10,
  'Too many verification attempts. Please try again in 15 minutes.'
));

// Resend OTP / password reset requests: prevents email bombing
const emailLimiter = rateLimit(baseOptions(
  60 * 60 * 1000,
  3,
  'Too many requests. Please try again in an hour.'
));

// --- Resource-heavy / cost-heavy endpoints ---
// AI analysis costs money - protect against repeated abuse
const aiAnalysisLimiter = rateLimit(baseOptions(
  60 * 60 * 1000,
  10,
  'Too many AI analysis requests. Please try again in an hour.'
));

// PDF generation is CPU heavy
const pdfLimiter = rateLimit(baseOptions(
  60 * 60 * 1000,
  10,
  'Too many PDF generation requests. Please try again in an hour.'
));

// --- Write endpoints (report spam) ---
// Report creation: 20 per hour to reduce spam
const reportCreateLimiter = rateLimit(baseOptions(
  60 * 60 * 1000,
  20,
  'Too many reports submitted. Please try again in an hour.'
));

// General API limiter as a fallback safety net
const apiLimiter = rateLimit(baseOptions(
  15 * 60 * 1000,
  300,
  'Too many requests. Please slow down.'
));

module.exports = {
  authLimiter,
  loginLimiter,
  otpLimiter,
  emailLimiter,
  aiAnalysisLimiter,
  pdfLimiter,
  reportCreateLimiter,
  apiLimiter
};