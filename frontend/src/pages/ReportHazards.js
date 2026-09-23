import React, { useState, useRef } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import HazardsMap from "../components/Map/HazardsMap";
import { useReports } from "../hooks/useReports";
import { useHazards } from "../hooks/useHazards";
import styles from "./ReportHazards.module.css";

function ReportHazard() {
  const { addReport, loading, error, clearError } = useReports();
  const { mapHazards, mapLoading, refreshHazards } = useHazards(50); // use mapHazards now
  
  const [formData, setFormData] = useState({
    category: "",
    subtype: "",
    description: "",
    lat: "",
    lng: "",
    photo: null
  });

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Category and subtype options
  const categories = ["Natural", "Infrastructure", "Utility", "Human-Induced"];
  const subtypeOptions = {
    "Natural": ["Flood","Typhoon","Landslide","Earthquake","Volcanic Eruption","Storm Surge","Drought","Tsunami"],
    "Infrastructure": ["Pothole","Collapsed Building","Broken Bridge","Damaged Drainage","Fallen Tree","Fallen Post"],
    "Utility": ["Power Outage","Broken Streetlight","Water Leak","Telecommunication Outage","Gas Leak"],
    "Human-Induced": ["Fire Incident","Road Accident","Chemical Spill","Garbage Pileup","Vandalism"]
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData(prev => ({ ...prev, category: value, subtype: "" }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (submitStatus || error) {
      setSubmitStatus(null);
      clearError();
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, photo: e.target.files[0] }));
    if (submitStatus || error) {
      setSubmitStatus(null);
      clearError();
    }
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setSelectedLocation([lat, lng]);
    setFormData(prev => ({ ...prev, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
    if (submitStatus || error) {
      setSubmitStatus(null);
      clearError();
    }
  };

  // Handle submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus(null);
    clearError();

    if (!formData.lat || !formData.lng) {
      setSubmitStatus({ type: 'error', message: 'Please select a location on the map.' });
      return;
    }

    if (!formData.category || !formData.subtype || !formData.description) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    try {
      const reportData = {
        category: formData.category,
        subtype: formData.subtype,
        description: formData.description,
        location: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) },
        photo: formData.photo
      };

      const result = await addReport(reportData);

      if (result.success) {
        let successMsg = "Hazard report submitted successfully!";
        if (result.message?.toLowerCase().includes("merged")) {
          successMsg = "A similar hazard already exists — your report was merged with it.";
        }
        setSubmitStatus({ type: 'success', message: successMsg });

        // Reset form
        setFormData({ category: "", subtype: "", description: "", lat: "", lng: "", photo: null });
        setSelectedLocation(null);
        if (fileInputRef.current) fileInputRef.current.value = null;

        // Auto-clear message
        setTimeout(() => setSubmitStatus(null), 3000);

        // Refresh map hazards
        //refreshHazards();
      } else {
        setSubmitStatus({ type: 'error', message: result.message || 'Failed to submit hazard report.' });
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setSubmitStatus({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    }
  };

  const currentSubtypes = subtypeOptions[formData.category] || [];

  return (
    <div className={styles.appContainer}>
      <div className={styles.bodyContainer}>
        <Sidebar showBurger={false} belowBar isOpen={sidebarOpen} onToggle={setSidebarOpen} />
        <div className={styles.pageContent}>
          {/* Mobile top bar: burger | title | form toggle */}
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
            <h3 className={styles.mobileTopBarTitle}>Report Hazard</h3>
            <button
              type="button"
              className={`${styles.mobileFormBtn} ${showForm ? styles.mobileFormBtnActive : ""}`}
              onClick={() => setShowForm(prev => !prev)}
              aria-label="Toggle report form"
              aria-expanded={showForm}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* Map */}
          <div className={styles.mapContainer}>
            <div className={styles.mapCard}>
              <h3>Report Hazard - Click on Map to Set Location</h3>
              {mapLoading ? (
                <div className={styles.mapPlaceholder}>Loading map and existing hazards...</div>
              ) : (
                <HazardsMap 
                  hazards={mapHazards} 
                  onMapClick={handleMapClick}
                  selectedLocation={selectedLocation}
                  style={{ height: '100%', width: '100%' }}
                />
              )}
            </div>
          </div>

          {/* Report Form */}
          {showForm && (
            <div className={styles.reportFormBox}>
              <div className={styles.formHeader}>
                <h3>Report New Hazard</h3>
                <button className={styles.closeBtn} onClick={() => setShowForm(false)} title="Close form">×</button>
              </div>

              <div className={styles.formContent}>
                {submitStatus && <div className={`${styles.statusMessage} ${styles[submitStatus.type]}`}>{submitStatus.message}</div>}
                

                <form onSubmit={handleSubmit} className={styles.hazardForm}>
                  {/* Category */}
                  <div className={styles.formGroup}>
                    <label htmlFor="category">Category *</label>
                    <select id="category" name="category" value={formData.category} onChange={handleInputChange} required disabled={loading}>
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Subtype */}
                  <div className={styles.formGroup}>
                    <label htmlFor="subtype">Subtype *</label>
                    <select id="subtype" name="subtype" value={formData.subtype} onChange={handleInputChange} required disabled={!formData.category || loading}>
                      <option value="">Select Subtype</option>
                      {currentSubtypes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div className={styles.formGroup}>
                    <label htmlFor="description">Description *</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the hazard..." rows="3" required disabled={loading} />
                  </div>

                  {/* Coordinates */}
                  <div className={styles.coordinatesGroup}>
                    <div className={styles.formGroup}>
                      <label htmlFor="lat">Latitude *</label>
                      <input type="text" id="lat" name="lat" value={formData.lat} placeholder="Click on map" readOnly required disabled={loading} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="lng">Longitude *</label>
                      <input type="text" id="lng" name="lng" value={formData.lng} placeholder="Click on map" readOnly required disabled={loading} />
                    </div>
                  </div>

                  {/* Photo */}
                  <div className={styles.formGroup}>
                    <label htmlFor="photo">Photo (Optional)</label>
                    <input type="file" id="photo" name="photo" onChange={handleFileChange} accept="image/*" disabled={loading} ref={fileInputRef} />
                    {formData.photo && <div className={styles.filePreview}>Selected: {formData.photo.name}</div>}
                  </div>

                  {/* Submit */}
                  <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {!showForm && <button className={styles.showFormBtn} onClick={() => setShowForm(true)} title="Open report form">Report Hazard</button>}
        </div>
      </div>
    </div>
  );
}

export default ReportHazard;
