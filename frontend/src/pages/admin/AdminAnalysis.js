import React, { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import { showToast } from "../../components/Toast/Toast";
import { useAnalysis } from "../../hooks/useAnalysis";
import styles from "./AdminAnalysis.module.css";

function AdminAnalysis() {
  const {
    analysis,
    savedAnalyses,
    loading,
    error,
    generateAIAnalysis,
    generatePDFReport,
    generatePDFFromSavedAnalysis,
    stats,
    refreshAnalysis,
    viewHistoricalAnalysis,
    loadSavedAnalyses,
    pagination
  } = useAnalysis();

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedAiAnalysis, setSelectedAiAnalysis] = useState(null);
  const [filterParams, setFilterParams] = useState({
    analysisType: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    const result = await generatePDFReport();
    if (!result.success) {
      showToast(result.error || "Failed to generate PDF", "error");
    }
    setGeneratingPdf(false);
  };

  const handleGeneratePDFFromSaved = async (analysisId) => {
    setGeneratingPdf(true);
    const result = await generatePDFFromSavedAnalysis(analysisId);
    if (!result.success) {
      showToast(result.error || "Failed to generate PDF from saved analysis", "error");
    }
    setGeneratingPdf(false);
  };

  const handleAIAnalysisClick = () => {
    setConfirmModalOpen(true);
  };

  const handleConfirmAIAnalysis = async () => {
    setConfirmModalOpen(false);
    setAiGenerating(true);
    const result = await generateAIAnalysis();
    if (result.success) {
      setSelectedAiAnalysis(result.data);
      setAiModalOpen(true);
    } else {
      showToast(result.error || "Failed to generate AI analysis", "error");
    }
    setAiGenerating(false);
  };

  const handleCancelAIAnalysis = () => {
    setConfirmModalOpen(false);
  };

  const handleRefreshAnalysis = () => {
    refreshAnalysis();
  };

  const handleViewHistory = async () => {
    setHistoryLoading(true);
    setHistoryModalOpen(true);
    await loadSavedAnalyses(filterParams);
    setHistoryLoading(false);
  };

  const handleCloseHistory = () => {
    setHistoryModalOpen(false);
  };

  const handleLoadHistoricalAnalysis = async (analysisId) => {
    setHistoryLoading(true);
    const result = await viewHistoricalAnalysis(analysisId);
    if (result.success) {
      setSelectedAiAnalysis(result.data);
      setAiModalOpen(true);
    } else {
      showToast(result.error || "Failed to load historical analysis", "error");
    }
    setHistoryLoading(false);
  };

  const handleCloseAiModal = () => {
    setAiModalOpen(false);
    setSelectedAiAnalysis(null);
  };

  const handleFilterChange = (key, value) => {
    const newParams = { ...filterParams, [key]: value, page: 1 };
    setFilterParams(newParams);
    loadSavedAnalyses(newParams);
  };

  const handlePageChange = (newPage) => {
    const newParams = { ...filterParams, page: newPage };
    setFilterParams(newParams);
    loadSavedAnalyses(newParams);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const {
    mostReportedBarangays = [],
    reportTypeDistribution = [],
    trends = []
  } = analysis || {};

  const dashboardStats = stats || {};

  const calculateTrendStats = () => {
    if (!trends || trends.length === 0) return { total: 0, average: 0, trend: '→' };
    
    const total = trends.reduce((sum, month) => sum + (month.totalReports || 0), 0);
    const average = Math.round(total / trends.length);
    const trend = trends.length > 1 ? 
      (trends[trends.length - 1].totalReports > trends[0].totalReports ? '↑' : '↓') : '→';
    
    return { total, average, trend };
  };

  const trendStats = calculateTrendStats();

  if (loading && !analysis) {
    return (
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <div className={styles.adminMainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Generating analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !analysis) {
    return (
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <div className={styles.adminMainContent}>
          <div className={styles.errorContainer}>
            <h3>Error Loading Analysis</h3>
            <p>{error}</p>
            <button onClick={refreshAnalysis} className={styles.refreshBtn}>
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
        <div className={styles.adminHeader}>
          <div className={styles.headerContent}>
            <div>
              <h1>Hazard Analysis Dashboard</h1>
              <p>Comprehensive analysis of hazard reports and trends</p>
            </div>
            <div className={styles.headerActions}>
              <button 
                className={styles.analyzeBtn}
                onClick={handleAIAnalysisClick}
                disabled={aiGenerating || loading}
              >
                {aiGenerating ? (
                  <>
                    <span className={styles.spinner}></span>
                    Analyzing...
                  </>
                ) : (
                  <>Analyze with AI</>
                )}
              </button>
              <button 
                className={styles.historyBtn}
                onClick={handleViewHistory}
                disabled={historyLoading}
              >
                {historyLoading ? 'Loading...' : 'Analysis History'}
              </button>
              <button 
                className={styles.refreshBtn}
                onClick={handleRefreshAnalysis}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>📈</div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{dashboardStats.reportCount || 0}</div>
              <div className={styles.metricLabel}>Total Reports</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>✅</div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{dashboardStats.verifiedCount || 0}</div>
              <div className={styles.metricLabel}>Verified Reports</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>🎯</div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{dashboardStats.resolutionRate || "0"}%</div>
              <div className={styles.metricLabel}>Resolution Rate</div>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>⚠️</div>
            <div className={styles.metricContent}>
              <div className={styles.metricValue}>{dashboardStats.activeHazards || 0}</div>
              <div className={styles.metricLabel}>Active Hazards</div>
            </div>
          </div>
        </div>

        {/* Overview Section */}
        <div className={styles.overviewSection}>
          <div className={styles.middleSection}>
            {/* Most Reported Barangays */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Most Reported Barangays</h3>
                <span className={styles.chartSubtitle}>Top barangays by reports</span>
              </div>
              <div className={styles.hazardsList}>
                {mostReportedBarangays.length === 0 ? (
                  <div className={styles.noData}>
                    <p>No barangay data available</p>
                  </div>
                ) : (
                  mostReportedBarangays.slice(0, 8).map((barangay, index) => (
                    <div key={index} className={styles.hazardItem}>
                      <div className={styles.hazardRank}>
                        <span className={styles.rankNumber}>#{index + 1}</span>
                      </div>
                      <div className={styles.hazardInfo}>
                        <span className={styles.hazardName}>{barangay.barangay || 'Unknown'}</span>
                        <span className={styles.hazardReports}>{barangay.count || 0} reports</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Hazard Type Distribution */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Hazard Type Distribution</h3>
                <span className={styles.chartSubtitle}>Breakdown by category</span>
              </div>
              <div className={styles.typeDistribution}>
                {reportTypeDistribution.length === 0 ? (
                  <div className={styles.noData}>
                    <p>No hazard distribution data</p>
                  </div>
                ) : (
                  reportTypeDistribution.slice(0, 8).map((item, index) => {
                    const totalCount = reportTypeDistribution.reduce((sum, i) => sum + (i.count || 0), 0);
                    const percentage = Math.round(((item.count || 0) / totalCount) * 100);
                    
                    return (
                      <div key={index} className={styles.typeItem}>
                        <div className={styles.typeInfo}>
                          <div className={styles.typeColor} style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}></div>
                          <span className={styles.typeName}>{item._id || 'Unknown'}</span>
                        </div>
                        <div className={styles.typeStats}>
                          <span className={styles.typeCount}>{item.count || 0}</span>
                          <span className={styles.typePercentage}>({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Trends */}
          <div className={styles.trendsCard}>
            <div className={styles.chartHeader}>
              <h3>Reports Trend</h3>
              <span className={styles.chartSubtitle}>Monthly report statistics</span>
            </div>

            <div className={styles.trendsBars}>
              {trends.length === 0 ? (
                <div className={styles.noData}>
                  <p>No trend data available</p>
                </div>
              ) : (
                trends.slice(-12).map((month, index) => {
                  const maxReports = Math.max(...trends.map(m => m.totalReports || 0), 1);
                  const newReportsHeight = ((month.totalReports || 0) / maxReports) * 100;
                  
                  return (
                    <div key={index} className={styles.trendsBarGroup}>
                      <div className={styles.barContainer}>
                        <div 
                          className={`${styles.bar} ${styles.newReports}`}
                          style={{ 
                            height: `${Math.max(newReportsHeight, 5)}%`,
                            minHeight: '20px'
                          }}
                          title={`${month.totalReports || 0} reports in ${month._id?.month}/${month._id?.year}`}
                        ></div>
                      </div>
                      <span className={styles.monthLabel}>
                        {month._id ? `${month._id.month}/${String(month._id.year).slice(-2)}` : 'N/A'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {trends.length > 0 && (
              <div className={styles.trendsSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total Reports</span>
                  <span className={styles.summaryValue}>{trendStats.total}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Average/Month</span>
                  <span className={styles.summaryValue}>{trendStats.average}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Trend</span>
                  <span className={`${styles.summaryValue} ${
                    trendStats.trend === '↑' ? styles.positive : 
                    trendStats.trend === '↓' ? styles.negative : ''
                  }`}>
                    {trendStats.trend}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Confirmation Modal */}
        {confirmModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.confirmModalContent}>
              <div className={styles.modalHeader}>
                <h2>Generate AI Analysis</h2>
                <button className={styles.closeButton} onClick={handleCancelAIAnalysis}>×</button>
              </div>
              <div className={styles.confirmModalBody}>
                <div className={styles.confirmIcon}><span>AI</span></div>
                <div className={styles.confirmText}>
                  <h3>Start AI Analysis?</h3>
                  <p>
                    This will generate a comprehensive AI-powered analysis of your hazard data, 
                    including trends and actionable insights. The analysis 
                    will be saved to your history and may take a few moments to complete.
                  </p>
                </div>
                <div className={styles.analysisDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Current Data:</span>
                    <span className={styles.detailValue}>
                      {dashboardStats.reportCount || 0} reports, {dashboardStats.activeHazards || 0} active hazards
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Includes:</span>
                    <span className={styles.detailValue}>
                      Trend analysis, AI insights, recommendations
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.confirmModalFooter}>
                <button 
                  className={styles.cancelConfirmBtn}
                  onClick={handleCancelAIAnalysis}
                  disabled={aiGenerating}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmAnalyzeBtn}
                  onClick={handleConfirmAIAnalysis}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? (
                    <>Generating...</>
                  ) : (
                    'Generate AI Analysis'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {historyModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={`${styles.modalHeader} ${styles.stickyHeader}`}>
                <h2>Analysis History</h2>
                <button className={styles.closeButton} onClick={handleCloseHistory}>×</button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={`${styles.historyFilters} ${styles.stickyFilters}`}>
                  <div className={styles.filterGroup}>
                    <label>Order:</label>
                    <select 
                      value={filterParams.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      className={styles.filterSelect}
                    >
                      <option value="desc">Newest First</option>
                      <option value="asc">Oldest First</option>
                    </select>
                  </div>
                </div>
                
                {historyLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading history...</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.historyGrid}>
                      {savedAnalyses.map((savedAnalysis) => (
                        <div key={savedAnalysis._id} className={styles.historyCard}>
                          <div className={styles.historyCardHeader}>
                            <span className={styles.analysisType}>
                              {savedAnalysis.analysisType === 'ai' ? 'AI' : 
                              savedAnalysis.analysisType === 'pdf' ? 'PDF' : 'Full'}
                            </span>
                          </div>
                          <div className={styles.historyCardContent}>
                            <h4>{savedAnalysis.summary}</h4>
                            <p className={styles.historyDate}>
                              Generated: {formatDate(savedAnalysis.generatedAt)}
                            </p>
                            {savedAnalysis.generatedBy && (
                              <p className={styles.historyUser}>
                                By: {savedAnalysis.generatedBy.name || savedAnalysis.generatedBy.email}
                              </p>
                            )}
                            <div className={styles.historyStats}>
                              <span>Reports: {savedAnalysis.dashboardStats?.reportCount || 0}</span>
                              <span>Resolution: {savedAnalysis.dashboardStats?.resolutionRate || 0}%</span>
                              <span>Active: {savedAnalysis.dashboardStats?.activeHazards || 0}</span>
                            </div>
                          </div>
                          <div className={styles.historyCardActions}>
                            {savedAnalysis.analysisType === 'ai' && (
                              <button 
                                className={styles.aiHistoryBtn}
                                onClick={() => handleLoadHistoricalAnalysis(savedAnalysis._id)}
                              >
                                View AI Analysis
                              </button>
                            )}
                            <button 
                              className={styles.downloadHistoryBtn}
                              onClick={() => handleGeneratePDFFromSaved(savedAnalysis._id)}
                              disabled={generatingPdf}
                            >
                              {generatingPdf ? 'Generating...' : 'Download PDF'}
                            </button>
                          </div>
                        </div>
                      ))}
                      {savedAnalyses.length === 0 && (
                        <div className={styles.noHistory}>
                          <h3>No Analysis History</h3>
                          <p>Generate your first analysis to see it here.</p>
                          <button 
                            className={styles.generateFirstBtn}
                            onClick={handleAIAnalysisClick}
                          >
                            Generate First Analysis
                          </button>
                        </div>
                      )}
                    </div>

                    {pagination.pages > 1 && (
                      <div className={styles.pagination}>
                        <button 
                          className={styles.paginationBtn}
                          onClick={() => handlePageChange(pagination.current - 1)}
                          disabled={pagination.current === 1}
                        >
                          Previous
                        </button>
                        <span className={styles.paginationInfo}>
                          Page {pagination.current} of {pagination.pages}
                        </span>
                        <button 
                          className={styles.paginationBtn}
                          onClick={() => handlePageChange(pagination.current + 1)}
                          disabled={pagination.current === pagination.pages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* AI Results Modal */}
        {aiModalOpen && selectedAiAnalysis && (
          <div className={styles.modalOverlay}>
            <div className={styles.aiModalContent}>
              <div className={styles.modalHeader}>
                <h2>AI Hazard Analysis</h2>
                <button className={styles.closeButton} onClick={handleCloseAiModal}>×</button>
              </div>

              <div className={styles.aiModalBody}>
                <div className={styles.aiSummarySection}>
                  <h3>Summary</h3>
                  <p>{selectedAiAnalysis.summary || "No summary available."}</p>
                </div>

                <div className={styles.aiStatsGrid}>
                  <div className={styles.aiStatBox}>
                    <span className={styles.aiStatLabel}>Total Reports</span>
                    <span className={styles.aiStatValue}>{selectedAiAnalysis.dashboardStats?.reportCount ?? 0}</span>
                  </div>
                  <div className={styles.aiStatBox}>
                    <span className={styles.aiStatLabel}>Resolution Rate</span>
                    <span className={styles.aiStatValue}>{selectedAiAnalysis.dashboardStats?.resolutionRate ?? 0}%</span>
                  </div>
                  <div className={styles.aiStatBox}>
                    <span className={styles.aiStatLabel}>Active Hazards</span>
                    <span className={styles.aiStatValue}>{selectedAiAnalysis.dashboardStats?.activeHazards ?? 0}</span>
                  </div>
                </div>

                <div className={styles.aiInsightsSection}>
                  <h3>AI Insights</h3>
                  <div className={styles.aiInsightsBox}>
                    {selectedAiAnalysis.aiInsights ? (
                      <p>{selectedAiAnalysis.aiInsights}</p>
                    ) : (
                      <p>No AI insights available for this analysis.</p>
                    )}
                  </div>
                </div>

                <div className={styles.aiModalFooter}>
                  <button className={styles.closeAiBtn} onClick={handleCloseAiModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminAnalysis;

