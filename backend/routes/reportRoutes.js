const express = require('express');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { reportCreateLimiter } = require('../middleware/rateLimiter');
const { createReportValidation, updateReportValidation } = require('../middleware/validation');
const {
  getReportsForMap,
  getAllReports,
  getReportByUserId,
  getUserReportCount,
  createReport,
  verifyReport,
  rejectReport,
  updateReport,
  deleteReport
} = require('../controllers/reportController');

const router = express.Router();

// ================================
// Multer config for file upload
// ================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/reports'); // folder to save images
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = file.originalname.split('.').pop();
    cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

// ================================
// Report Management Routes
// ================================
router.get('/', requireAuth, getAllReports);
router.get('/user/:userId', requireAuth, getReportByUserId);
router.get('/user/count/:userId', requireAuth, getUserReportCount);
router.get('/map', requireAuth, getReportsForMap);

router.post('/', requireAuth, reportCreateLimiter, upload.single('photo'), createReportValidation, createReport); // use 'photo' field for image

router.patch('/update/:id', requireAuth, updateReportValidation, updateReport)
router.delete('/delete/:id', requireAuth, deleteReport)

router.patch('/verify/:id', requireAuth, requireAdmin, verifyReport);
router.patch('/reject/:id', requireAuth, requireAdmin, rejectReport);

module.exports = router;
