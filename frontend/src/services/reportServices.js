import axios from "axios";

const API_URL = "http://localhost:4000/api/reports/";


// ----------------------
// Get reports for map display
// Shows reports not fixed or fixed within the last 24 hours
// ----------------------
export const getReportsForMap = async (token) => {
  try {
    const response = await axios.get(`${API_URL}map`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
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
export const getAllReports = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return { success: false, message: "Failed to retrieve reports." };
  }
};

// ----------------------
// Get reports by user ID
// ----------------------
export const getReportByUserId = async (userId, token) => {
  try {
    const response = await axios.get(`${API_URL}user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return { success: false, message: "Failed to retrieve user reports." };
  }
};

// ----------------------
// Get user report count
// ----------------------
export const getUserReportCount = async (userId, token) => {
  try {
    const response = await axios.get(`${API_URL}user/count/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
export const createReport = async (reportData, token) => {
  try {
    console.log("📤 Sending report data:", reportData);

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

    // Debug log to verify FormData content
    for (let [key, value] of formData.entries()) {
      console.log(`🧾 FormData -> ${key}:`, value);
    }

    // Send POST request (handles both new + merged reports)
    const response = await axios.post(API_URL, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("✅ Report API response:", response.data);
    return response.data; // { success, message, report }

  } catch (error) {
    console.error("❌ Error creating/merging report:", error);
    console.error("Server Response:", error.response?.data);

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
export const verifyReport = async (reportId, token) => {
  try {
    const response = await axios.patch(
      `${API_URL}verify/${reportId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error verifying report:", error);
    return { success: false, message: "Failed to verify report." };
  }
};

// ----------------------
// Reject Report (Admin)
// ----------------------
export const rejectReport = async (reportId, token) => {
  try {
    const response = await axios.patch(
      `${API_URL}reject/${reportId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting report:", error);
    return { success: false, message: "Failed to reject report." };
  }
};

// ----------------------
// Update Report
// ----------------------
export const updateReport = async (reportId, updateData, token) => {
  try {
    const response = await axios.patch(
      `${API_URL}update/${reportId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
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
export const deleteReport = async (reportId, token) => {
  try {
    const response = await axios.delete(
      `${API_URL}delete/${reportId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting report:", error);
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete report.",
    };
  }
};