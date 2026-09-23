// src/services/analysisServices.js
import apiClient from "./apiClient";

const API_URL = "http://localhost:4000/api/analysis";

// ================================
// Get Basic Analysis Data (No AI)
// ================================
export const getAnalysisData = async () => {
  try {
    const response = await apiClient.get(`${API_URL}/data`);
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
    const response = await apiClient.post(`${API_URL}/ai-analysis`);
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
    const response = await apiClient.get(`${API_URL}/pdf`, {
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
    const response = await apiClient.get(`${API_URL}/saved/${analysisId}/pdf`, {
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

    const response = await apiClient.get(`${API_URL}/saved`, {
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
    const response = await apiClient.get(`${API_URL}/saved/${id}`);
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
    const response = await apiClient.post(`${API_URL}/analyze`);
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
    const response = await apiClient.delete(`${API_URL}/saved/${id}`);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Failed to delete analysis",
    };
  }
};