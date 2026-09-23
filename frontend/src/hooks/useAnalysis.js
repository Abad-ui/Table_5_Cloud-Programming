// src/hooks/useAnalysis.js
import { useState, useEffect } from 'react';
import { 
  getAnalysisData, 
  getAIAnalysis, 
  generateAnalysisPDF,
  generatePDFFromSaved,
  getSavedAnalyses,
  getAnalysisById,
  getFullAnalysis 
} from '../services/analysisServices';

export const useAnalysis = () => {
  const [analysis, setAnalysis] = useState(null);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [showHistory, setShowHistory] = useState(false);

  // Load basic analysis data
  const loadAnalysisData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAnalysisData();
      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  // Generate AI-enhanced analysis
  const generateAIAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAIAnalysis();
      if (result.success) {
        setAnalysis(result.analysis);
        // Refresh history after generating new analysis
        await loadSavedAnalyses();
        return { success: true, data: result.analysis, analysisId: result.analysis.savedAnalysisId };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMsg = 'Failed to generate AI analysis';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF report with fresh AI analysis
  const generatePDFReport = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generateAnalysisPDF();
      if (!result.success) {
        setError(result.message);
        return { success: false, error: result.message };
      }
      return { success: true };
    } catch (err) {
      const errorMsg = 'Failed to generate PDF report';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF from saved analysis (no new AI call)
  const generatePDFFromSavedAnalysis = async (analysisId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await generatePDFFromSaved(analysisId);
      if (!result.success) {
        setError(result.message);
        return { success: false, error: result.message };
      }
      return { success: true };
    } catch (err) {
      const errorMsg = 'Failed to generate PDF from saved analysis';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Load saved analyses with pagination and filtering
  const loadSavedAnalyses = async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSavedAnalyses(params);
      if (result.success) {
        setSavedAnalyses(result.data.analyses);
        setPagination(result.data.pagination);
        return { success: true, filters: result.data.filters };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMsg = 'Failed to load saved analyses';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Load specific analysis by ID
  const loadAnalysisById = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getAnalysisById(id);
      if (result.success) {
        setSelectedAnalysis(result.data);
        return { success: true, data: result.data };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMsg = 'Failed to load analysis';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Legacy full analysis (everything in one call)
  const generateFullAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getFullAnalysis();
      if (result.success) {
        setAnalysis(result.analysis);
        await loadSavedAnalyses();
        return { success: true, data: result.analysis };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMsg = 'Failed to generate full analysis';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // View a specific historical analysis
  const viewHistoricalAnalysis = async (analysisId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAnalysisById(analysisId);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        setError(result.message);
        return { success: false, error: result.message };
      }
    } catch (err) {
      const errorMsg = 'Failed to load historical analysis';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };


  // Toggle history view
  const toggleHistory = async (params = {}) => {
    if (!showHistory) {
      await loadSavedAnalyses(params);
    }
    setShowHistory(!showHistory);
  };

  // Clear selected analysis
  const clearSelectedAnalysis = () => {
    setSelectedAnalysis(null);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Refresh analysis data
  const refreshAnalysis = () => {
    setShowHistory(false);
    loadAnalysisData();
  };

  // Load analysis data on initial mount
  useEffect(() => {
    loadAnalysisData();
  }, []);

  return {
    // State
    analysis,
    savedAnalyses,
    selectedAnalysis,
    loading,
    error,
    pagination,
    showHistory,
    
    // Actions
    loadAnalysisData,
    generateAIAnalysis,
    generatePDFReport,
    generatePDFFromSavedAnalysis,
    generateFullAnalysis,
    loadSavedAnalyses,
    loadAnalysisById,
    viewHistoricalAnalysis,
    toggleHistory,
    clearSelectedAnalysis,
    clearError,
    refreshAnalysis,
    
    // Convenience getters
    hasAnalysis: !!analysis,
    hasSavedAnalyses: savedAnalyses.length > 0,
    riskLevel: analysis?.structured?.match(/RISK ASSESSMENT: ([A-Z]+)/)?.[1] || 
               analysis?.riskLevel || 
               'UNKNOWN',
    topBarangays: analysis?.mostReportedBarangays?.slice(0, 3) || [],
    topHazards: analysis?.reportTypeDistribution?.slice(0, 3) || [],
    stats: analysis?.dashboardStats || {},
    
    // Analysis type info
    isAIAnalysis: analysis?.aiInsights && analysis.aiInsights !== "AI analysis unavailable due to API error.",
    hasStructuredReport: !!analysis?.structured,
    analysisDate: analysis?.generatedAt ? new Date(analysis.generatedAt) : new Date()
  };
};