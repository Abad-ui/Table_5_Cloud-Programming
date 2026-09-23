// models/hazardModel.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const hazardSchema = new Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
    reportCount: { type: Number, default: 1 },
    mergedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    category: {
      type: String,
      enum: ['Natural', 'Infrastructure', 'Utility', 'Human-Induced'],
      required: true,
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
      required: true,
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

    fixedStatus: {
      type: String,
      enum: ['not fixed', 'in progress', 'fixed'],
      default: 'not fixed',
    },

    fixedAt: {
      type: Date,
      default: null
    },

    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // ✅ Soft delete fields
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hazard', hazardSchema);
