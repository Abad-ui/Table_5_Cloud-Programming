// src/hooks/useReports.js
import { useState, useCallback, useEffect } from 'react';
import { 
  getAllReports, 
  getReportByUserId, 
  getUserReportCount,
  createReport, 
  verifyReport, 
  rejectReport,
  updateReport,
  deleteReport,
  getReportsForMap // <-- added
} from '../services/reportServices';
import { getAllHazards } from '../services/hazardServices';

export const useReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ==============================
  // Fetch reports for map
  // ==============================
  const fetchReportsForMap = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const reportsResult = await getReportsForMap();
      const hazardsResult = await getAllHazards();

      if (reportsResult.success && hazardsResult.success) {
        // Map hazardId by reportId
        const hazardMap = {};
        hazardsResult.hazards.forEach(hazard => {
          if (hazard.reportId) hazardMap[hazard.reportId] = hazard._id;
        });

        const reportsWithHazardId = (reportsResult.reports || []).map(report => ({
          ...report,
          hazardId: hazardMap[report._id] || null,
        }));

        setReports(reportsWithHazardId);
      } else {
        setError('Failed to fetch reports or hazards for map');
      }
    } catch (err) {
      console.error('Error in fetchReportsForMap:', err);
      setError('An error occurred while fetching reports for map');
    } finally {
      setLoading(false);
    }
  }, []);


  // ==============================
  // Fetch all reports
  // ==============================
  const fetchAllReports = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const reportsResult = await getAllReports();
    const hazardsResult = await getAllHazards();

    if (reportsResult.success && hazardsResult.success) {
      // Build a map of hazard IDs by reportId._id
      const hazardMap = {};

      hazardsResult.hazards.forEach(hazard => {
        if (hazard.reportId && hazard.reportId._id) {
          // direct mapping
          hazardMap[hazard.reportId._id] = hazard._id;
        }

        // map merged users if exists
        if (hazard.mergedUsers && Array.isArray(hazard.mergedUsers)) {
          hazard.mergedUsers.forEach(userId => {
            if (userId) hazardMap[userId] = hazard._id;
          });
        }
      });

      // Map hazards to reports
      const reportsWithHazardId = (reportsResult.reports || []).map(report => {
        let hazardId = hazardMap[report._id] || null;

        // fallback: check mergedUsers
        if (!hazardId && report.mergedUsers && Array.isArray(report.mergedUsers)) {
          for (let u of report.mergedUsers) {
            if (u.$oid && hazardMap[u.$oid]) {
              hazardId = hazardMap[u.$oid];
              break;
            }
          }
        }

        return {
          ...report,
          hazardId
        };
      });

      setReports(reportsWithHazardId);
    } else {
      setError('Failed to fetch reports or hazards');
    }
  } catch (err) {
    console.error('Error in fetchAllReports:', err);
    setError('An error occurred while fetching reports');
  } finally {
    setLoading(false);
  }
}, []);


  // ==============================
  // Create or Merge Report
  // ==============================
  const addReport = async (reportData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createReport(reportData);

      if (result.success) {
        // If the backend merged with an existing report
        if (result.message?.includes('merged')) {
          console.log('Report merged - updating existing report in state');

          setReports(prev =>
            prev.map(r =>
              r._id === result.report._id ? { ...r, ...result.report } : r
            )
          );
        } else {
          // New report created - prepend it
          console.log('New report created - adding to state');
          setReports(prev => [result.report, ...prev]);
        }

        return { success: true, message: result.message, report: result.report };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const errorMsg = 'An error occurred while creating or merging report';
      console.error('Error in addReport:', err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Fetch reports by user ID
  // ==============================
  const fetchUserReports = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getReportByUserId(userId);

      if (result.success) {
        setReports(result.reports || []);
        return { success: true, reports: result.reports };
      } else {
        setError(result.message || 'Failed to fetch user reports');
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error('Error in fetchUserReports:', err);
      setError('An error occurred while fetching user reports');
      return { success: false, message: 'An error occurred while fetching user reports' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==============================
  // Get user report count
  // ==============================
  const fetchUserReportCount = useCallback(async (userId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserReportCount(userId);
      return result.success
        ? { success: true, count: result.reportCount }
        : { success: false, message: result.message };
    } catch (err) {
      console.error('Error in fetchUserReportCount:', err);
      return { success: false, message: 'Failed to fetch report count' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ==============================
  // Verify Report (Admin)
  // ==============================
  const verifyUserReport = async (reportId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await verifyReport(reportId);
      if (result.success) {
        setReports(prev =>
          prev.map(report =>
            report._id === reportId
              ? { ...report, verifiedStatus: result.report?.verifiedStatus || 'verified' }
              : report
          )
        );
      }
      return result;
    } catch (err) {
      console.error('Error verifying report:', err);
      return { success: false, message: 'Failed to verify report' };
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Reject Report (Admin)
  // ==============================
  const rejectUserReport = async (reportId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await rejectReport(reportId);
      if (result.success) {
        setReports(prev =>
          prev.map(report =>
            report._id === reportId
              ? { ...report, verifiedStatus: result.report?.verifiedStatus || 'rejected' }
              : report
          )
        );
      }
      return result;
    } catch (err) {
      console.error('Error rejecting report:', err);
      return { success: false, message: 'Failed to reject report' };
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Update Report
  // ==============================
  const updateUserReport = async (reportId, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateReport(reportId, updateData);

      if (result.success) {
        // Update the report in state
        setReports(prev =>
          prev.map(report =>
            report._id === reportId
              ? { ...report, ...result.report }
              : report
          )
        );
        return { success: true, message: result.message, report: result.report };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const errorMsg = 'An error occurred while updating the report';
      console.error('Error in updateUserReport:', err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Delete Report (Soft Delete)
  // ==============================
  const deleteUserReport = async (reportId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteReport(reportId);

      if (result.success) {
        // Remove the report from state (or mark as deleted)
        setReports(prev =>
          prev.filter(report => report._id !== reportId)
        );
        return { success: true, message: result.message };
      } else {
        setError(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting the report';
      console.error('Error in deleteUserReport:', err);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // Utilities
  // ==============================
  const refreshReports = useCallback(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    reports,
    loading,
    error,
    fetchReportsForMap,
    fetchAllReports,
    fetchUserReports,
    fetchUserReportCount,
    addReport,
    verifyUserReport,
    rejectUserReport,
    updateUserReport,
    deleteUserReport,
    refreshReports,
    clearError,
  };
};