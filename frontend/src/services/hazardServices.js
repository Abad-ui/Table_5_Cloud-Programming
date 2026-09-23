// src/services/hazardServices.js
import apiClient from "./apiClient";

const API_URL = "http://localhost:4000/api/hazards/";

// Get all hazards (requires session cookie)
export const getAllHazards = async () => {
  try {
    const response = await apiClient.get(API_URL);
    return response.data; // { success, message, hazards }
  } catch (error) {
    console.error("Error fetching hazards:", error);
    return { success: false, message: "Failed to retrieve hazards." };
  }
};

// Update hazard's fixed status
export const updateHazardFixedStatus = async (hazardId, newStatus) => {
  try {
    const response = await apiClient.patch(
      `${API_URL}status/${hazardId}`,
      { fixedStatus: newStatus }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating hazard fixed status:", error);
    return { success: false, message: "Failed to update hazard fixed status." };
  }
};

// ================================
// Get Hazards for Map Display
// Endpoint: api_url/map
// ================================
export const getHazardsForMap = async () => {
  try {
    const response = await apiClient.get(`${API_URL}map`);
    return response.data; // { success, message, hazards }
  } catch (error) {
    console.error("Error fetching hazards for map:", error);
    return { success: false, message: "Failed to retrieve hazards for map." };
  }
};