// src/hooks/useDashboard.js
import { useState, useEffect } from "react";
import {
  getDashboardStats,
  getReportTypeDistribution,
  getReportTrends,
  getMostReportedHazards,
} from "../services/dashboardServices";

export const useDashboard = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    verifiedCount: 0,
    pendingCount: 0,
    resolvedCount: 0,
  });
  const [typeDistribution, setTypeDistribution] = useState([]);
  const [trends, setTrends] = useState([]);
  const [mostReportedHazards, setMostReportedHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all dashboard data in parallel
      const [
        statsResponse,
        typeResponse,
        trendsResponse,
        mostReportedResponse,
      ] = await Promise.all([
        getDashboardStats(),
        getReportTypeDistribution(),
        getReportTrends(),
        getMostReportedHazards(),
      ]);

      if (statsResponse.success && statsResponse.stats) {
        setStats(statsResponse.stats);
      }

      if (typeResponse.success && typeResponse.distribution) {
        setTypeDistribution(typeResponse.distribution);
      }

      if (trendsResponse.success && trendsResponse.trends) {
        setTrends(trendsResponse.trends);
      }

      if (mostReportedResponse.success && mostReportedResponse.mostReported) {
        setMostReportedHazards(mostReportedResponse.mostReported);
      }

      // Handle any errors
      const errors = [
        statsResponse,
        typeResponse,
        trendsResponse,
        mostReportedResponse,
      ].filter((res) => !res.success);
      if (errors.length) {
        setError(errors.map((e) => e.message).join(", "));
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = () => {
    fetchDashboardData();
  };

  return {
    stats,
    typeDistribution,
    trends,
    mostReportedHazards,
    loading,
    error,
    refreshDashboard,
  };
};