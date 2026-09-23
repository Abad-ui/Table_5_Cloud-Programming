// ================================
// Hazard Routes
// ================================
const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { hazardStatusValidation } = require('../middleware/validation');

const {
  getAllHazards,
  updateHazardStatus,
  getHazardsForMap
} = require('../controllers/hazardController');

const router = express.Router();

// Get all hazards (admins and users can view)
router.get('/',  getAllHazards);

router.get('/map', requireAuth, getHazardsForMap);

// Admin updates hazard fix status
router.patch('/status/:id', requireAuth, requireAdmin, hazardStatusValidation, updateHazardStatus);

// ================================
// Export Router
// ================================
module.exports = router;
 