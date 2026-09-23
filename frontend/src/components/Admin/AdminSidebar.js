import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Modal from "../Modal/Modal";
import logo from "../../assets/images/logo.png";
import styles from "./AdminSidebar.module.css";

function AdminSidebar({ isOpen: controlledOpen, onToggle, showBurger = true, belowBar = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : isOpen;
  const setOpen = (value) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setIsOpen(value);
    }
  };

  useEffect(() => {
    if (controlledOpen === undefined) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowModal(false);
    navigate("/");
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  const navItems = [
    { name: "📊 Dashboard", path: "/admin-dashboard" },
    { name: "📝 Manage Reports", path: "/admin-manage-reports" },
    { name: "👥 Manage Users", path: "/admin-manage-users" },
    { name: "⚠️ View Hazards", path: "/admin-view-hazards" },
    { name: "📈 Analytics", path: "/admin-analysis" },
  ];

  const toggleMenu = () => setOpen(!open);

  return (
    <>
      {showBurger && (
        <button
          type="button"
          className={`${styles.burger} ${open ? styles.burgerOpen : ""}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          <span className={styles.burgerIcon}>{open ? "✕" : "☰"}</span>
        </button>
      )}

      <div className={`${styles.adminSidebar} ${open ? styles.adminSidebarOpen : ""} ${belowBar ? styles.adminSidebarBelowBar : ""}`}>
        {/* Admin Header with Logo and Title */}
        <div className={styles.adminSidebarHeader}>
          <img src={logo} alt="HazardWatcher Logo" className={styles.adminSidebarLogo} />
          <div className={styles.adminHeaderText}>
            <h1 className={styles.adminSidebarTitle}>HazardWatcher</h1>
            <span className={styles.adminBadge}>Admin</span>
          </div>
        </div>

        <nav>
          <ul>
            {navItems.map((item) => (
              <li
                key={item.path}
                className={location.pathname === item.path ? styles.active : ""}
              >
                <Link to={item.path} className={styles.adminSidebarLink}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button with same structure as links */}
        <div className={styles.adminLogoutContainer}>
          <button onClick={handleLogout} className={`${styles.adminSidebarLink} ${styles.adminLogoutBtn}`}>
            🚪 Logout
          </button>
        </div>
      </div>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <Modal
        isOpen={showModal}
        title="Confirm Logout"
        message="Are you sure you want to logout?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
}

export default AdminSidebar;