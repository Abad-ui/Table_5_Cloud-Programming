const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// ================================
// User Schema Definition
// ================================
const userSchema = new Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional for Google users

    // Authentication provider (local or Google)
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },

    // Role field to distinguish admin from regular users
    role: {
      type: String,
      enum: ['regular', 'admin'],
      default: 'regular',
      required: true,
    },
    
    // OTP/Verification fields
    verificationCode: { type: String },
    isVerified: { type: Boolean, default: false },
    otpExpires: { type: Date }, // NEW: Track OTP expiration
  },
  { timestamps: true }
);

// ================================
// Exported Model
// ================================
module.exports = mongoose.model('User', userSchema);