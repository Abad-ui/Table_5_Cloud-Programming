// ===============================================
// logger.js
// Simple middleware for logging HTTP requests
// ===============================================

// ================================
// Log Request Method & Path
// ================================
const logger = (req, res, next) => {
  console.log(req.method, req.path);
  next();
};

// ================================
// Exported Middleware
// ================================
module.exports = logger;
