import apiClient from "./apiClient";

const API_URL = "http://localhost:4000/api/dashboard/";

// ================================
// Get Dashboard Statistics (users, verified, pending, resolved)
// ================================
export const getDashboardStats = async () => {
  try {
    const response = await apiClient.get(`${API_URL}stats`);
    return response.data; // { success, message, stats }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, message: "Failed to retrieve dashboard stats." };
  }
};

// ================================
// Get Report Type Distribution
// ================================
export const getReportTypeDistribution = async () => {
  try {
    const response = await apiClient.get(`${API_URL}type-distribution`);
    return response.data; // { success, message, distribution }
  } catch (error) {
    console.error("Error fetching report type distribution:", error);
    return { success: false, message: "Failed to retrieve report type distribution." };
  }
};

// ================================
// Get Report Trends Over Time
// ================================
export const getReportTrends = async () => {
  try {
    const response = await apiClient.get(`${API_URL}trends`);
    return response.data; // { success, message, trends }
  } catch (error) {
    console.error("Error fetching report trends:", error);
    return { success: false, message: "Failed to retrieve report trends." };
  }
};

// ================================
// Get Most Reported Hazard Subtypes
// ================================
export const getMostReportedHazards = async () => {
  try {
    const response = await apiClient.get(`${API_URL}most-reported`);
    return response.data; // { success, message, mostReported }
  } catch (error) {
    console.error("Error fetching most reported hazards:", error);
    return { success: false, message: "Failed to retrieve most reported hazards." };
  }
};