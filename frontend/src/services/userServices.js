// src/services/userServices.js
import axios from "axios";

const API_URL = "http://localhost:4000/api/users";

// ================================
// Login User
// ================================
export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });

    if (response.data.success) {
      localStorage.setItem("token", response.data.user.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Login failed",
    };
  }
};

// ================================
// Register User
// ================================
export const registerUser = async (username, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/register`, { username, email, password });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

// ================================
// Verify OTP
// ================================
export const verifyOTP = async (email, code) => {
  try {
    const response = await axios.post(`${API_URL}/verify`, { email, code });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Verification failed",
    };
  }
};

// ================================
// Resend OTP
// ================================
export const resendOTP = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/resend-otp`, { email });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to resend OTP",
    };
  }
};

// ================================
// Logout User
// ================================
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

// ================================
// Get All Users (Admin)
// ================================
export const getAllUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch users",
    };
  }
};

// ================================
// Get User by ID
// ================================
export const getUserById = async (id) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch user",
    };
  }
};

// ================================
// Delete User
// ================================
export const deleteUser = async (id) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete user",
    };
  }
};

// ================================
// Update User
// ================================
export const updateUser = async (id, updateData) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.patch(`${API_URL}/${id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update user",
    };
  }
};

// ================================
// Request Password Reset
// ================================
export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/forgot-password`, { email });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to send reset code",
    };
  }
};

// ================================
// Reset Password (with OTP and new password)
// ================================
export const resetPassword = async (email, code, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/reset-password`, { 
      email, 
      code, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to reset password",
    };
  }
};

// ================================
// Resend Password Reset OTP
// ================================
export const resendPasswordResetOTP = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/resend-reset-otp`, { email });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to resend reset code",
    };
  }
};