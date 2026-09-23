import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import HazardsMap from "../../components/Map/HazardsMap";
import { useHazards } from "../../hooks/useHazards";
import { useReports } from "../../hooks/useReports";
import { showToast } from "../../components/Toast/Toast";
import styles from "./AdminViewHazards.module.css";

function AdminViewHazards() {
  // Use reports hook for fetching data and verification actions
  const { reports, loading, error, fetchReportsForMap, verifyUserReport, rejectUserReport } = useReports();
  // Use hazards hook only for status updates
  const { updateFixedStatus, refreshHazards } = useHazards();

  useEffect(() => {
    fetchReportsForMap(); 
  }, []);

  const [filteredReports, setFilteredReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState([]);
  const [selectedVerifiedStatuses, setSelectedVerifiedStatuses] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchBoxOpen, setSearchBoxOpen] = useState(true);

  // Admin-specific options
  const categories = ["Natural", "Infrastructure", "Utility", "Human-Induced"];
  const verifiedStatuses = ["pending", "verified", "rejected"];
  const subtypes = {
    "Natural": ["Flood", "Typhoon", "Landslide", "Earthquake", "Volcanic Eruption", "Storm Surge", "Drought", "Tsunami"],
    "Infrastructure": ["Pothole", "Collapsed Building", "Broken Bridge", "Damaged Drainage", "Fallen Tree", "Fallen Post"],
    "Utility": ["Power Outage", "Broken Streetlight", "Water Leak", "Telecommunication Outage", "Gas Leak"],
    "Human-Induced": ["Fire Incident", "Road Accident", "Chemical Spill", "Garbage Pileup", "Vandalism"]
  };

  // Get all unique subtypes from reports
  const allSubtypes = selectedCategories.length > 0
    ? selectedCategories.flatMap(category => subtypes[category] || [])
    : Object.values(subtypes).flat();

  // Filter reports
  useEffect(() => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.subtype?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(report =>
        selectedCategories.includes(report.category)
      );
    }

    // Subtype filter
    if (selectedSubtypes.length > 0) {
      filtered = filtered.filter(report =>
        selectedSubtypes.includes(report.subtype)
      );
    }

    // Verified status filter
    if (selectedVerifiedStatuses.length > 0) {
      filtered = filtered.filter(report =>
        selectedVerifiedStatuses.includes(report.verifiedStatus)
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, selectedCategories, selectedSubtypes, selectedVerifiedStatuses]);

  // Calculate priority based on report characteristics
  const calculatePriority = (report) => {
    let score = 0;
    
    // Category-based scoring
    const categoryScores = {
      'Utility': 1,
      'Infrastructure': 2,
      'Human-Induced': 3,
      'Natural': 4
    };
    
    score += categoryScores[report.category] || 1;

    // Status-based scoring
    if (report.fixedStatus === 'not fixed') score += 2;
    if (report.verifiedStatus === 'verified') score += 1;

    // Determine priority level
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle category checkbox
  const handleCategoryChange = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle subtype checkbox
  const handleSubtypeChange = (subtype) => {
    setSelectedSubtypes(prev =>
      prev.includes(subtype)
        ? prev.filter(s => s !== subtype)
        : [...prev, subtype]
    );
  };

  // Handle verified status checkbox
  const handleVerifiedStatusChange = (status) => {
    setSelectedVerifiedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedSubtypes([]);
    setSelectedVerifiedStatuses([]);
  };

  // Select all for checkboxes
  const selectAll = (type) => {
    switch (type) {
      case 'categories':
        setSelectedCategories([...categories]);
        break;
      case 'subtypes':
        setSelectedSubtypes([...allSubtypes]);
        break;
      case 'verifiedStatuses':
        setSelectedVerifiedStatuses([...verifiedStatuses]);
        break;
      default:
        break;
    }
  };

  // Handle action button click
  const handleActionClick = (report, action) => {
    setSelectedReport(report);
    setModalAction(action);
    setAdminNotes("");
    setShowActionModal(true);
  };

  // Confirm action
  const handleConfirmAction = async () => {
    if (!selectedReport) return;

    setActionLoading(true);

    try {
      let result;

      if (modalAction === "verify") {
        result = await verifyUserReport(selectedReport._id);
      } else if (modalAction === "reject") {
        result = await rejectUserReport(selectedReport._id);
      } else if (modalAction === "mark-fixed") {
        // Use hazardId from the report for fixed status updates
        if (selectedReport.hazardId) {
          result = await updateFixedStatus(selectedReport.hazardId, "fixed");
        } else {
          showToast("Cannot mark as fixed: No associated hazard found", "error");
          return;
        }
      } else if (modalAction === "mark-in-progress") {
        // Use hazardId from the report for fixed status updates
        if (selectedReport.hazardId) {
          result = await updateFixedStatus(selectedReport.hazardId, "in progress");
        } else {
          showToast("Cannot mark as in progress: No associated hazard found", "error");
          return;
        }
      }

      if (result && !result.success) {
        console.error("Action failed:", result.message);
        showToast(`Action failed: ${result.message}`, "error");
      } else if (result && result.success) {
        console.log("Action successful:", result.message);
        // Refresh both reports and hazards to get updated data
        fetchReportsForMap();
        refreshHazards();
      }

    } catch (err) {
      console.error("Error performing action:", err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setActionLoading(false);
      setShowActionModal(false);
      setSelectedReport(null);
      setAdminNotes("");
    }
  };


  

  // Get verified status display text
  const getVerifiedStatusDisplay = (status) => {
    switch (status) {
      case 'verified': return '✅ Verified';
      case 'pending': return '⏳ Pending';
      case 'rejected': return '❌ Rejected';
      default: return status;
    }
  };

  // Convert reports to hazards format for the map component
  const reportsAsHazards = filteredReports.map(report => ({
    ...report,
    // Ensure the map component gets all required properties
    _id: report.hazardId || report._id, // Use hazardId if available, otherwise fallback to report ID
    location: report.location || { lat: 0, lng: 0 }, // Ensure location exists
    verifiedStatus: report.verifiedStatus || 'pending',
    fixedStatus: report.fixedStatus || 'not fixed'
  }));
  
  return (
    <div className={styles.adminLayout}>
      <AdminSidebar showBurger={false} belowBar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
      <div className={styles.adminMainContent}>
        {/* Mobile top bar: burger | title | filter */}
        <div className={styles.mobileTopBar}>
          <button
            type="button"
            className={styles.mobileBurgerBtn}
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <h3 className={styles.mobileTopBarTitle}>Hazards Map - Dagupan City</h3>
          <button
            type="button"
            className={`${styles.mobileFilterBtn} ${searchBoxOpen ? styles.mobileFilterBtnActive : ""}`}
            onClick={() => {
              const next = !searchBoxOpen;
              setSearchBoxOpen(next);
              if (next) setShowFilters(true);
            }}
            aria-label="Toggle filters"
            aria-expanded={searchBoxOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        <div className={styles.mapContainer}>
          <div className={styles.mapCard}>
            <h3>Hazards Map - Dagupan City</h3>
            {loading ? <div className={styles.mapPlaceholder}>Loading hazards map...</div> 
            : error ? <div className={styles.mapPlaceholder}>Error loading map: {error}</div>
            : <HazardsMap hazards={reportsAsHazards} height="100%" showPriority={true} calculatePriority={calculatePriority} />}
          </div>
        </div>
        
        {/* Search Box - Positioned like regular user view */}
        {searchBoxOpen && (
        <div className={styles.searchBox}>
          <div className={styles.searchHeader}>
            <h3>Search & Filter Reports</h3>
            <button 
              className={styles.toggleFiltersBtn}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? '▲' : '▼'}
            </button>
          </div>

          <div className={styles.searchContent}>
            {/* Search Input */}
            <div className={styles.searchInputGroup}>
              <input
                type="text"
                placeholder="🔍 Search reports, categories..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles.searchInput}
              />
              <div className={styles.resultsCount}>
                📊 Showing {filteredReports.length} reports
              </div>
            </div>

            {/* Filters Content */}
            {showFilters && (
              <div className={styles.filtersContent}>
                {/* Categories Filter */}
                <div className={styles.filterGroup}>
                  <div className={styles.filterHeader}>
                    <label className={styles.filterLabel}>Categories</label>
                    <button 
                      onClick={() => selectAll('categories')}
                      className={styles.selectAllBtn}
                    >
                      Select All
                    </button>
                  </div>
                  <div className={`${styles.checkboxGroup} ${styles.scrollable}`}>
                    {categories.map(category => (
                      <label key={category} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => handleCategoryChange(category)}
                          className={styles.checkboxInput}
                        />
                        <span className={styles.checkmark}></span>
                        {category}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subtypes Filter */}
                <div className={styles.filterGroup}>
                  <div className={styles.filterHeader}>
                    <label className={styles.filterLabel}>Subtypes</label>
                    <button 
                      onClick={() => selectAll('subtypes')}
                      className={styles.selectAllBtn}
                    >
                      Select All
                    </button>
                  </div>
                  <div className={`${styles.checkboxGroup} ${styles.scrollable}`}>
                    {allSubtypes.map(subtype => (
                      <label key={subtype} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedSubtypes.includes(subtype)}
                          onChange={() => handleSubtypeChange(subtype)}
                          className={styles.checkboxInput}
                        />
                        <span className={styles.checkmark}></span>
                        {subtype}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Verified Status Filter */}
                <div className={styles.filterGroup}>
                  <div className={styles.filterHeader}>
                    <label className={styles.filterLabel}>Verification Status</label>
                    <button 
                      onClick={() => selectAll('verifiedStatuses')}
                      className={styles.selectAllBtn}
                    >
                      Select All
                    </button>
                  </div>
                  <div className={`${styles.checkboxGroup}`}>
                    {verifiedStatuses.map(status => (
                      <label key={status} className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedVerifiedStatuses.includes(status)}
                          onChange={() => handleVerifiedStatusChange(status)}
                          className={styles.checkboxInput}
                        />
                        <span className={styles.checkmark}></span>
                        {getVerifiedStatusDisplay(status)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button 
                  onClick={clearFilters}
                  className={styles.clearFiltersBtn}
                  disabled={!searchTerm && selectedCategories.length === 0 && selectedSubtypes.length === 0 && selectedVerifiedStatuses.length === 0}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Action Modal */}
        {showActionModal && selectedReport && (
          <div className={styles.modalOverlay} onClick={() => setShowActionModal(false)}>
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
                  onClick={() => setShowActionModal(false)}
                  disabled={actionLoading}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <p>Are you sure you want to {modalAction.replace('-', ' ')} this report?</p>
                <div className={styles.hazardPreview}>
                  <div className={styles.previewHeader}>
                    <strong>{selectedReport.category} - {selectedReport.subtype}</strong>
                    <span className={styles.previewPriority}>
                      Priority: {calculatePriority(selectedReport)}
                    </span>
                  </div>
                  <p className={styles.previewDescription}>
                    {selectedReport.description}
                  </p>
                  {!selectedReport.hazardId && (modalAction === "mark-fixed" || modalAction === "mark-in-progress") && (
                    <div className={styles.warningNote}>
                      ⚠️ Note: This report doesn't have an associated hazard yet.
                    </div>
                  )}
                </div>
                <div className={styles.notesInput}>
                  <label htmlFor="admin-notes">Add Notes (Optional):</label>
                  <textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any additional notes or comments..."
                    rows="3"
                    disabled={actionLoading}
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowActionModal(false)}
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
                  disabled={actionLoading || 
                    ((modalAction === "mark-fixed" || modalAction === "mark-in-progress") && !selectedReport.hazardId)
                  }
                >
                  {actionLoading ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminViewHazards;