import React, { useState, useEffect } from "react";
import { useReports } from "../hooks/useReports";
import Sidebar from "../components/Sidebar/Sidebar";
import { showToast } from "../components/Toast/Toast";
import styles from "./MyReports.module.css";

function MyReports() {
  const { 
    reports, 
    loading, 
    error, 
    fetchUserReports, 
    updateUserReport, 
    deleteUserReport 
  } = useReports();
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFixedStatus, setFilterFixedStatus] = useState("all");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(4);
  const [editingReport, setEditingReport] = useState(null);
  const [editFormData, setEditFormData] = useState({
    description: "",
    category: "",
    subtype: ""
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || user._id;
      } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const userId = getCurrentUserId();
    if (userId) {
      fetchUserReports(userId);
    }
  }, [fetchUserReports]);

  // Filter reports based on selected filters
  const filteredReports = reports.filter(report => {
    const statusMatch = filterStatus === "all" || report.verifiedStatus === filterStatus;
    const fixedStatusMatch = filterFixedStatus === "all" || 
      (report.fixedStatus ? report.fixedStatus === filterFixedStatus : filterFixedStatus === "not fixed");
    return statusMatch && fixedStatusMatch;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterFixedStatus]);

  // Get current reports for pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified': return styles.statusVerified;
      case 'rejected': return styles.statusRejected;
      default: return styles.statusPending;
    }
  };

  // Get fixed status badge class
  const getFixedStatusBadgeClass = (fixedStatus) => {
    const status = fixedStatus || 'not fixed';
    switch (status) {
      case 'fixed': return styles.fixedStatusFixed;
      case 'in progress': return styles.fixedStatusInProgress;
      default: return styles.fixedStatusNotFixed;
    }
  };

  // Get category badge class
  const getCategoryBadgeClass = (category) => {
    if (!category) return styles.categoryUnknown;
    
    const categoryMap = {
      'natural': styles.categoryNatural,
      'infrastructure': styles.categoryInfrastructure,
      'utility': styles.categoryUtility,
      'human-induced': styles.categoryHumanInduced
    };
    
    return categoryMap[category.toLowerCase()] || styles.categoryUnknown;
  };

  // Handle photo click
  const handlePhotoClick = (photoUrl) => {
    setSelectedPhoto(photoUrl);
  };

  // Close photo modal
  const handleCloseModal = () => {
    setSelectedPhoto(null);
  };

  // Handle modal background click
  const handleModalBackgroundClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  // ==============================
  // UPDATE REPORT FUNCTIONS
  // ==============================

  const handleEditClick = (report) => {
    setEditingReport(report._id);
    setEditFormData({
      description: report.description || "",
      category: report.category || "",
      subtype: report.subtype || ""
    });
  };

  const handleEditCancel = () => {
    setEditingReport(null);
    setEditFormData({
      description: "",
      category: "",
      subtype: ""
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (reportId) => {
    if (!editFormData.description.trim()) {
      showToast("Description is required", "error");
      return;
    }

    const result = await updateUserReport(reportId, editFormData);
    
    if (result.success) {
      setEditingReport(null);
      setEditFormData({
        description: "",
        category: "",
        subtype: ""
      });
      // Refresh the reports list
      const userId = getCurrentUserId();
      if (userId) fetchUserReports(userId);
    } else {
      showToast(result.message || "Failed to update report", "error");
    }
  };

  // ==============================
  // DELETE REPORT FUNCTIONS
  // ==============================

  const handleDeleteClick = (reportId) => {
    setShowDeleteConfirm(reportId);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(null);
  };

  const handleDeleteConfirm = async (reportId) => {
    const result = await deleteUserReport(reportId);
    
    if (result.success) {
      setShowDeleteConfirm(null);
      // Reports list will be automatically updated via state
    } else {
      showToast(result.message || "Failed to delete report", "error");
    }
  };

  // Category options for edit form
  const categoryOptions = [
    { value: 'Natural', label: 'Natural' },
    { value: 'Infrastructure', label: 'Infrastructure' },
    { value: 'Utility', label: 'Utility' },
    { value: 'Human-Induced', label: 'Human Induced' }
  ];

  // Subtype options based on category
  const getSubtypeOptions = (category) => {
    const subtypes = {
      'Natural': ['Flood', 'Typhoon', 'Landslide', 'Earthquake', 'Volcanic Eruption', 'Storm Surge', 'Drought', 'Tsunami'],
      'Infrastructure': ['Pothole', 'Collapsed Building', 'Broken Bridge', 'Damaged Drainage', 'Fallen Tree', 'Fallen Post'],
      'Utility': ['Power Outage', 'Broken Streetlight', 'Water Leak', 'Telecommunication Outage', 'Gas Leak'],
      'Human-Induced': ['Fire Incident', 'Road Accident', 'Chemical Spill', 'Garbage Pileup', 'Vandalism']
    };
    return subtypes[category] || [];
  };

  if (loading) {
    return (
      <div className={styles.appContainer}>
        <div className={styles.bodyContainer}>
          <Sidebar />
          <div className={styles.pageContent}>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading your reports...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.appContainer}>
        <div className={styles.bodyContainer}>
          <Sidebar />
          <div className={styles.pageContent}>
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>⚠️</div>
              <h3>Error Loading Reports</h3>
              <p>{error}</p>
              <button 
                className={styles.retryButton}
                onClick={() => {
                  const userId = getCurrentUserId();
                  if (userId) fetchUserReports(userId);
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.appContainer}>
      <div className={styles.bodyContainer}>
        <Sidebar />
        <div className={styles.pageContent}>
          {/* Header Section */}
          <div className={styles.headerSection}>
            <div className={styles.headerContent}>
              <h1 className={styles.headerTitle}>My Submitted Reports</h1>
              <p className={styles.headerSubtitle}>Track the status of your hazard reports</p>
            </div>
            <div className={styles.headerStats}>
              <div className={styles.totalReports}>
                <span className={styles.totalNumber}>{reports.length}</span>
                <span className={styles.totalLabel}>Total Reports</span>
              </div>
            </div>
          </div>

          {/* Statistics Summary */}
          <div className={styles.statsSummary}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>✅</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>
                  {reports.filter(r => r.verifiedStatus === 'verified').length}
                </div>
                <div className={styles.statLabel}>Verified</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🔧</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>
                  {reports.filter(r => r.fixedStatus === 'fixed').length}
                </div>
                <div className={styles.statLabel}>Fixed</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>
                  {reports.filter(r => !r.verifiedStatus || r.verifiedStatus === 'pending').length}
                </div>
                <div className={styles.statLabel}>Pending</div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className={styles.filtersSection}>
            <div className={styles.filterGroup}>
              <label htmlFor="status-filter" className={styles.filterLabel}>
                📋 Report Status
              </label>
              <select 
                id="status-filter"
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label htmlFor="fixed-status-filter" className={styles.filterLabel}>
                🛠️ Fix Status
              </label>
              <select 
                id="fixed-status-filter"
                value={filterFixedStatus} 
                onChange={(e) => setFilterFixedStatus(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Fix Statuses</option>
                <option value="not fixed">Not Fixed</option>
                <option value="in progress">In Progress</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            <div className={styles.resultsInfo}>
              <span className={styles.resultsCount}>
                📊 Showing {filteredReports.length} of {reports.length} reports
              </span>
              {(filterStatus !== 'all' || filterFixedStatus !== 'all') && (
                <button 
                  onClick={() => {
                    setFilterStatus('all');
                    setFilterFixedStatus('all');
                  }}
                  className={styles.clearFiltersBtn}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Pagination Info */}
          <div className={styles.paginationInfo}>
            <span className={styles.paginationText}>
              Page {currentPage} of {totalPages} • 
              Showing {currentReports.length} reports 
              ({indexOfFirstReport + 1}-{Math.min(indexOfLastReport, filteredReports.length)} of {filteredReports.length})
            </span>
          </div>

          {/* Reports Grid */}
          <div className={styles.reportsGrid}>
            {currentReports.length === 0 ? (
              <div className={styles.noReports}>
                <div className={styles.noReportsIcon}>📝</div>
                <h3>No reports found</h3>
                <p>
                  {reports.length === 0 
                    ? "You haven't submitted any reports yet. Start by reporting a hazard!" 
                    : "No reports match your current filters. Try adjusting your filter criteria."}
                </p>
              </div>
            ) : (
              currentReports.map((report) => (
                <div key={report._id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <div className={styles.reportMeta}>
                      <span className={styles.reportId}>RPT-{report._id.slice(-6).toUpperCase()}</span>
                      <span className={styles.reportDate}>
                        <span className={styles.dateIcon}>📅</span>
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                    <div className={styles.statusBadges}>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(report.verifiedStatus)}`}>
                        {report.verifiedStatus?.charAt(0).toUpperCase() + report.verifiedStatus?.slice(1) || 'Pending'}
                      </span>
                      <span className={`${styles.fixedStatusBadge} ${getFixedStatusBadgeClass(report.fixedStatus)}`}>
                        {(report.fixedStatus || 'not fixed').charAt(0).toUpperCase() + (report.fixedStatus || 'not fixed').slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.reportContent}>
                    <div className={styles.categorySection}>
                      <span className={`${styles.categoryBadge} ${getCategoryBadgeClass(report.category)}`}>
                        {report.category}
                      </span>
                    </div>

                    <div className={styles.reportDescription}>
                      {editingReport === report._id ? (
                        <div className={styles.editForm}>
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Description:</label>
                            <textarea
                              name="description"
                              value={editFormData.description}
                              onChange={handleEditChange}
                              className={styles.formTextarea}
                              rows="3"
                              placeholder="Enter report description..."
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Category:</label>
                            <select
                              name="category"
                              value={editFormData.category}
                              onChange={handleEditChange}
                              className={styles.formSelect}
                            >
                              <option value="">Select Category</option>
                              {categoryOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {editFormData.category && (
                            <div className={styles.formGroup}>
                              <label className={styles.formLabel}>Subtype:</label>
                              <select
                                name="subtype"
                                value={editFormData.subtype}
                                onChange={handleEditChange}
                                className={styles.formSelect}
                              >
                                <option value="">Select Subtype</option>
                                {getSubtypeOptions(editFormData.category).map(subtype => (
                                  <option key={subtype} value={subtype}>
                                    {subtype}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className={styles.editActions}>
                            <button
                              onClick={() => handleEditSubmit(report._id)}
                              className={styles.saveButton}
                            >
                              Save
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className={styles.cancelButton}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p>{report.description}</p>
                          
                          {/* Action Buttons */}
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleEditClick(report)}
                              className={styles.editButton}
                              disabled={report.verifiedStatus === 'verified' || report.verifiedStatus === 'rejected'}
                              title={report.verifiedStatus === 'verified' ? 'Cannot edit verified reports' : 'Edit report'}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(report._id)}
                              className={styles.deleteButton}
                              disabled={report.verifiedStatus === 'verified'}
                              title={report.verifiedStatus === 'verified' ? 'Cannot delete verified reports' : 'Delete report'}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles.reportLocation}>
                      <span className={styles.locationIcon}>📍</span>
                      {report.location.lat.toFixed(4)}, {report.location.lng.toFixed(4)}
                    </div>

                    {report.verifiedBy && (
                      <div className={styles.verifiedBy}>
                        <span className={styles.verifiedIcon}>✅</span>
                        <div>
                          <strong>Verified by:</strong> {report.verifiedBy.username}
                        </div>
                      </div>
                    )}

                    {report.notes && (
                      <div className={styles.adminNotes}>
                        <span className={styles.notesIcon}>💬</span>
                        <div>
                          <strong>Notes:</strong> {report.notes}
                        </div>
                      </div>
                    )}

                    {report.photoUrl && (
                      <div className={styles.reportPhoto}>
                        <div 
                          className={`${styles.photoPlaceholder} ${styles.clickablePhoto}`}
                          onClick={() => handlePhotoClick(report.photoUrl)}
                        >
                          <span className={styles.photoIcon}>📷</span>
                          View Photo
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className={styles.paginationControls}>
              <button 
                onClick={prevPage}
                disabled={currentPage === 1}
                className={`${styles.paginationButton} ${styles.paginationPrev} ${currentPage === 1 ? styles.disabled : ''}`}
              >
                ← Previous
              </button>

              <div className={styles.paginationNumbers}>
                {getPageNumbers().map(number => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`${styles.paginationButton} ${styles.pageNumber} ${currentPage === number ? styles.active : ''}`}
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button 
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className={`${styles.paginationButton} ${styles.paginationNext} ${currentPage === totalPages ? styles.disabled : ''}`}
              >
                Next →
              </button>
            </div>
          )}

          {/* Photo Modal */}
          {selectedPhoto && (
            <div 
              className={styles.photoModalOverlay} 
              onClick={handleModalBackgroundClick}
            >
              <div className={styles.photoModal}>
                <div className={styles.photoModalHeader}>
                  <h3>📷 Report Photo</h3>
                  <button 
                    className={styles.closeButton}
                    onClick={handleCloseModal}
                  >
                    ×
                  </button>
                </div>
                <div className={styles.photoModalContent}>
                  <img 
                    src={`http://localhost:4000${selectedPhoto}`} 
                    alt="Report evidence" 
                    className={styles.photoFullsize}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div 
              className={styles.photoModalOverlay} 
              onClick={handleModalBackgroundClick}
            >
              <div className={styles.deleteModal}>
                <div className={styles.photoModalHeader}>
                  <h3>🗑️ Delete Report</h3>
                  <button 
                    className={styles.closeButton}
                    onClick={handleDeleteCancel}
                  >
                    ×
                  </button>
                </div>
                <div className={styles.deleteModalContent}>
                  <p>Are you sure you want to delete this report? This action cannot be undone.</p>
                  <div className={styles.deleteActions}>
                    <button
                      onClick={() => handleDeleteConfirm(showDeleteConfirm)}
                      className={styles.confirmDeleteButton}
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={handleDeleteCancel}
                      className={styles.cancelDeleteButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyReports;