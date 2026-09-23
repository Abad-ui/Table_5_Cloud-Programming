import apiClient from "./apiClient";

const API_URL = "http://localhost:4000/api/reports/";

// ----------------------
// Get reports for map display
// Shows reports not fixed or fixed within the last 24 hours
// ----------------------
export const getReportsForMap = async () => {
  try {
    const response = await apiClient.get(`${API_URL}map`);
    return response.data; // { success, message, reports }
  } catch (error) {
    console.error("Error fetching reports for map:", error);
    return {
      success: false,
      message: "Failed to retrieve reports for map.",
    };
  }
};

// ----------------------
// Get all reports
// ----------------------
export const getAllReports = async () => {
  try {
    const response = await apiClient.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { success: false, message: "Failed to retrieve reports." };
  }
};

// ----------------------
// Get reports by user ID
// ----------------------
export const getReportByUserId = async (userId) => {
  try {
    const response = await apiClient.get(`${API_URL}user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return { success: false, message: "Failed to retrieve user reports." };
  }
};

// ----------------------
// Get user report count
// ----------------------
export const getUserReportCount = async (userId) => {
  try {
    const response = await apiClient.get(`${API_URL}user/count/${userId}`);
    return response.data;
  } catch (err) {
    return {
      success: false,
      message:
        err.response?.data?.message || "Failed to fetch user report count",
    };
  }
};

// ----------------------
// Create or Merge Report
// ----------------------
export const createReport = async (reportData) => {
  try {
    const formData = new FormData();

    // Append basic fields
    formData.append("category", reportData.category);
    formData.append("subtype", reportData.subtype);
    formData.append("description", reportData.description);

    // Append location values separately
    if (reportData.location) {
      const { lat, lng } = reportData.location;
      formData.append("lat", lat.toString());
      formData.append("lng", lng.toString());
    }

    // Append photo (if provided)
    if (reportData.photo) {
      formData.append("photo", reportData.photo);
    }

    // Send POST request (handles both new + merged reports)
    const response = await apiClient.post(API_URL, formData);

    return response.data; // { success, message, report }
  } catch (error) {
    console.error("Error creating/merging report:", error);
    return {
      success: false,
      message:
        error.response?.data?.message ||
        "Failed to create or merge report. Please try again.",
    };
  }
};

// ----------------------
// Verify Report (Admin)
// ----------------------
export const verifyReport = async (reportId) => {
  try {
    const response = await apiClient.patch(`${API_URL}verify/${reportId}`);
    return response.data;
  } catch (error) {
    console.error("Error verifying report:", error);
    return { success: false, message: "Failed to verify report." };
  }
};

// ----------------------
// Reject Report (Admin)
// ----------------------
export const rejectReport = async (reportId) => {
  try {
    const response = await apiClient.patch(`${API_URL}reject/${reportId}`);
    return response.data;
  } catch (error) {
    console.error("Error rejecting report:", error);
    return { success: false, message: "Failed to reject report." };
  }
};

// ----------------------
// Update Report
// ----------------------
export const updateReport = async (reportId, updateData) => {
  try {
    const response = await apiClient.patch(`${API_URL}update/${reportId}`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating report:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to update report.",
    };
  }
};

// ----------------------
// Delete Report (Soft Delete)
// ----------------------
export const deleteReport = async (reportId) => {
  try {
    const response = await apiClient.delete(`${API_URL}delete/${reportId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting report:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete report.",
    };
  }
};