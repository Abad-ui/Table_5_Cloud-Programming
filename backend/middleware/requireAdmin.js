// ===============================================
// requireAdmin.js
// Middleware to restrict access to admin users only
// ===============================================

// ================================
// Admin Access Middleware
// ================================
const requireAdmin = (req, res, next) => {
  // Check if the authenticated user is not an admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admins only' });
  }

  // Allow request to proceed
  next();
};

// ================================
// Exported Middleware
// ================================
module.exports = requireAdmin;
