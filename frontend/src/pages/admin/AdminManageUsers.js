import React, { useState, useEffect } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import styles from "./AdminManageUsers.module.css";
import { useDashboard } from "../../hooks/useDashboards";
import { useUsers } from "../../hooks/useUsers";
import { showToast } from "../../components/Toast/Toast";
import { useReports } from "../../hooks/useReports";

function AdminManageUsers() {
  // Custom hooks
  const { 
    users: usersData, 
    fetchAllUsers, 
    removeUser, 
    update,
    loading: usersLoading 
  } = useUsers();
  const { 
    fetchUserReports, 
    fetchUserReportCount,
    loading: reportsLoading 
  } = useReports();

  // Local state
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserReports, setShowUserReports] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [roleUpdateConfirmation, setRoleUpdateConfirmation] = useState({
    show: false,
    user: null,
    newRole: null
  });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  // Fetch users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await fetchAllUsers();
      
      if (result.success && result.users) {
        // Only include verified users
        const verifiedUsers = result.users.filter(user => user.isVerified);

        // Fetch report counts for each verified user
        const usersWithReportCounts = await Promise.all(
          verifiedUsers.map(async (user) => {
            const reportCountResult = await fetchUserReportCount(user._id);
            
            // Normalize role for UI but keep originalRole for edge cases
            const normalizedRole = user.role === 'regular' ? 'user' : user.role;
            return {
              ...user,
              reportsCount: reportCountResult?.count || 0,
              role: normalizedRole,
              originalRole: user.role 
            };
          })
        );

        setUsers(usersWithReportCounts);
        setFilteredUsers(usersWithReportCounts);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };


  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter - handle both 'regular' and mapped 'user' roles
    if (roleFilter !== "all") {
      if (roleFilter === "user") {
        // Show both 'user' (mapped) and 'regular' (original) roles
        filtered = filtered.filter(user => user.role === 'user' || user.originalRole === 'regular');
      } else {
        filtered = filtered.filter(user => user.role === roleFilter);
      }
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, roleFilter]);

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getImageUrl = (photoUrl) => {
    if (!photoUrl) return null;
    if (photoUrl.startsWith("http")) return photoUrl;

    const baseUrl = "http://localhost:4000";
    const cleanPath = photoUrl.startsWith("/") ? photoUrl.slice(1) : photoUrl;
    return `${baseUrl}/${cleanPath}`;
  };

  const handleImageClick = (photoUrl) => {
    const fullUrl = getImageUrl(photoUrl);
    setSelectedImage(fullUrl);
    setShowImageModal(true);
  };

  const handleViewReports = async (user) => {
    setSelectedUser(user);
    setLoading(true);
    try {
      console.log("Fetching reports for user:", user._id, user.username);
      const result = await fetchUserReports(user._id);
      console.log("User reports API response:", result);
      
      if (result.success) {
        setUserReports(result.reports || []);
        setShowUserReports(true);
        console.log("Successfully set user reports:", result.reports);
      } else {
        console.error("Failed to fetch user reports:", result.message);
        setUserReports([]);
        showToast(`Failed to fetch reports: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Error fetching user reports:", error);
      setUserReports([]);
      showToast('Error fetching reports. Please try again.', "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewImage = (imageUrl) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleUpdateRole = (user, newRole) => {
    setRoleUpdateConfirmation({
      show: true,
      user,
      newRole
    });
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const result = await removeUser(selectedUser._id);
      if (result.success) {
        // Update local state
        const updatedUsers = users.filter(user => user._id !== selectedUser._id);
        setUsers(updatedUsers);
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        console.error("Failed to delete user:", result.message);
        showToast(`Failed to delete user: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast('Error deleting user. Please try again.', "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmUpdateRole = async () => {
    const { user, newRole } = roleUpdateConfirmation;
    if (!user) return;

    setLoading(true);
    try {
      // Convert back to database role format if needed
      const dbRole = newRole === 'user' ? 'regular' : newRole;
      
      const result = await update(user._id, { role: dbRole });
      if (result.success) {
        // Update local state
        const updatedUsers = users.map(u => {
          if (u._id === user._id) {
            return { 
              ...u, 
              role: newRole,
              originalRole: dbRole // Store original format for reference
            };
          }
          return u;
        });

        setUsers(updatedUsers);
        setRoleUpdateConfirmation({ show: false, user: null, newRole: null });
        setShowRoleModal(false);
        setSelectedUser(null);
      } else {
        console.error("Failed to update user role:", result.message);
        showToast(`Failed to update role: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast('Error updating role. Please try again.', "error");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return styles.roleAdmin;
      case 'user': return styles.roleUser;
      default: return styles.roleUser;
    }
  };

  const getReportsBadgeClass = (count) => {
    if (count === 0) return styles.reportsNone;
    if (count <= 5) return styles.reportsLow;
    if (count <= 10) return styles.reportsMedium;
    return styles.reportsHigh;
  };

  // Calculate stats from actual data
  const totalUsers = users.length;
  const regularUsers = users.filter(u => u.role === 'user' || u.role === 'regular').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const totalReports = users.reduce((total, user) => total + (user.reportsCount || 0), 0);

  if (loading && users.length === 0) {
    return (
      <div className={styles.adminLayout}>
        <AdminSidebar />
        <div className={styles.adminMainContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading users...</p>
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
          <h1>Manage Users</h1>
          <p>View and manage user accounts and permissions</p>
        </div>

        {/* Statistics Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>👥</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Total Users</div>
              <div className={styles.statValue}>{totalUsers}</div>
              <div className={styles.statDescription}>All registered users</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>👤</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Regular Users</div>
              <div className={styles.statValue}>{regularUsers}</div>
              <div className={styles.statDescription}>Standard users</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>🛡️</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Admin Users</div>
              <div className={styles.statValue}>{adminUsers}</div>
              <div className={styles.statDescription}>Administrative users</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIconWrapper}>
              <div className={styles.statIcon}>📊</div>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statTitle}>Total Reports</div>
              <div className={styles.statValue}>{totalReports}</div>
              <div className={styles.statDescription}>All user reports</div>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className={styles.filtersSection}>
          <div className={styles.searchGroup}>
            <input
              type="text"
              placeholder="🔍 Search by username or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="role-filter" className={styles.filterLabel}>
              🛡️ Filter by Role
            </label>
            <select 
              id="role-filter"
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div className={styles.resultsInfo}>
            <span className={styles.resultsCount}>
              📊 Showing {filteredUsers.length} of {users.length} users
            </span>
          </div>

          <button 
            className={styles.refreshButton}
            onClick={loadUsers}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {/* Pagination Info */}
        <div className={styles.paginationInfo}>
          <span className={styles.paginationText}>
            Page {currentPage} of {totalPages} • 
            Showing {currentUsers.length} users 
            ({indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length})
          </span>
        </div>

        {/* Users Table */}
        <div className={styles.usersTable}>
          <div className={styles.tableHeader}>
          <div className={styles.tableRow}>
            <div className={styles.colUser}>User</div>
            <div className={styles.colRole}>Role</div>
            <div className={styles.colReports}>Reports</div>
            <div className={styles.colJoined}>Joined</div>
            <div className={styles.colActions}>Actions</div>
          </div>
        </div>

        <div className={styles.tableBody}>
          {currentUsers.map((user) => (
            <div key={user._id} className={styles.tableRow}>
              <div className={styles.colUser}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className={styles.userDetails}>
                    <div className={styles.username}>{user.username || "Unknown"}</div>
                    <div className={styles.userEmail}>{user.email || "No email"}</div>
                  </div>
                </div>
              </div>

              <div className={styles.colRole}>
                <span className={`${styles.roleBadge} ${getRoleBadgeClass(user.role)}`}>
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || "User"}
                </span>
              </div>

              <div className={styles.colReports}>
                <span className={`${styles.reportsBadge} ${getReportsBadgeClass(user.reportsCount || 0)}`}>
                  {user.reportsCount || 0} reports
                </span>
              </div>

              <div className={styles.colJoined}>
                <div className={styles.joinDate}>{formatDate(user.createdAt)}</div>
                {/*<div className={styles.lastActive}>
                  Last active: {formatDateTime(user.lastActive || user.updatedAt)}
                </div>*/}
              </div>

              <div className={styles.colActions}>
                <div className={styles.actionButtons}>
                  <button className={styles.viewReportsBtn} onClick={() => handleViewReports(user)}>
                    📋 Reports
                  </button>
                  <button
                    className={styles.updateRoleBtn}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowRoleModal(true);
                    }}
                  >
                    🛡️ Role
                  </button>
                  <button
                    className={styles.deleteUserBtn}
                    onClick={() => handleDeleteUser(user)}
                    disabled={user.role === "admin"}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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

        {/* User Reports Modal */}
        {showUserReports && selectedUser && (
          <div className={styles.modalOverlay} onClick={() => setShowUserReports(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>{selectedUser.username}'s Reports ({userReports.length})</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowUserReports(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <div className={styles.userReportsList}>
                  {userReports.length === 0 ? (
                    <div className={styles.noReports}>
                      <p>No reports found for this user.</p>
                    </div>
                  ) : (
                    userReports.map((report) => (
                      <div key={report._id} className={styles.reportItem}>
                        <div className={styles.reportHeader}>
                          <span className={styles.reportCategory}>
                            {report.category || 'General'} - {report.subtype || 'Hazard'}
                          </span>
                          <span className={`${styles.reportStatus} ${styles[report.verifiedStatus] || styles.pending}`}>
                            {report.verifiedStatus || 'pending'}
                          </span>
                        </div>
                        <div className={styles.reportDescription}>
                          {report.description || 'No description provided'}
                        </div>
                        <div className={styles.reportMeta}>
                          <span>Status: {report.fixedStatus || 'not fixed'}</span>
                          <span>Submitted: {formatDate(report.createdAt)}</span>
                          <span>Location: {report.location?.lat?.toFixed(4)}, {report.location?.lng?.toFixed(4)}</span>
                        </div>
                        {report.photoUrl && (
                          <div className={styles.reportPhoto}>
                            <button
                              className={styles.viewImageBtn}
                              onClick={() => handleImageClick(report.photoUrl)}
                            >
                              View Image
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image View Modal */}
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
                  alt="Report full size"
                  className={styles.fullSizeImage}
                  onError={(e) => {
                    console.error("Full size image failed to load:", selectedImage);
                    e.target.style.display = "none";
                    const errorDiv = document.createElement("div");
                    errorDiv.className = styles.imageError;
                    errorDiv.textContent = "Failed to load image";
                    e.target.parentNode.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {showDeleteModal && selectedUser && (
          <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Delete User</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowDeleteModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <p>
                  Are you sure you want to delete user <strong>{selectedUser.username}</strong>?
                </p>
                <p className={styles.warningText}>
                  This action cannot be undone. All user data and reports will be permanently deleted.
                </p>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmDeleteBtn}
                  onClick={confirmDeleteUser}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Update Role Selection Modal */}
        {showRoleModal && selectedUser && (
          <div className={styles.modalOverlay} onClick={() => setShowRoleModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Update User Role</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowRoleModal(false)}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <p>
                  Select new role for <strong>{selectedUser.username}</strong>:
                </p>
                <div className={styles.roleOptions}>
                  <button 
                    className={`${styles.roleOption} ${selectedUser.role === 'user' ? styles.roleOptionActive : ''}`}
                    onClick={() => handleUpdateRole(selectedUser, 'user')}
                  >
                    <div className={styles.roleOptionTitle}>👤 User</div>
                    <div className={styles.roleOptionDesc}>Can submit and view reports</div>
                  </button>
                  <button 
                    className={`${styles.roleOption} ${selectedUser.role === 'admin' ? styles.roleOptionActive : ''}`}
                    onClick={() => handleUpdateRole(selectedUser, 'admin')}
                  >
                    <div className={styles.roleOptionTitle}>🛡️ Admin</div>
                    <div className={styles.roleOptionDesc}>Full system access</div>
                  </button>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Update Confirmation Modal */}
        {roleUpdateConfirmation.show && roleUpdateConfirmation.user && (
          <div className={styles.modalOverlay} onClick={() => setRoleUpdateConfirmation({ show: false, user: null, newRole: null })}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>Confirm Role Update</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setRoleUpdateConfirmation({ show: false, user: null, newRole: null })}
                >
                  ×
                </button>
              </div>
              <div className={styles.modalContent}>
                <p>
                  Are you sure you want to update <strong>{roleUpdateConfirmation.user.username}</strong>'s role from{' '}
                  <strong>{roleUpdateConfirmation.user.role}</strong> to <strong>{roleUpdateConfirmation.newRole}</strong>?
                </p>
                <div className={styles.roleChangeInfo}>
                  <div className={styles.currentRole}>
                    <strong>Current Role:</strong> {roleUpdateConfirmation.user.role}
                  </div>
                  <div className={styles.newRole}>
                    <strong>New Role:</strong> {roleUpdateConfirmation.newRole}
                  </div>
                  {roleUpdateConfirmation.newRole === 'admin' && (
                    <div className={styles.adminWarning}>
                      ⚠️ This user will gain full administrative access to the system.
                    </div>
                  )}
                  {roleUpdateConfirmation.newRole === 'user' && roleUpdateConfirmation.user.role === 'admin' && (
                    <div className={styles.userWarning}>
                      ⚠️ This user will lose administrative privileges.
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.modalActions}>
                <button 
                  className={styles.cancelBtn}
                  onClick={() => setRoleUpdateConfirmation({ show: false, user: null, newRole: null })}
                >
                  Cancel
                </button>
                <button 
                  className={styles.confirmUpdateBtn}
                  onClick={confirmUpdateRole}
                >
                  Confirm Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminManageUsers;