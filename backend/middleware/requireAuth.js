// ===============================================
// requireAuth.js
// Middleware to verify user authentication using JWT
// ===============================================

const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// ================================
// Authentication Middleware
// ================================
const requireAuth = async (req, res, next) => {
  // Read token from the HttpOnly cookie first, fall back to the Authorization header
  let token = null;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if the token is missing
  if (!token)
    return res.status(401).json({ error: 'Authorization token required' });

  try {
    // Verify and decode the JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user associated with the token
    req.user = await User.findById(decoded._id).select('_id email role');

    // If no user found (deleted or invalid)
    if (!req.user)
      return res.status(401).json({ error: 'User not found or deleted' });

    // Proceed to the next middleware or controller
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ error: 'Request is not authorized' });
  }
};

// ================================
// Exported Middleware
// ================================
module.exports = requireAuth;
