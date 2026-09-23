import React, { useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import { useHazards } from "../hooks/useHazards";
import HazardsMap from "../components/Map/HazardsMap";
import styles from "./Home.module.css";

function Home() {
  // Use mapHazards for map display
  const { mapHazards, loading, mapLoading, error, refreshHazards } = useHazards(50);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showRecentHazards, setShowRecentHazards] = useState(() => window.innerWidth > 768);

  // Get only the three most recent hazards (for sidebar)
  const threeRecentHazards = mapHazards.slice(0, 3);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const truncateDescription = (description, maxLength = 50) => {
    if (!description) return "No description";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const getCategoryClass = (category) => {
    if (!category) return styles.categoryUnknown;
    const categoryMap = {
      'natural': styles.categoryNatural,
      'infrastructure': styles.categoryInfrastructure,
      'utility': styles.categoryUtility,
      'human-induced': styles.categoryHumanInduced
    };
    return categoryMap[category.toLowerCase()] || styles.categoryUnknown;
  };

  const getStatusClass = (status) => {
    if (!status) return styles.statusUnknown;
    const statusMap = {
      'not fixed': styles.statusNotfixed,
      'in progress': styles.statusInprogress,
      'fixed': styles.statusFixed
    };
    return statusMap[status.toLowerCase()] || styles.statusUnknown;
  };

  return (
    <div className={styles.appContainer}>
      <div className={styles.bodyContainer}>
        <Sidebar showBurger={false} belowBar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
        <div className={styles.pageContent}>
          {/* Mobile top bar: burger | title | recent hazards */}
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
              className={`${styles.mobileRecentBtn} ${showRecentHazards ? styles.mobileRecentBtnActive : ""}`}
              onClick={() => setShowRecentHazards(prev => !prev)}
              aria-label="Toggle recent hazards"
              aria-expanded={showRecentHazards}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 6h13M8 12h13M8 18h13" />
                <path d="M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
            </button>
          </div>

          {/* Map */}
          <div className={styles.mapContainer}>
            <div className={styles.mapCard}>
              <h3>Hazards Map - Dagupan City</h3>
              {mapLoading ? (
                <div className={styles.mapPlaceholder}>Loading map...</div>
              ) : error ? (
                <div className={styles.mapPlaceholder}>Error loading map: {error}</div>
              ) : (
                <HazardsMap hazards={mapHazards} style={{ height: '100%', width: '100%' }} />
              )}
            </div>
          </div>

          {/* Recent Hazards sidebar */}
          {showRecentHazards && (
          <div className={styles.recentHazardsBox}>
            <div className={styles.hazardsHeader}>
              <h3>Recent Hazards</h3>
              <div className={styles.headerControls}>
                <span className={styles.hazardsCount}>{threeRecentHazards.length} shown</span>
                <button 
                  onClick={refreshHazards} 
                  className={styles.refreshBtn}
                  disabled={mapLoading}
                  title="Refresh hazards"
                >
                  {mapLoading ? '⟳' : '↻'}
                </button>
              </div>
            </div>

            <div className={styles.recentHazardsContent}>
              {mapLoading ? (
                <div className={styles.hazardsLoading}>Loading hazards...</div>
              ) : error ? (
                <div className={styles.hazardsError}>
                  <div>{error}</div>
                  <button onClick={refreshHazards} className={styles.retryBtn}>Retry</button>
                </div>
              ) : threeRecentHazards.length === 0 ? (
                <div className={styles.noHazards}>No hazards reported yet</div>
              ) : (
                <ul className={styles.recentHazards}>
                  {threeRecentHazards.map((hazard) => (
                    <li key={hazard._id} className={styles.hazardItem}>
                      <div className={styles.hazardCategory}>
                        <span className={`${styles.categoryBadge} ${getCategoryClass(hazard.category)}`}>
                          {hazard.category || 'Unknown'}
                        </span>
                      </div>
                      <div className={styles.hazardDescription}>
                        {truncateDescription(hazard.description, 40)}
                      </div>
                      <div className={styles.hazardMeta}>
                        <span className={styles.hazardDate}>{formatDate(hazard.createdAt)}</span>
                        <span className={`${styles.statusBadge} ${getStatusClass(hazard.fixedStatus)}`}>
                          {hazard.fixedStatus || 'unknown'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {mapHazards.length > 3 && (
              <div className={styles.viewMoreSection}>
                <span className={styles.viewMoreText}>
                  +{mapHazards.length - 3} more hazards
                </span>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
