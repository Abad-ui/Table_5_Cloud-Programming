// ================================
// reportController.js (Updated with Correct Validation)
// ================================

const mongoose = require('mongoose');
const Report = require('../models/reportModel');
const Hazard = require('../models/hazardModel');
const User = require('../models/userModel');
const axios = require('axios');

// ================================
// Radius Helper
// ================================
const RADIUS = 0.0001;

// ================================
// Validation Functions (UPDATED TO MATCH MODEL)
// ================================
const validateCoordinates = (lat, lng) => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  return !isNaN(latNum) && !isNaN(lngNum) && 
         latNum >= -90 && latNum <= 90 && 
         lngNum >= -180 && lngNum <= 180;
};

const validateCategory = (category) => {
  const validCategories = ['Natural', 'Infrastructure', 'Utility', 'Human-Induced'];
  return validCategories.includes(category);
};

const validateSubtype = (subtype) => {
  const validSubtypes = [
    // Natural
    'Flood', 'Typhoon', 'Landslide', 'Earthquake', 'Volcanic Eruption', 'Storm Surge', 'Drought', 'Tsunami',
    // Infrastructure
    'Pothole', 'Collapsed Building', 'Broken Bridge', 'Damaged Drainage', 'Fallen Tree', 'Fallen Post',
    // Utility
    'Power Outage', 'Broken Streetlight', 'Water Leak', 'Telecommunication Outage', 'Gas Leak',
    // Human-Induced
    'Fire Incident', 'Road Accident', 'Chemical Spill', 'Garbage Pileup', 'Vandalism'
  ];
  return validSubtypes.includes(subtype);
};

const validateDescription = (description) => {
  return typeof description === 'string' && 
         description.trim().length >= 10 && 
         description.trim().length <= 500;
};

const validateFixedStatus = (status) => {
  const validStatuses = ['not fixed', 'in progress', 'fixed'];
  return validStatuses.includes(status);
};

const validateVerifiedStatus = (status) => {
  const validStatuses = ['pending', 'verified', 'rejected'];
  return validStatuses.includes(status);
};

// ================================
// Response Helper
// ================================
const sendResponse = (res, code, success, message, key = null, data = null) => {
  const response = { success, message };
  if (key && data !== null) response[key] = data;
  return res.status(code).json(response);
};

// ================================
// Get Reports for Map Display
// Show reports not fixed or fixed within the last 24 hours
// ================================
const getReportsForMap = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);

    const reports = await Report.find({
      isDeleted: false,
      $or: [
        { fixedStatus: { $ne: 'fixed' } }, // not fixed
        { fixedStatus: 'fixed', fixedAt: { $gte: oneDayAgo } } // fixed less than 1 day ago
      ]
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username email');

    // Handle deleted users
    const formattedReports = reports.map(report => {
      const reportObj = report.toObject();
      if (!reportObj.user) reportObj.user = { username: 'Deleted User', email: 'N/A' };
      return reportObj;
    });

    return sendResponse(res, 200, true, 'Reports for map retrieved successfully.', 'reports', formattedReports);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch reports for map.', 'error', err.message);
  }
};

// ================================
// Get All Reports (Admin/User)
// ================================
const getAllReports = async (req, res) => {
  try {
    let reports = await Report.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .populate('user', 'username email');

    reports = reports.map(report => {
      const reportObj = report.toObject();
      if (!reportObj.user) reportObj.user = { username: 'Deleted User', email: 'N/A' };
      return reportObj;
    });

    return sendResponse(res, 200, true, 'Reports retrieved successfully.', 'reports', reports);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch reports.', 'error', err.message);
  }
};

// ================================
// Get Reports by User ID
// ================================
const getReportByUserId = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId))
      return sendResponse(res, 400, false, 'Invalid user ID.');

    let reports = await Report.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username email');

    reports = reports.map(report => {
      const reportObj = report.toObject();
      if (!reportObj.user) reportObj.user = { username: 'Deleted User', email: 'N/A' };
      return reportObj;
    });

    return sendResponse(res, 200, true, 'User reports retrieved successfully.', 'reports', reports);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch user reports.', 'error', err.message);
  }
};

// ================================
// Get User Report Count
// ================================
const getUserReportCount = async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId))
    return sendResponse(res, 400, false, 'Invalid user ID.');

  try {
    const user = await User.findById(userId);
    if (!user) return sendResponse(res, 404, false, 'User not found.');

    const reportCount = await Report.countDocuments({ user: userId });
    return sendResponse(res, 200, true, 'User report count retrieved successfully.', 'reportCount', reportCount);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch user report count.', 'error', err.message);
  }
};

// ================================
// Create a New Report (User)
// ================================
// ================================
// Create a New Report (User) - WITH SPAM PREVENTION
// ================================
const createReport = async (req, res) => {
  try {
    const { category, subtype, description, lat, lng } = req.body;

    // Basic validation
    if (!category || !subtype || !description || !lat || !lng)
      return sendResponse(res, 400, false, 'Category, subtype, description, and location are required.');
    
    if (!req.file) 
      return sendResponse(res, 400, false, 'Photo upload is required.');

    // Enhanced validation (UPDATED TO MATCH MODEL)
    if (!validateCategory(category))
      return sendResponse(res, 400, false, 'Invalid category. Must be one of: Natural, Infrastructure, Utility, Human-Induced.');

    if (!validateSubtype(subtype))
      return sendResponse(res, 400, false, 'Invalid subtype. Please select a valid hazard subtype.');

    if (!validateDescription(description))
      return sendResponse(res, 400, false, 'Description must be between 10 and 500 characters.');

    if (!validateCoordinates(lat, lng))
      return sendResponse(res, 400, false, 'Invalid latitude or longitude values. Latitude must be between -90 and 90, longitude between -180 and 180.');

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(req.file.mimetype))
      return sendResponse(res, 400, false, 'Invalid file type. Only JPEG, PNG, and GIF images are allowed.');

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (req.file.size > maxSize)
      return sendResponse(res, 400, false, 'File too large. Maximum size is 5MB.');

    // ================================
    // SPAM PREVENTION: Check for recent reports from same user in same area
    // ================================
    const SPAM_PREVENTION_RADIUS = 0.0001; // ~100 meters radius
    const SPAM_TIME_WINDOW = 30 * 60 * 1000; // 30 minutes in milliseconds

    const recentUserReport = await Report.findOne({
      user: req.user._id,
      "location.lat": { 
        $gte: latitude - SPAM_PREVENTION_RADIUS, 
        $lte: latitude + SPAM_PREVENTION_RADIUS 
      },
      "location.lng": { 
        $gte: longitude - SPAM_PREVENTION_RADIUS, 
        $lte: longitude + SPAM_PREVENTION_RADIUS 
      },
      createdAt: { 
        $gte: new Date(Date.now() - SPAM_TIME_WINDOW) 
      },
      isDeleted: false
    });

    if (recentUserReport) {
      const timeRemaining = Math.ceil((recentUserReport.createdAt.getTime() + SPAM_TIME_WINDOW - Date.now()) / (60 * 1000));
      return sendResponse(
        res, 
        429, 
        false, 
        `Please wait ${timeRemaining} minutes before submitting another report in this area. Duplicate reports in the same location are limited to prevent spam.`
      );
    }

    // ================================
    // SPAM PREVENTION: Check for similar reports from same user (different locations)
    // ================================
    /*const SIMILAR_REPORT_TIME_WINDOW = 5 * 60 * 1000; // 5 minutes
    const MAX_SIMILAR_REPORTS = 3;

    const recentSimilarReportsCount = await Report.countDocuments({
      user: req.user._id,
      category,
      subtype,
      createdAt: { 
        $gte: new Date(Date.now() - SIMILAR_REPORT_TIME_WINDOW) 
      },
      isDeleted: false
    });

    if (recentSimilarReportsCount >= MAX_SIMILAR_REPORTS) {
      return sendResponse(
        res, 
        429, 
        false, 
        `Too many similar reports submitted recently. Please wait ${SIMILAR_REPORT_TIME_WINDOW / (60 * 1000)} minutes before submitting another ${subtype} report.`
      );
    }*/

    // Reverse Geocode
    let address = {};
    try {
      const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
        params: { format: 'json', lat: latitude, lon: longitude, addressdetails: 1 },
        headers: { 'User-Agent': 'HazardWatcherApp' },
      });

      if (geoRes.data?.address) {
        const addr = geoRes.data.address;
        address = {
          barangay: addr.suburb || addr.village || addr.neighbourhood || addr.hamlet || '',
          municipality: addr.city || addr.town || addr.municipality || '',
          province: addr.state || '',
          fullAddress: geoRes.data.display_name || '',
        };
      }
    } catch (geoErr) {
      console.warn('Reverse geocoding failed:', geoErr.message);
      address = { barangay: '', municipality: '', province: '', fullAddress: '' };
    }

    // Merge nearby report (existing functionality)
    const existingReport = await Report.findOne({
      category,
      subtype,
      "location.lat": { $gte: latitude - RADIUS, $lte: latitude + RADIUS },
      "location.lng": { $gte: longitude - RADIUS, $lte: longitude + RADIUS },
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24) },
      isDeleted: false
    });

    if (existingReport) {
      // Check if user already contributed to this merged report
      if (!existingReport.mergedUsers.includes(req.user._id)) {
        existingReport.mergedUsers.push(req.user._id);
        existingReport.reportCount += 1;
      }
      if (description && !existingReport.description.includes(description)) {
        existingReport.description += ` | ${description}`;
      }
      if (req.file) existingReport.photoUrl = `/uploads/reports/${req.file.filename}`;

      await existingReport.save();
      return sendResponse(res, 200, true, 'Report merged with existing hazard.', 'report', existingReport);
    }

    // Create new report
    const report = await Report.create({
      user: req.user._id,
      category,
      subtype,
      description: description.trim(),
      location: { lat: latitude, lng: longitude },
      address,
      photoUrl: `/uploads/reports/${req.file.filename}`,
      fixedStatus: 'not fixed',
      fixedAt: null,
      mergedUsers: [req.user._id],
      reportCount: 1,
    });

    return sendResponse(res, 201, true, 'New report created successfully.', 'report', report);
  } catch (err) {
    console.error('Error creating/merging report:', err);
    return sendResponse(res, 500, false, 'Failed to create or merge report.', 'error', err.message);
  }
};

// ================================
// Verify Report (Admin)
// ================================
const verifyReport = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return sendResponse(res, 400, false, 'Invalid report ID.');

  try {
    const report = await Report.findById(id);
    if (!report) return sendResponse(res, 404, false, 'Report not found.');
    
    if (report.isDeleted)
      return sendResponse(res, 400, false, 'Cannot verify a deleted report.');
    
    if (report.verifiedStatus === 'verified')
      return sendResponse(res, 400, false, 'Report already verified.');

    report.verifiedStatus = 'verified';
    await report.save();

    const hazard = await Hazard.create({
      reportId: report._id,
      category: report.category,
      subtype: report.subtype,
      description: report.description,
      location: report.location,
      address: report.address,
      photoUrl: report.photoUrl,
      fixedStatus: report.fixedStatus,
      fixedAt: report.fixedAt,
      verifiedBy: req.user._id,
      reportCount: report.reportCount,
      mergedUsers: report.mergedUsers,
    });

    return sendResponse(res, 201, true, 'Report verified and moved to hazards.', 'hazard', hazard);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to verify report.', 'error', err.message);
  }
};

// ================================
// Reject Report (Admin)
// ================================
const rejectReport = async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id))
    return sendResponse(res, 400, false, 'Invalid report ID.');

  try {
    const report = await Report.findById(id);
    if (!report) return sendResponse(res, 404, false, 'Report not found.');

    if (report.isDeleted)
      return sendResponse(res, 400, false, 'Cannot reject a deleted report.');

    if (report.verifiedStatus === 'rejected')
      return sendResponse(res, 400, false, 'Report already rejected.');

    report.verifiedStatus = 'rejected';
    await report.save();

    return sendResponse(res, 200, true, 'Report rejected successfully.', 'report', report);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to reject report.', 'error', err.message);
  }
};

// ================================
// Update Report
// ================================
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    if (!mongoose.Types.ObjectId.isValid(id))
      return sendResponse(res, 400, false, 'Invalid report ID.');

    // Whitelist allowed updatable fields to prevent mass-assignment attacks
    const updates = {};
    if (body.category !== undefined) updates.category = body.category;
    if (body.subtype !== undefined) updates.subtype = body.subtype;
    if (body.description !== undefined) updates.description = body.description;
    if (body.fixedStatus !== undefined) updates.fixedStatus = body.fixedStatus;
    if (body.verifiedStatus !== undefined) updates.verifiedStatus = body.verifiedStatus;

    // Validate updates
    if (Object.keys(updates).length === 0)
      return sendResponse(res, 400, false, 'No fields to update.');

    // UPDATED VALIDATION TO MATCH MODEL
    if (updates.category && !validateCategory(updates.category))
      return sendResponse(res, 400, false, 'Invalid category. Must be one of: Natural, Infrastructure, Utility, Human-Induced.');

    if (updates.subtype && !validateSubtype(updates.subtype))
      return sendResponse(res, 400, false, 'Invalid subtype. Please select a valid hazard subtype.');

    if (updates.description && !validateDescription(updates.description))
      return sendResponse(res, 400, false, 'Description must be between 10 and 500 characters.');

    if (updates.fixedStatus && !validateFixedStatus(updates.fixedStatus))
      return sendResponse(res, 400, false, 'Invalid fixed status. Must be: not fixed, in progress, or fixed.');

    if (updates.verifiedStatus && !validateVerifiedStatus(updates.verifiedStatus))
      return sendResponse(res, 400, false, 'Invalid verified status. Must be: pending, verified, or rejected.');

    // If fixedStatus is updated to 'fixed', set fixedAt
    if (updates.fixedStatus === 'fixed') {
      updates.fixedAt = new Date();
    }

    const report = await Report.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    );

    if (!report) return sendResponse(res, 404, false, 'Report not found or deleted.');

    return sendResponse(res, 200, true, 'Report updated successfully.', 'report', report);
  } catch (error) {
    return sendResponse(res, 500, false, 'Error updating report.', 'error', error.message);
  }
};

// ==============================
// deleteReport (Soft Delete)
// ==============================
const deleteReport = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return sendResponse(res, 400, false, 'Invalid report ID.');

  try {
    const report = await Report.findById(id);
    if (!report) return sendResponse(res, 404, false, 'Report not found.');

    if (report.verifiedStatus === 'pending' || report.verifiedStatus === 'rejected') {
      await Report.deleteOne({ _id: id });

      return sendResponse(res, 200, true, 'Pending/Rejected report permanently deleted.', 'reportId', id);
    }

    // 3. VERIFIED / REJECTED → SOFT DELETE
    const updated = await Report.findByIdAndUpdate(
      id,
      { isDeleted: true, deletedAt: new Date() },
      { new: true, select: '-__v' } // hide version key
    );

    return sendResponse(res, 200, true, 'Report soft-deleted successfully.', 'report', updated);
  } catch (error) {
    console.error('deleteReport error:', error);
    return sendResponse(res, 500, false, 'Error deleting report.', 'error', error.message);
  }
};

// ================================
// Export
// ================================
module.exports = {
  getReportsForMap,
  getAllReports,
  getReportByUserId,
  getUserReportCount,
  createReport,
  verifyReport,
  rejectReport,
  updateReport,
  deleteReport
};