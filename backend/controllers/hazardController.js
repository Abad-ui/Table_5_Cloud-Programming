// ================================
// hazardController.js (Updated with Validation)
// ================================
const mongoose = require('mongoose');
const Hazard = require('../models/hazardModel');
const Report = require('../models/reportModel');

// ================================
// Validation Functions
// ================================
const validateFixedStatus = (status) => {
  const validStatuses = ['not fixed', 'in progress', 'fixed'];
  return validStatuses.includes(status);
};

const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
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
// Get All Hazards
// ================================
const getAllHazards = async (req, res) => {
  try {
    // Optional query parameters for filtering
    const { category, fixedStatus, verifiedBy, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Category filter
    if (category) {
      const validCategories = ['flood', 'fire', 'earthquake', 'landslide', 'accident', 'other'];
      if (!validCategories.includes(category)) {
        return sendResponse(res, 400, false, `Invalid category. Must be one of: ${validCategories.join(', ')}`);
      }
      filter.category = category;
    }
    
    // Fixed status filter
    if (fixedStatus) {
      if (!validateFixedStatus(fixedStatus)) {
        return sendResponse(res, 400, false, 'Invalid fixed status. Must be: not fixed, in progress, or fixed.');
      }
      filter.fixedStatus = fixedStatus;
    }
    
    // Verified by filter
    if (verifiedBy) {
      if (!validateObjectId(verifiedBy)) {
        return sendResponse(res, 400, false, 'Invalid verifiedBy user ID.');
      }
      filter.verifiedBy = verifiedBy;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return sendResponse(res, 400, false, 'Invalid start date format. Use YYYY-MM-DD.');
        }
        filter.createdAt.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return sendResponse(res, 400, false, 'Invalid end date format. Use YYYY-MM-DD.');
        }
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const hazards = await Hazard.find(filter)
      .sort({ createdAt: -1 })
      .populate('verifiedBy', 'username email')
      .populate('reportId', 'user mergedUsers reportCount');

    return sendResponse(res, 200, true, 'Hazards retrieved successfully.', 'hazards', hazards);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch hazards.', 'error', err.message);
  }
};

// ================================
// Get Hazard by ID
// ================================
const getHazardById = async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return sendResponse(res, 400, false, 'Invalid hazard ID.');

  try {
    const hazard = await Hazard.findById(id)
      .populate('verifiedBy', 'username email')
      .populate('reportId', 'user mergedUsers reportCount');

    if (!hazard) return sendResponse(res, 404, false, 'Hazard not found.');

    return sendResponse(res, 200, true, 'Hazard retrieved successfully.', 'hazard', hazard);
  } catch (err) {
    return sendResponse(res, 500, false, 'Error retrieving hazard.', 'error', err.message);
  }
};

// ================================
// Update Hazard Status (Admin)
// ================================
const updateHazardStatus = async (req, res) => {
  const { id } = req.params;
  const { fixedStatus, notes } = req.body;

  // Basic validation
  if (!validateObjectId(id))
    return sendResponse(res, 400, false, 'Invalid hazard ID.');

  if (!fixedStatus)
    return sendResponse(res, 400, false, 'Fixed status is required.');

  if (!validateFixedStatus(fixedStatus))
    return sendResponse(res, 400, false, 'Invalid status. Must be: not fixed, in progress, or fixed.');

  // Validate notes if provided
  if (notes && (typeof notes !== 'string' || notes.trim().length > 500)) {
    return sendResponse(res, 400, false, 'Notes must be a string and cannot exceed 500 characters.');
  }

  try {
    // Prepare update data
    const updateData = { fixedStatus };
    
    // Add notes if provided
    if (notes) {
      updateData.notes = notes.trim();
    }

    // If marking as 'fixed', set fixedAt to current time
    if (fixedStatus === 'fixed') {
      updateData.fixedAt = new Date();
    } else if (fixedStatus !== 'fixed') {
      // Reset fixedAt if changing from 'fixed' to another status
      updateData.fixedAt = null;
    }

    // Update hazard
    const hazard = await Hazard.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!hazard) return sendResponse(res, 404, false, 'Hazard not found.');

    // Update the corresponding report's fixedStatus and fixedAt
    if (hazard.reportId) {
      const reportUpdateData = { fixedStatus };
      if (fixedStatus === 'fixed') {
        reportUpdateData.fixedAt = new Date();
      } else if (fixedStatus !== 'fixed') {
        reportUpdateData.fixedAt = null;
      }
      
      await Report.findByIdAndUpdate(
        hazard.reportId,
        reportUpdateData,
        { new: true, runValidators: true }
      );
    }

    return sendResponse(res, 200, true, `Hazard and associated report marked as ${fixedStatus}.`, 'hazard', hazard);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to update hazard status.', 'error', err.message);
  }
};

// ================================
// Update Hazard Details (Admin)
// ================================
const updateHazardDetails = async (req, res) => {
  const { id } = req.params;
  const { category, subtype, description, notes } = req.body;

  if (!validateObjectId(id))
    return sendResponse(res, 400, false, 'Invalid hazard ID.');

  // Validate that at least one field is provided
  if (!category && !subtype && !description && !notes) {
    return sendResponse(res, 400, false, 'At least one field to update is required (category, subtype, description, or notes).');
  }

  // Validation functions (reuse from report controller if available)
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

  const validateDescription = (desc) => {
    return typeof desc === 'string' && desc.trim().length >= 10 && desc.trim().length <= 500;
  };

  try {
    const updateData = {};

    // Validate and add fields to update
    if (category) {
      if (!validateCategory(category)) {
        return sendResponse(res, 400, false, 'Invalid category. Must be one of: flood, fire, earthquake, landslide, accident, other.');
      }
      updateData.category = category;
    }

    if (subtype) {
      if (!category) {
        // Need category to validate subtype
        const currentHazard = await Hazard.findById(id);
        if (!currentHazard) return sendResponse(res, 404, false, 'Hazard not found.');
        
        if (!validateSubtype(currentHazard.category, subtype)) {
          return sendResponse(res, 400, false, 'Invalid subtype for the current hazard category.');
        }
      } else if (!validateSubtype(category, subtype)) {
        return sendResponse(res, 400, false, 'Invalid subtype for the selected category.');
      }
      updateData.subtype = subtype;
    }

    if (description) {
      if (!validateDescription(description)) {
        return sendResponse(res, 400, false, 'Description must be between 10 and 500 characters.');
      }
      updateData.description = description.trim();
    }

    if (notes !== undefined) {
      if (typeof notes !== 'string' || notes.trim().length > 500) {
        return sendResponse(res, 400, false, 'Notes must be a string and cannot exceed 500 characters.');
      }
      updateData.notes = notes.trim();
    }

    const hazard = await Hazard.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!hazard) return sendResponse(res, 404, false, 'Hazard not found.');

    return sendResponse(res, 200, true, 'Hazard details updated successfully.', 'hazard', hazard);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to update hazard details.', 'error', err.message);
  }
};

// ================================
// Get Hazards for Map Display
// Show hazards not fixed or fixed within the last 24 hours
// ================================
const getHazardsForMap = async (req, res) => {
  try {
    const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);

    const hazards = await Hazard.find({
      $or: [
        { fixedStatus: { $ne: 'fixed' } },
        { fixedStatus: 'fixed', fixedAt: { $gte: oneDayAgo } }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('verifiedBy', 'username email')
      .populate('reportId', 'user mergedUsers reportCount');

    return sendResponse(res, 200, true, 'Hazards for map retrieved successfully.', 'hazards', hazards);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch hazards for map.', 'error', err.message);
  }
};

// ================================
// Delete Hazard (Admin)
// ================================
const deleteHazard = async (req, res) => {
  const { id } = req.params;

  if (!validateObjectId(id))
    return sendResponse(res, 400, false, 'Invalid hazard ID.');

  try {
    const hazard = await Hazard.findByIdAndDelete(id);

    if (!hazard) return sendResponse(res, 404, false, 'Hazard not found.');

    return sendResponse(res, 200, true, 'Hazard deleted successfully.', 'hazard', { id: hazard._id });
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to delete hazard.', 'error', err.message);
  }
};

// ================================
// Export
// ================================
module.exports = {
  getAllHazards,
  getHazardById,
  updateHazardStatus,
  updateHazardDetails,
  getHazardsForMap,
  deleteHazard
};