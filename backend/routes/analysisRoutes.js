// In your routes file
const express = require('express');
const router = express.Router();
const { 
  getAnalysisData, 
  getAIAnalysis, 
  generateAnalysisPDF,
  generatePDFFromSaved,
  getAnalysis,
  getSavedAnalyses,
  getAnalysisById
} = require('../controllers/analysisController'); 

const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { aiAnalysisLimiter, pdfLimiter } = require('../middleware/rateLimiter');

// Get basic analysis data (no AI) - for page load
router.get('/data', requireAuth, requireAdmin, getAnalysisData);

// Get AI-enhanced analysis - called when button is pressed
router.post('/ai-analysis', requireAuth, requireAdmin, aiAnalysisLimiter, getAIAnalysis);

// Generate PDF with fresh AI analysis
router.get('/pdf', requireAuth, requireAdmin, pdfLimiter, generateAnalysisPDF);

// Generate PDF from saved analysis (no new AI call)
router.get('/saved/:id/pdf', requireAuth, requireAdmin, pdfLimiter, generatePDFFromSaved);

// Get saved analyses with pagination
router.get('/saved', requireAuth, requireAdmin, getSavedAnalyses);

// Get specific analysis by ID
router.get('/saved/:id', requireAuth, requireAdmin, getAnalysisById);

// Legacy endpoint for backward compatibility (optional)
router.post('/analyze', requireAuth, requireAdmin, getAnalysis);

module.exports = router;