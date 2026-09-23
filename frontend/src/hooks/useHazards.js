// src/hooks/useHazards.js
import { useState, useEffect } from 'react';
import { getAllHazards, updateHazardFixedStatus, getHazardsForMap } from '../services/hazardServices';

export const useHazards = (limit = null) => {
  const [hazards, setHazards] = useState([]);
  const [mapHazards, setMapHazards] = useState([]); // for map display
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true); // loading state for map
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHazards();
    fetchHazardsForMap(); // fetch map-specific hazards
  }, []);

  const fetchHazards = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getAllHazards();

      if (response.success && response.hazards) {
        // Sort by date (newest first) and apply limit
        const sortedHazards = response.hazards
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, limit);
        setHazards(sortedHazards);
      } else {
        setError(response.message || "Failed to load hazards");
      }
    } catch (err) {
      console.error("Error fetching hazards:", err);
      setError("Failed to load hazards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch hazards specifically for map display
  const fetchHazardsForMap = async () => {
    try {
      setMapLoading(true);

      const response = await getHazardsForMap();

      if (response.success && response.hazards) {
        setMapHazards(response.hazards);
      } else {
        console.warn(response.message || "Failed to load map hazards");
        setMapHazards([]);
      }
    } catch (err) {
      console.error("Error fetching hazards for map:", err);
      setMapHazards([]);
    } finally {
      setMapLoading(false);
    }
  };


  // Function to update fixedStatus of a hazard
  const updateFixedStatus = async (hazardId, newStatus) => {
    try {
      const response = await updateHazardFixedStatus(hazardId, newStatus);

      if (response.success && response.hazard) {
        // Update local state
        setHazards(prevHazards =>
          prevHazards.map(h =>
            h._id === hazardId ? { ...h, fixedStatus: response.hazard.fixedStatus } : h
          )
        );
        // Also refresh map hazards
        fetchHazardsForMap();
        return { success: true, message: response.message, hazard: response.hazard };
      } else {
        const msg = response.message || "Failed to update hazard status";
        setError(msg);
        return { success: false, message: msg };
      }
    } catch (err) {
      const msg = "Failed to update hazard status. Please try again.";
      console.error("Error updating hazard status:", err);
      setError(msg);
      return { success: false, message: msg };
    }
  };

  // Function to refresh hazards
  const refreshHazards = () => {
    fetchHazards();
    fetchHazardsForMap();
  };

  return {
    hazards,
    mapHazards, // hazards for map display
    loading,
    mapLoading,
    error,
    refreshHazards,
    updateFixedStatus,
  };
};