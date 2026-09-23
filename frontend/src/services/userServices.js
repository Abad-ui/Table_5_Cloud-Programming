// src/services/userServices.js
import apiClient from "./apiClient";

const API_URL = "http://localhost:4000/api/users";

// ================================
// Login User
// Sets an HttpOnly cookie on the server; only user metadata is stored client-side.
// ================================
export const loginUser = async (email, password) => {
  try {
    const response = await apiClient.post(`${API_URL}/login`, { email, password });

    if (response.data.success && response.data.user) {
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
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
    const response = await apiClient.post(`${API_URL}/register`, { username, email, password });
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
    const response = await apiClient.post(`${API_URL}/verify`, { email, code });
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
    const response = await apiClient.post(`${API_URL}/resend-otp`, { email });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to resend OTP",
    };
  }
};

// ================================
// Logout User (clears the HttpOnly cookie server-side)
// ================================
export const logoutUser = async () => {
  try {
    await apiClient.post(`${API_URL}/logout`);
  } catch (error) {
    // Ignore - clear local state regardless
  } finally {
    sessionStorage.removeItem("user");
  }
};

// ================================
// Get Current User (validates the session cookie)
// ================================
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/me`);

    if (response.data.success && response.data.user) {
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error) {
    // Invalid/expired session - clear stored user metadata
    if (error.response?.status === 401) {
      sessionStorage.removeItem("user");
    }
    return {
      success: false,
      message: error.response?.data?.message || "Not authenticated",
    };
  }
};

// ================================
// Get All Users (Admin)
// ================================
export const getAllUsers = async () => {
  try {
    const response = await apiClient.get(API_URL);
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
    const response = await apiClient.get(`${API_URL}/${id}`);
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
    const response = await apiClient.delete(`${API_URL}/${id}`);
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
    const response = await apiClient.patch(`${API_URL}/${id}`, updateData);
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
    const response = await apiClient.post(`${API_URL}/forgot-password`, { email });
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
    const response = await apiClient.post(`${API_URL}/reset-password`, {
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
    const response = await apiClient.post(`${API_URL}/resend-reset-otp`, { email });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to resend reset code",
    };
  }
};