// ================================
// Analysis Routes Routes
// ================================

const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const { 
  getReportTypeDistribution, 
  getReportTrends, 
  getMostReportedHazards,
  getDashboardStats
} = require('../controllers/dashboardController');

const router = express.Router();

router.get('/type-distribution', requireAuth, requireAdmin, getReportTypeDistribution);
router.get('/trends', requireAuth, requireAdmin, getReportTrends);
router.get('/most-reported', requireAuth, requireAdmin, getMostReportedHazards);
router.get('/stats', requireAuth, requireAdmin, getDashboardStats);

module.exports = router;
