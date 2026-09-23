// models/reportModel.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mergedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reportCount: { type: Number, default: 1 },

    category: {
      type: String,
      enum: ['Natural', 'Infrastructure', 'Utility', 'Human-Induced'],
      required: true
    },
    subtype: {
      type: String,
      enum: [
        // Natural
        'Flood', 'Typhoon', 'Landslide', 'Earthquake', 'Volcanic Eruption', 'Storm Surge', 'Drought', 'Tsunami',
        // Infrastructure
        'Pothole', 'Collapsed Building', 'Broken Bridge', 'Damaged Drainage', 'Fallen Tree', 'Fallen Post',
        // Utility
        'Power Outage', 'Broken Streetlight', 'Water Leak', 'Telecommunication Outage', 'Gas Leak',
        // Human-Induced
        'Fire Incident', 'Road Accident', 'Chemical Spill', 'Garbage Pileup', 'Vandalism'
      ],
      required: true
    },
    description: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    address: {
      barangay: { type: String },
      municipality: { type: String },
      province: { type: String },
      fullAddress: { type: String },
    },

    photoUrl: { type: String, required: true },

    verifiedStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },

    fixedStatus: {
      type: String,
      enum: ['not fixed', 'in progress', 'fixed'],
      default: 'not fixed',
    },

    fixedAt: {
      type: Date,
      default: null
    },

    // ✅ Soft delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
