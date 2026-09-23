const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const analysisSchema = new Schema({
    // Link to the admin or user who triggered the analysis
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // Automatically generated date
    generatedAt: {
      type: Date,
      default: Date.now,
    },

    // Key statistical data
    dashboardStats: {
      userCount: { type: Number, default: 0 },
      adminCount: { type: Number, default: 0 },
      reportCount: { type: Number, default: 0 },
      verifiedCount: { type: Number, default: 0 },
      pendingCount: { type: Number, default: 0 },
      resolvedCount: { type: Number, default: 0 },
      verificationRate: { type: String, default: "0.0" },
      resolutionRate: { type: String, default: "0.0" },
      activeHazards: { type: Number, default: 0 },
      totalHazards: { type: Number, default: 0 },
    },

    // Barangays with most reports
    mostReportedBarangays: [{
      barangay: { type: String },
      count: { type: Number },
    }],

    // Types of reports
    reportTypeDistribution: [{
      typeName: { type: String },
      count: { type: Number },
    }],

    // Monthly or yearly trends
    trends: [{
      month: { type: Number },
      year: { type: Number },
      totalReports: { type: Number },
    }],

    analysisType: {
      type: String,
      enum: ['ai', 'pdf', 'full'],
      default: 'full'
    },

    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },

    // Text-based sections
    structuredReport: { 
      type: String,
      default: "" 
    },
    
    aiInsights: { 
      type: String,
      default: "" 
    },

    // Risk level and summary fields
    riskLevel: { 
      type: String, 
      default: "Unknown" 
    },
    
    summary: { 
      type: String, 
      default: "No summary provided." 
    }
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);