import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import HazardsMap from "../components/Map/HazardsMap";
import { useHazards } from "../hooks/useHazards";
import styles from "./ViewHazards.module.css";

function ViewHazard() {
  const { mapHazards, error, mapLoading, loading, refreshHazards } = useHazards(50); // use mapHazards
  const [filteredHazards, setFilteredHazards] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubtypes, setSelectedSubtypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchBoxOpen, setSearchBoxOpen] = useState(true);

  // Available options
  const categories = ["Natural", "Infrastructure", "Utility", "Human-Induced"];
  const subtypes = {
    "Natural": ["Flood", "Typhoon", "Landslide", "Earthquake", "Volcanic Eruption", "Storm Surge", "Drought", "Tsunami"],
    "Infrastructure": ["Pothole", "Collapsed Building", "Broken Bridge", "Damaged Drainage", "Fallen Tree", "Fallen Post"],
    "Utility": ["Power Outage", "Broken Streetlight", "Water Leak", "Telecommunication Outage", "Gas Leak"],
    "Human-Induced": ["Fire Incident", "Road Accident", "Chemical Spill", "Garbage Pileup", "Vandalism"]
  };
  const statusOptions = ["not fixed", "in progress", "fixed"];

  // Get all unique subtypes based on selected categories
  const allSubtypes = selectedCategories.length > 0
    ? selectedCategories.flatMap(category => subtypes[category] || [])
    : Object.values(subtypes).flat();

  // Apply filters
  useEffect(() => {
    let filtered = mapHazards;

    if (searchTerm) {
      filtered = filtered.filter(hazard =>
        hazard.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hazard.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hazard.subtype?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(hazard => selectedCategories.includes(hazard.category));
    }

    if (selectedSubtypes.length > 0) {
      filtered = filtered.filter(hazard => selectedSubtypes.includes(hazard.subtype));
    }

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(hazard => selectedStatuses.includes(hazard.fixedStatus?.toLowerCase()));
    }

    setFilteredHazards(filtered);
  }, [mapHazards, searchTerm, selectedCategories, selectedSubtypes, selectedStatuses]);

  // Handlers
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleCategoryChange = (category) => setSelectedCategories(prev =>
    prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
  );
  const handleSubtypeChange = (subtype) => setSelectedSubtypes(prev =>
    prev.includes(subtype) ? prev.filter(s => s !== subtype) : [...prev, subtype]
  );
  const handleStatusChange = (status) => setSelectedStatuses(prev =>
    prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
  );
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
    setSelectedSubtypes([]);
    setSelectedStatuses([]);
  };
  const selectAllCategories = () => setSelectedCategories([...categories]);
  const selectAllSubtypes = () => setSelectedSubtypes([...allSubtypes]);
  const selectAllStatuses = () => setSelectedStatuses([...statusOptions]);

  return (
    <div className={styles.appContainer}>
      <div className={styles.bodyContainer}>
        <Sidebar showBurger={false} belowBar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
        <div className={styles.pageContent}>
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

          {/* Map */}
          <div className={styles.mapContainer}>
            <div className={styles.mapCard}>
              <h3>Hazards Map - Dagupan City</h3>
              {mapLoading ? (
                <div className={styles.mapPlaceholder}>Loading map...</div>
              ) : (
                <HazardsMap 
                  hazards={filteredHazards} 
                  style={{ height: '100%', width: '100%' }}
                />
              )}
            </div>
          </div>

          {/* Search and Filters */}
          {searchBoxOpen && (
          <div className={styles.searchBox}>
            <div className={styles.searchHeader}>
              <h3>Search Hazards</h3>
              <button className={styles.toggleFiltersBtn} onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? '▲' : '▼'}
              </button>
            </div>

            <div className={styles.searchContent}>
              <div className={styles.searchInputGroup}>
                <input
                  type="text"
                  placeholder="Search hazards by description, category, or type..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                />
                <div className={styles.resultsCount}>{filteredHazards.length} of {mapHazards.length} hazards</div>
              </div>

              {showFilters && (
                <div className={styles.filtersContent}>
                  {/* Category */}
                  <div className={styles.filterGroup}>
                    <div className={styles.filterHeader}>
                      <label className={styles.filterLabel}>Categories</label>
                      <button onClick={selectAllCategories} className={styles.selectAllBtn}>Select All</button>
                    </div>
                    <div className={styles.checkboxGroup}>
                      {categories.map(category => (
                        <label key={category} className={styles.checkboxLabel}>
                          <input type="checkbox" checked={selectedCategories.includes(category)} onChange={() => handleCategoryChange(category)} />                         
                          {category}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Subtypes */}
                  <div className={styles.filterGroup}>
                    <div className={styles.filterHeader}>
                      <label className={styles.filterLabel}>Types</label>
                      <button onClick={selectAllSubtypes} className={styles.selectAllBtn}>Select All</button>
                    </div>
                    <div className={`${styles.checkboxGroup} ${styles.scrollable}`}>
                      {allSubtypes.map(subtype => (
                        <label key={subtype} className={styles.checkboxLabel}>
                          <input type="checkbox" checked={selectedSubtypes.includes(subtype)} onChange={() => handleSubtypeChange(subtype)} />                         
                          {subtype}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className={styles.filterGroup}>
                    <div className={styles.filterHeader}>
                      <label className={styles.filterLabel}>Status</label>
                      <button onClick={selectAllStatuses} className={styles.selectAllBtn}>Select All</button>
                    </div>
                    <div className={styles.checkboxGroup}>
                      {statusOptions.map(status => (
                        <label key={status} className={styles.checkboxLabel}>
                          <input type="checkbox" checked={selectedStatuses.includes(status)} onChange={() => handleStatusChange(status)} />
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button onClick={clearFilters} className={styles.clearFiltersBtn} disabled={!searchTerm && selectedCategories.length === 0 && selectedSubtypes.length === 0 && selectedStatuses.length === 0}>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Loading/Error Messages */}
          {mapLoading && <div className={styles.statusMessage}>Loading hazards...</div>}
          {error && (
            <div className={`${styles.statusMessage} ${styles.error}`}>
              {error}
              <button onClick={refreshHazards} className={styles.retryBtn}>Retry</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewHazard;
