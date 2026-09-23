import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import styles from "./AdminManageReports.module.css";
import { useReports } from "../../hooks/useReports";
import { useHazards } from "../../hooks/useHazards";
import { showToast } from "../../components/Toast/Toast";

function AdminManageReports() {
  const { 
    reports, 
    loading, 
    error, 
    fetchAllReports, 
    verifyUserReport, 
    rejectUserReport,
    refreshReports 
  } = useReports();

  const { updateFixedStatus } = useHazards();
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(4);

  // Fetch reports on component mount
  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const filteredReports = reports.filter(report => {
    if (filterStatus === "all") return true;
    if (filterStatus === "pending") return report.verifiedStatus === "pending";
    if (filterStatus === "verified") return report.verifiedStatus === "verified";
    if (filterStatus === "rejected") return report.verifiedStatus === "rejected";
    return true;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

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

  const handleActionClick = (report, action) => {
    setSelectedReport(report);
    setModalAction(action);
    
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedReport) return;

    setActionLoading(true);

    try {
      let result;

      if (modalAction === "verify") {
        result = await verifyUserReport(selectedReport._id);
        console.log('Verify result:', result);
      } else if (modalAction === "reject") {
        result = await rejectUserReport(selectedReport._id);
        console.log('Reject result:', result);
      } else if (modalAction === "mark-fixed") {
        if (!selectedReport.hazardId) {
          console.error('No hazardId found for this report');
          showToast('Cannot update status: No hazard ID associated with this report', "error");
          return;
        }
        result = await updateFixedStatus(selectedReport.hazardId, "fixed");
        console.log('Mark fixed result:', result);
        if (result.success) {
          refreshReports();
        }
      } else if (modalAction === "mark-in-progress") {
        if (!selectedReport.hazardId) {
          console.error('No hazardId found for this report');
          showToast('Cannot update status: No hazard ID associated with this report', "error");
          return;
        }
        result = await updateFixedStatus(selectedReport.hazardId, "in progress");
        console.log('Mark in progress result:', result);
        if (result.success) {
          refreshReports();
        }
      }

      if (result && !result.success) {
        console.error("Action failed:", result.message);
        showToast(`Action failed: ${result.message}`, "error");
      } else if (result && result.success) {
        console.log("Action successful:", result.message);
        refreshReports();
      }

    } catch (err) {
      console.error("Error performing action:", err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
      setShowModal(false);
      setSelectedReport(null);
    }
  };

  const handleImageClick = (photoUrl) => {
    setSelectedImage(photoUrl);
    setShowImageModal(true);
  };

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null;
    
    if (photoUrl.startsWith('http')) {
      return photoUrl;
    }
    
    const baseUrl = 'http://localhost:4000';
    const cleanPath = photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl;
    
    return `${baseUrl}/${cleanPath}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'verified': return styles.statusVerified;
      case 'under review': return styles.statusUnderReview;
      case 'rejected': return styles.statusRejected;
      default: return styles.statusPending;
    }
  };

  const getFixedStatusBadgeClass = (fixedStatus) => {
    const status = fixedStatus || 'not fixed';
    switch (status) {
      case 'fixed': return styles.fixedStatusFixed;
      case 'in progress': return styles.fixedStatusInProgress;
      default: return styles.fixedStatusNotFixed;
    }
  };

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

  const getActionButtons = (report) => {
    if (report.fixedStatus === "fixed") {
      return (
        <div className={styles.actionButtons}>
          <button 
            className={styles.disabledBtn}
            disabled={true}
          >
            ✅ Report Fixed
          </button>
        </div>
      );
    }

    if (report.verifiedStatus === "rejected") {
      return (
        <div className={styles.actionButtons}>
          <button 
            className={styles.disabledBtn}
            disabled={true}
          >
            ❌ Report Rejected
          </button>
        </div>
      );
    }

    if (report.verifiedStatus === "pending") {
      return (
        <div className={styles.actionButtons}>
          <button 
            className={styles.verifyBtn}
            onClick={() => handleActionClick(report, "verify")}
            disabled={actionLoading}
          >
            Accept
          </button>
          <button 
            className={styles.rejectBtn}
            onClick={() => handleActionClick(report, "reject")}
            disabled={actionLoading}
          >
            Reject
          </button>
        </div>
      );
    } else if (report.verifiedStatus === "verified") {
      return (
        <div className={styles.actionButtons}>
          <button 
            className={styles.inProgressBtn}
            onClick={() => handleActionClick(report, "mark-in-progress")}
            disabled={report.fixedStatus === "in progress" || actionLoading}
          >
            Mark In Progress
          </button>
          <button 
            className={styles.fixedBtn}
            onClick={() => handleActionClick(report, "mark-fixed")}
            disabled={report.fixedStatus === "fixed" || actionLoading}
          >
            Mark Fixed
          </button>
        </div>
      );
    }
    return null;
  };

  // Statistics for the header
  const stats = {
    total: reports.length,
    pending: reports.filter(r => !r.verifiedStatus || r.verifiedStatus === 'pending').length,
    verified: reports.filter(r => r.verifiedStatus === 'verified').length,
    fixed: reports.filter(r => r.fixedStatus === 'fixed').length
  };

  if (loading) {
    return (
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <div className={styles.adminMainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <div className={styles.adminMainContent}>
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3>Error Loading Reports</h3>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={fetchAllReports}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminLayout}>
      <AdminSidebar />
      <div className={styles.adminMainContent}>
        {/* Header Section */}
        <div className={styles.adminHeader}>
          <h1>Manage Reports</h1>
          <p>Review and manage hazard reports submitted by users</p>
        </div>

        {/* Statistics Summary */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>📊</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Total Reports</div>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statDescription}>All submitted reports</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>⏳</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Pending Review</div>
              <div className={styles.statValue}>{stats.pending}</div>
              <div className={styles.statDescription}>Awaiting verification</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>✅</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Verified</div>
              <div className={styles.statValue}>{stats.verified}</div>
              <div className={styles.statDescription}>Approved reports</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>🔧</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Fixed</div>
              <div className={styles.statValue}>{stats.fixed}</div>
              <div className={styles.statDescription}>Resolved issues</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <label htmlFor="status-filter" className={styles.filterLabel}>
              📋 Filter by Status
            </label>
            <select 
              id="status-filter"
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Reports</option>
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className={styles.resultsInfo}>
            <span className={styles.resultsCount}>
              📊 Showing {filteredReports.length} of {reports.length} reports
            </span>
            {/*{filterStatus !== 'all' && (
              <button 
                onClick={() => setFilterStatus('all')}
                className={styles.clearFiltersBtn}
              >
                Clear Filters
              </button>
            )}*/}
          </div>

          <button 
            className={styles.refreshButton}
            onClick={fetchAllReports}
            disabled={loading}
          >
            Refresh
          </button>
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
              <p>No reports match your current filters.</p>
            </div>
          ) : (
            currentReports.map((report) => {
              const imageUrl = getImageUrl(report.photoUrl);
              
              return (
                <div key={report._id} className={styles.reportCard}>
                  <div className={styles.reportHeader}>
                    <div className={styles.reportMeta}>
                      <span className={styles.reportId}>RPT-{report._id.slice(-6).toUpperCase()}</span>
                      <span className={styles.reportDate}>{formatDate(report.createdAt)}</span>
                      <span className={styles.username}>by {report.user?.username || `User ${report.user?._id?.slice(-6)}`}</span>
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
                      <span className={styles.subtype}>{report.subtype}</span>
                    </div>

                    <div className={styles.reportDescription}>
                      <p>{report.description}</p>
                    </div>

                    <div className={styles.reportLocation}>
                      <span className={styles.locationIcon}>📍</span>
                      {report.location?.lat?.toFixed(4)}, {report.location?.lng?.toFixed(4)}
                    </div>

                    {report.verifiedBy && (
                      <div className={styles.verifiedBy}>
                        <strong>Verified by:</strong> {report.verifiedBy}
                      </div>
                    )}

                    {report.notes && (
                      <div className={styles.adminNotes}>
                        <strong>Admin Notes:</strong> {report.notes}
                      </div>
                    )}

                    {imageUrl && (
                      <div className={styles.reportPhoto}>
                        <div 
                          className={styles.photoPreview}
                          onClick={() => handleImageClick(imageUrl)}
                        >
                          <img 
                            src={imageUrl} 
                            alt={`Hazard report - ${report.category}`}
                            className={styles.photoImage}
                            onError={(e) => {
                              console.error('Image failed to load:', imageUrl);
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentNode.querySelector(`.${styles.photoPlaceholder}`);
                              if (placeholder) {
                                placeholder.style.display = 'flex';
                                placeholder.innerHTML = '<span>❌</span><span>Failed to load image</span>';
                              }
                            }}
                            onLoad={(e) => {
                              const placeholder = e.target.parentNode.querySelector(`.${styles.photoPlaceholder}`);
                              if (placeholder) {
                                placeholder.style.display = 'none';
                              }
                            }}
                          />
                          <div className={styles.photoPlaceholder}>
                            <span>📷</span>
                            <span>View Photo</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {getActionButtons(report)}
                </div>
              );
            })
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

        {/* Action Modal */}
        {showModal && (
          <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>
                  {modalAction === "verify" && "Accept Report"}
                  {modalAction === "reject" && "Reject Report"}
                  {modalAction === "mark-fixed" && "Mark as Fixed"}
                  {modalAction === "mark-in-progress" && "Mark as In Progress"}
                </h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <p>Are you sure you want to {modalAction.replace('-', ' ')} this report?</p>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button 
                  className={
                    modalAction === "reject" ? styles.confirmRejectBtn : 
                    modalAction === "verify" ? styles.confirmVerifyBtn :
                    modalAction === "mark-fixed" ? styles.confirmFixedBtn :
                    styles.confirmInProgressBtn
                  }
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && selectedImage && (
          <div className={styles.modalOverlay} onClick={() => setShowImageModal(false)}>
            <div className={styles.imageModal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.imageModalHeader}>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowImageModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.imageModalContent}>
                <img 
                  src={selectedImage} 
                  alt="Hazard report full size"
                  className={styles.fullSizeImage}
                  onError={(e) => {
                    console.error('Full size image failed to load:', selectedImage);
                    e.target.style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = styles.imageError;
                    errorDiv.textContent = 'Failed to load image';
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManageReports;