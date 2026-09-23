// src/services/hazardService.js
import axios from "axios";

const API_URL = "http://localhost:4000/api/hazards/";

// Get all hazards (requires token)
export const getAllHazards = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data; // { success, message, hazards }
  } catch (error) {
    console.error("Error fetching hazards:", error);
    return { success: false, message: "Failed to retrieve hazards." };
  }
};

// Update hazard's fixed status
export const updateHazardFixedStatus = async (hazardId, newStatus, token) => {
  try {
    const response = await axios.patch(
      `${API_URL}status/${hazardId}`,
      { fixedStatus: newStatus },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
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
export const getHazardsForMap = async (token) => {
  try {
    const response = await axios.get(`${API_URL}map`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data; // { success, message, hazards }
  } catch (error) {
    console.error("Error fetching hazards for map:", error);
    return { success: false, message: "Failed to retrieve hazards for map." };
  }
};


//
/*export const createHazard = async (hazardData, token) => {
  try {
    const response = await axios.post(API_URL, hazardData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data; // { success, message, hazard }
  } catch (error) {
    console.error("Error creating hazard:", error);
    return { success: false, message: "Failed to create hazard." };
  }
};*/
