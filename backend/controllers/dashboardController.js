// ===============================================
// dashboardController.js
// Handles dashboard related statistics
// ===============================================

const Report = require('../models/reportModel');
const Hazard = require('../models/hazardModel');
const User = require('../models/userModel');

// ===============================================
// Response Handler
// ===============================================
const sendResponse = (res, statusCode, success, message, key = null, data = null) => {
  const response = { success, message };
  if (key && data !== null) response[key] = data;
  return res.status(statusCode).json(response);
};

// ===============================================
// Get Report Type Distribution
// ===============================================
const getReportTypeDistribution = async (req, res) => {
  try {
    const distribution = await Report.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$subtype', 'Unknown Hazard Type'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return sendResponse(res, 200, true, 'Report type distribution retrieved successfully.', 'distribution', distribution);
  } catch (error) {
    console.error('Error fetching report type distribution:', error);
    return sendResponse(res, 500, false, 'Failed to retrieve report type distribution.', 'error', error.message);
  }
};

// ===============================================
// Get Report Trends Over Time
// ===============================================
const getReportTrends = async (req, res) => {
  try {
    const trends = await Report.aggregate([
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          totalReports: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return sendResponse(res, 200, true, 'Report trends retrieved successfully.', 'trends', trends);
  } catch (error) {
    console.error('Error fetching report trends:', error);
    return sendResponse(res, 500, false, 'Failed to retrieve report trends.', 'error', error.message);
  }
};

// ===============================================
// Get Most Reported Hazard Subtypes
// ===============================================
const getMostReportedHazards = async (req, res) => {
  try {
    const mostReported = await Report.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$subtype', 'Unknown Hazard Type'] },
          reportCount: { $sum: 1 },
        },
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 },
    ]);

    return sendResponse(res, 200, true, 'Most reported hazard subtypes retrieved successfully.', 'mostReported', mostReported);
  } catch (error) {
    console.error('Error fetching most reported hazards:', error);
    return sendResponse(res, 500, false, 'Failed to retrieve most reported hazards.', 'error', error.message);
  }
};

// ===============================================
// Get Dashboard Statistics
// ===============================================
const getDashboardStats = async (req, res) => {
  try {
    // Total regular users
    const userCount = await User.countDocuments();

    // Total admin users
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Total non-deleted reports
    const reportCount = await Report.countDocuments({ isDeleted: false });

    // Verified reports (non-deleted)
    const verifiedCount = await Report.countDocuments({ verifiedStatus: 'verified', isDeleted: false });

    // Pending reports (non-deleted)
    const pendingCount = await Report.countDocuments({ verifiedStatus: 'pending', isDeleted: false });

    // Resolved/fixed hazards
    const resolvedCount = await Hazard.countDocuments({ fixedStatus: 'fixed' });

    const stats = {
      userCount,
      adminCount,
      reportCount,
      verifiedCount,
      pendingCount,
      resolvedCount,
    };

    return sendResponse(res, 200, true, 'Dashboard statistics retrieved successfully.', 'stats', stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return sendResponse(res, 500, false, 'Failed to retrieve dashboard statistics.', 'error', error.message);
  }
};


// ===============================================
// Export Controller Methods
// ===============================================
module.exports = {
  getReportTypeDistribution,
  getReportTrends,
  getMostReportedHazards,
  getDashboardStats
};
