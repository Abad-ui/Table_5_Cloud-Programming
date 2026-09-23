import axios from "axios";

const API_URL = "http://localhost:4000/api/dashboard/";

// ================================
// Get Dashboard Statistics (users, verified, pending, resolved)
// ================================
export const getDashboardStats = async (token) => {
  try {
    const response = await axios.get(`${API_URL}stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data; // { success, message, stats }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, message: "Failed to retrieve dashboard stats." };
  }
};

// ================================
// Get Report Type Distribution
// ================================
export const getReportTypeDistribution = async (token) => {
  try {
    const response = await axios.get(`${API_URL}type-distribution`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data; // { success, message, distribution }
  } catch (error) {
    console.error("Error fetching report type distribution:", error);
    return { success: false, message: "Failed to retrieve report type distribution." };
  }
};

// ================================
// Get Report Trends Over Time
// ================================
export const getReportTrends = async (token) => {
  try {
    const response = await axios.get(`${API_URL}trends`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data; // { success, message, trends }
  } catch (error) {
    console.error("Error fetching report trends:", error);
    return { success: false, message: "Failed to retrieve report trends." };
  }
};

// ================================
// Get Most Reported Hazard Subtypes
// ================================
export const getMostReportedHazards = async (token) => {
  try {
    const response = await axios.get(`${API_URL}most-reported`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data; // { success, message, mostReported }
  } catch (error) {
    console.error("Error fetching most reported hazards:", error);
    return { success: false, message: "Failed to retrieve most reported hazards." };
  }
};
