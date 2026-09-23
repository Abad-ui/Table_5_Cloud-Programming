import React from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import styles from "./AdminDashboard.module.css";
import { useDashboard } from "../../hooks/useDashboards";

function AdminDashboard() {
  const {
    stats,
    typeDistribution,
    trends,
    mostReportedHazards,
    loading,
    error,
    refreshDashboard,
  } = useDashboard();

  // Safe defaults to avoid errors on initial render
  const safeStats = stats || {};
  const safeTypeDistribution = Array.isArray(typeDistribution) ? typeDistribution : [];
  const safeTrends = Array.isArray(trends) ? trends : [];
  const safeMostReportedHazards = Array.isArray(mostReportedHazards) ? mostReportedHazards : [];

  const formatNum = (n) => (n ?? 0).toLocaleString();

  const topStats = [
    { 
      title: "Number of Users", 
      value: formatNum(safeStats.userCount), 
      icon: "👥",
      color: "#3B82F6",
      description: "Registered users"
    },
    { 
      title: "Verified Reports", 
      value: formatNum(safeStats.verifiedCount), 
      icon: "✅",
      color: "#10B981",
      description: "Authenticated hazards"
    },
    { 
      title: "Pending Reports", 
      value: formatNum(safeStats.pendingCount), 
      icon: "⏳",
      color: "#F59E0B",
      description: "Awaiting review"
    },
    { 
      title: "Resolved Reports", 
      value: formatNum(safeStats.resolvedCount), 
      icon: "🔧",
      color: "#8B5CF6",
      description: "Completed actions"
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#EF4444';
      case 'high': return '#F59E0B';
      case 'medium': return '#3B82F6';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getSeverityBgColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#FEF2F2';
      case 'high': return '#FFFBEB';
      case 'medium': return '#EFF6FF';
      case 'low': return '#ECFDF5';
      default: return '#F3F4F6';
    }
  };

  if (loading) {
    return (
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <div className={styles.adminMainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <h2>Loading dashboard data...</h2>
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
            <h3>Error Loading Dashboard</h3>
            <p>{error}</p>
            <button onClick={refreshDashboard} className={styles.retryButton}>
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
          <h1>Admin Dashboard</h1>
          <p>Welcome to the HazardWatcher Admin Panel</p>
        </div>

        {/* Top Stats Boxes */}
        <div className={styles.statsGrid}>
          {topStats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIconWrapper} style={{ backgroundColor: stat.color + '20', borderColor: stat.color }}>
                <span className={styles.statIcon} style={{ color: stat.color }}>
                  {stat.icon}
                </span>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statTitle}>{stat.title}</h3>
                <div className={styles.statValue} style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <p className={styles.statDescription}>{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Middle Section - Two Side by Side Boxes */}
        <div className={styles.middleSection}>
          {/* Type Distribution Box */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Hazard Type Distribution</h3>
              <span className={styles.chartSubtitle}>Breakdown by category</span>
            </div>
            <div className={styles.typeDistribution}>
              {safeTypeDistribution.length === 0 ? (
                <div className={styles.noData}>
                  <p>No type distribution data</p>
                </div>
              ) : (
                safeTypeDistribution.map((item, index) => (
                  <div key={index} className={styles.typeItem}>
                    <div className={styles.typeInfo}>
                      <div className={styles.typeColor} style={{ backgroundColor: item.color || '#6B7280' }}></div>
                      <span className={styles.typeName}>{item._id || 'Unknown'}</span>
                    </div>
                    <div className={styles.typeStats}>
                      <span className={styles.typeCount}>{item.count || 0}</span>
                      <span className={styles.typePercentage}>
                        ({Math.round(((item.count || 0) / safeTypeDistribution.reduce((sum, i) => sum + (i.count || 0), 1)) * 100)}%)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Most Reported Hazards Box */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Most Reported Hazards</h3>
              <span className={styles.chartSubtitle}>Top hazard types by reports</span>
            </div>
            <div className={styles.hazardsList}>
              {safeMostReportedHazards.length === 0 ? (
                <div className={styles.noData}>
                  <p>No hazard data available</p>
                </div>
              ) : (
                safeMostReportedHazards.map((hazard, index) => {
                  let severity;
                  if (hazard.reportCount > 80) severity = "Critical";
                  else if (hazard.reportCount > 50) severity = "High";
                  else if (hazard.reportCount > 20) severity = "Medium";
                  else severity = "Low";

                  return (
                    <div key={index} className={styles.hazardItem}>
                      <div className={styles.hazardRank}>
                        <span className={styles.rankNumber}>#{index + 1}</span>
                      </div>
                      <div className={styles.hazardInfo}>
                        <span className={styles.hazardName}>{hazard._id || 'Unknown'}</span>
                        <span className={styles.hazardReports}>{hazard.reportCount || 0} reports</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Trends Box - Fixed */}
        <div className={styles.trendsCard}>
          <div className={styles.chartHeader}>
            <h3>Reports Trend</h3>
            <span className={styles.chartSubtitle}>Monthly report statistics</span>
          </div>

          <div className={styles.trendsBars}>
            {safeTrends.length === 0 ? (
              <div className={styles.noData}>
                <p>No trend data available</p>
              </div>
            ) : (
              safeTrends.map((month, index) => {
                // Calculate bar heights based on data
                const maxReports = Math.max(...safeTrends.map(m => m.totalReports || 0), 1);
                const newReportsHeight = ((month.totalReports || 0) / maxReports) * 100;
                
                return (
                  <div key={index} className={styles.trendsBarGroup}>
                    <div className={styles.barContainer}>
                      <div 
                        className={`${styles.bar} ${styles.newReports}`}
                        style={{ 
                          height: `${Math.max(newReportsHeight, 5)}%`,
                          minHeight: '20px' // Ensure bars are visible even with low values
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

          {/* Add summary statistics */}
          {safeTrends.length > 0 && (
            <div className={styles.trendsSummary}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Total Reports</span>
                <span className={styles.summaryValue}>
                  {safeTrends.reduce((sum, month) => sum + (month.totalReports || 0), 0)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Average/Month</span>
                <span className={styles.summaryValue}>
                  {Math.round(safeTrends.reduce((sum, month) => sum + (month.totalReports || 0), 0) / safeTrends.length)}
                </span>
              </div>
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Trend</span>
                <span className={`${styles.summaryValue} ${
                  safeTrends.length > 1 ? 
                    (safeTrends[safeTrends.length - 1].totalReports > safeTrends[0].totalReports ? styles.positive : styles.negative) : 
                    ''
                }`}>
                  {safeTrends.length > 1 ? 
                    (safeTrends[safeTrends.length - 1].totalReports > safeTrends[0].totalReports ? '↑' : '↓') : 
                    '→'
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;