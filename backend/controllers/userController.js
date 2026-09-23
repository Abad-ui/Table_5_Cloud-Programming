require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail, sendOTPEmail } = require('../utils/sendEmail');
const User = require('../models/userModel');

// ================================
// Helper: Create JWT Token
// ================================
const createToken = (user) => {
  return jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// ================================
// Validation Functions
// ================================
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return typeof password === 'string' && password.length >= 6;
};

const validateUsername = (username) => {
  return typeof username === 'string' && username.length >= 3 && username.length <= 30;
};

const validateOTP = (code) => {
  return typeof code === 'string' && /^\d{6}$/.test(code);
};

// ================================
// Response Handler
// ================================
const sendResponse = (res, statusCode, success, message, key = null, data = null) => {
  const response = { success, message };
  if (key && data !== null) response[key] = data;
  return res.status(statusCode).json(response);
};

// ================================
// Get All Users
// ================================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, true, 'Users retrieved successfully.', 'users', users);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to fetch users.', 'error', err.message);
  }
};

// ================================
// Get User by ID
// ================================
const getUserById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return sendResponse(res, 400, false, 'Invalid user ID.');

  try {
    const user = await User.findById(id);
    if (!user) return sendResponse(res, 404, false, 'User not found.');

    return sendResponse(res, 200, true, 'User retrieved successfully.', 'user', user);
  } catch (err) {
    return sendResponse(res, 500, false, 'Error retrieving user.', 'error', err.message);
  }
};

// ================================
// Register User (UPDATED WITH OTP)
// ================================
const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password)
    return sendResponse(res, 400, false, 'Username, email, and password are required.');

  // Enhanced validation
  if (!validateUsername(username))
    return sendResponse(res, 400, false, 'Username must be 3-30 characters long.');

  if (!validateEmail(email))
    return sendResponse(res, 400, false, 'Invalid email format.');

  if (!validatePassword(password))
    return sendResponse(res, 400, false, 'Password must be at least 6 characters long.');

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return sendResponse(res, 400, false, 'Email already in use.');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate 6-digit OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create or update user
    if (existingUser) {
      // User exists but not verified, update their info
      existingUser.username = username;
      existingUser.password = hashedPassword;
      existingUser.verificationCode = verificationCode;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      // Create new user
      await User.create({
        username,
        email,
        password: hashedPassword,
        verificationCode,
        otpExpires,
        isVerified: false,
      });
    }

    // Send OTP email with HTML template
    await sendOTPEmail(email, username, verificationCode);

    return sendResponse(res, 201, true, 'Verification code sent to your email. Please check your inbox.');
  } catch (err) {
    return sendResponse(res, 400, false, 'User registration failed.', 'error', err.message);
  }
};

// ================================
// Verify Account (UPDATED WITH EXPIRATION CHECK)
// ================================
const verifyAccount = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code)
    return sendResponse(res, 400, false, 'Email and code are required.');

  if (!validateEmail(email))
    return sendResponse(res, 400, false, 'Invalid email format.');

  if (!validateOTP(code))
    return sendResponse(res, 400, false, 'Verification code must be 6 digits.');

  try {
    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, 404, false, 'User not found.');

    if (user.isVerified)
      return sendResponse(res, 400, false, 'User already verified.');

    // Check if OTP expired
    if (user.otpExpires && user.otpExpires < new Date()) {
      return sendResponse(res, 400, false, 'Verification code has expired. Please request a new one.');
    }

    if (user.verificationCode !== code)
      return sendResponse(res, 400, false, 'Invalid verification code.');

    user.isVerified = true;
    user.verificationCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    return sendResponse(res, 200, true, 'Account verified successfully! You can now login.');
  } catch (err) {
    return sendResponse(res, 500, false, 'Verification failed.', 'error', err.message);
  }
};

// ================================
// Resend OTP
// ================================
const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return sendResponse(res, 400, false, 'Email is required.');

  if (!validateEmail(email))
    return sendResponse(res, 400, false, 'Invalid email format.');

  try {
    const user = await User.findOne({ email });
    
    if (!user) 
      return sendResponse(res, 404, false, 'User not found.');

    if (user.isVerified)
      return sendResponse(res, 400, false, 'Email already verified. Please login.');

    // Generate new OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send new OTP email
    await sendOTPEmail(email, user.username, verificationCode);

    return sendResponse(res, 200, true, 'New verification code sent to your email.');
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to resend OTP.', 'error', err.message);
  }
};

// ================================
// Login User (UPDATED WITH VERIFICATION CHECK)
// ================================
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return sendResponse(res, 400, false, 'Email and password are required.');

  if (!validateEmail(email))
    return sendResponse(res, 400, false, 'Invalid email format.');

  if (!validatePassword(password))
    return sendResponse(res, 400, false, 'Password must be at least 6 characters long.');

  try {
    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, 400, false, 'Incorrect email.');

    if (!user.isVerified)
      return sendResponse(res, 403, false, 'Please verify your account first. Check your email for the verification code.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return sendResponse(res, 400, false, 'Incorrect password.');

    const token = createToken(user);

    return sendResponse(res, 200, true, 'User logged in successfully.', 'user', {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (err) {
    return sendResponse(res, 400, false, 'Login failed.', 'error', err.message);
  }
};

// ================================
// Delete User
// ================================
const deleteUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id))
    return sendResponse(res, 400, false, 'Invalid user ID.');

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return sendResponse(res, 404, false, 'User not found.');

    return sendResponse(res, 200, true, 'User deleted successfully.', 'user', { id });
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to delete user.', 'error', err.message);
  }
};

// ================================
// Update User
// ================================
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id))
    return sendResponse(res, 400, false, 'Invalid user ID.');

  // Authorization: non-admin users may only update their own account
  const isAdmin = req.user && req.user.role === 'admin';
  if (!isAdmin && String(req.user._id) !== id)
    return sendResponse(res, 403, false, 'You are not authorized to update this account.');

  // Only admins can change roles (prevents privilege escalation)
  if (role !== undefined && !isAdmin)
    return sendResponse(res, 403, false, 'Only admins can change user roles.');

  // Validate optional fields
  const updateData = {};
  if (username) {
    if (!validateUsername(username))
      return sendResponse(res, 400, false, 'Username must be 3-30 characters long.');
    updateData.username = username;
  }
  if (email) {
    if (!validateEmail(email))
      return sendResponse(res, 400, false, 'Invalid email format.');
    updateData.email = email;
  }
  if (password) {
    if (!validatePassword(password))
      return sendResponse(res, 400, false, 'Password must be at least 6 characters long.');
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  if (role) {
    const validRoles = ['regular', 'admin'];
    if (!validRoles.includes(role))
      return sendResponse(res, 400, false, 'Invalid role specified.');
    updateData.role = role;
  }

  // Check if at least one field is provided
  if (Object.keys(updateData).length === 0)
    return sendResponse(res, 400, false, 'At least one field (username, email, password, or role) must be provided.');

  try {
    const user = await User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!user) return sendResponse(res, 404, false, 'User not found.');

    return sendResponse(res, 200, true, 'User updated successfully.', 'user', user);
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to update user.', 'error', err.message);
  }
};

// ================================
// Request Password Reset
// ================================
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return sendResponse(res, 400, false, 'Email is required.');

  if (!validateEmail(email))
    return sendResponse(res, 400, false, 'Invalid email format.');

  try {
    const user = await User.findOne({ email });
    
    if (!user) 
      return sendResponse(res, 404, false, 'No account found with this email.');

    if (!user.isVerified)
      return sendResponse(res, 400, false, 'Please verify your account first.');

    // Generate 6-digit OTP for password reset
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.verificationCode = verificationCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, user.username, verificationCode);

    return sendResponse(res, 200, true, 'Password reset code sent to your email.');
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to send reset code.', 'error', err.message);
  }
};

// ================================
// Reset Password with OTP
// ================================
const resetPassword = async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword)
    return sendResponse(res, 400, false, 'Email, code, and new password are required.');

  if (!validateEmail(email))
    return sendResponse(res, 400, false, 'Invalid email format.');

  if (!validateOTP(code))
    return sendResponse(res, 400, false, 'Reset code must be 6 digits.');

  if (!validatePassword(newPassword))
    return sendResponse(res, 400, false, 'Password must be at least 6 characters long.');

  try {
    const user = await User.findOne({ email });
    if (!user) return sendResponse(res, 404, false, 'User not found.');

    // Check if OTP expired
    if (user.otpExpires && user.otpExpires < new Date()) {
      return sendResponse(res, 400, false, 'Reset code has expired. Please request a new one.');
    }

    if (user.verificationCode !== code)
      return sendResponse(res, 400, false, 'Invalid reset code.');

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP fields
    user.password = hashedPassword;
    user.verificationCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    return sendResponse(res, 200, true, 'Password reset successfully! You can now login.');
  } catch (err) {
    return sendResponse(res, 500, false, 'Password reset failed.', 'error', err.message);
  }
};

// ================================
// Resend Password Reset OTP
// ================================
const resendPasswordResetOTP = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return sendResponse(res, 400, false, 'Email is required.');

  if (!validateEmail(email))
    return sendResponse(res, 400, false, 'Invalid email format.');

  try {
    const user = await User.findOne({ email });
    
    if (!user) 
      return sendResponse(res, 404, false, 'User not found.');

    if (!user.isVerified)
      return sendResponse(res, 400, false, 'Please verify your account first.');

    // Generate new OTP
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.otpExpires = otpExpires;
    await user.save();

    // Send new OTP email
    await sendOTPEmail(email, user.username, verificationCode);

    return sendResponse(res, 200, true, 'New reset code sent to your email.');
  } catch (err) {
    return sendResponse(res, 500, false, 'Failed to resend reset code.', 'error', err.message);
  }
};

// ================================
// Export Controllers
// ================================
module.exports = {
  getAllUsers,
  getUserById,
  registerUser,
  loginUser,
  verifyAccount,
  resendOTP,
  requestPasswordReset,
  resetPassword,
  resendPasswordResetOTP,
  deleteUser,
  updateUser,
};