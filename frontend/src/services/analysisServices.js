// src/services/analysisServices.js
import axios from "axios";

const API_URL = "http://localhost:4000/api/analysis";

// Get auth header with token
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

// ================================
// Get Basic Analysis Data (No AI)
// ================================
export const getAnalysisData = async () => {
  try {
    const response = await axios.get(`${API_URL}/data`, getAuthHeader());
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch analysis data",
    };
  }
};

// ================================
// Get AI-Enhanced Analysis
// ================================
export const getAIAnalysis = async () => {
  try {
    const response = await axios.post(`${API_URL}/ai-analysis`, {}, getAuthHeader());
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to generate AI analysis",
    };
  }
};

// ================================
// Generate PDF with Fresh AI Analysis
// ================================
export const generateAnalysisPDF = async () => {
  try {
    const response = await axios.get(`${API_URL}/pdf`, {
      ...getAuthHeader(),
      responseType: 'blob' // Important for file download
    });

    // Create download link for PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hazard-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "PDF downloaded successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to generate PDF",
    };
  }
};

// ================================
// Generate PDF from Saved Analysis (No new AI call)
// ================================
export const generatePDFFromSaved = async (analysisId) => {
  try {
    const response = await axios.get(`${API_URL}/saved/${analysisId}/pdf`, {
      ...getAuthHeader(),
      responseType: 'blob'
    });

    // Create download link for PDF
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `saved-analysis-${analysisId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: "PDF downloaded successfully"
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to generate PDF from saved analysis",
    };
  }
};

// ================================
// Get All Saved Analyses with Pagination and Filtering
// ================================
export const getSavedAnalyses = async (params = {}) => {
  try {
    const { limit = 10, page = 1, analysisType, riskLevel, sortBy, sortOrder } = params;
    
    const response = await axios.get(`${API_URL}/saved`, {
      ...getAuthHeader(),
      params: { 
        limit, 
        page, 
        analysisType, 
        riskLevel, 
        sortBy, 
        sortOrder 
      }
    });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch saved analyses",
    };
  }
};

// ================================
// Get Analysis by ID
// ================================
export const getAnalysisById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/saved/${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to fetch analysis",
    };
  }
};

// ================================
// Get Full Analysis (Legacy - includes AI)
// ================================
export const getFullAnalysis = async () => {
  try {
    const response = await axios.post(`${API_URL}/analyze`, {}, getAuthHeader());
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to generate analysis",
    };
  }
};

// ================================
// Delete Analysis by ID
// ================================
export const deleteAnalysis = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/saved/${id}`, getAuthHeader());
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete analysis",
    };
  }
};