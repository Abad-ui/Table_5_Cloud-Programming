import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Modal from "../Modal/Modal";
import logo from "../../assets/images/logo.png";
import styles from "./Sidebar.module.css";

function Sidebar({ isOpen: controlledOpen, onToggle, showBurger = true, belowBar = false }) {
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
    { name: "📊 Home", path: "/home" },
    { name: "📝 Report Hazard", path: "/report-hazard" },
    { name: "⚠️ View Hazards", path: "/view-hazards" },
    { name: "📋 My Reports", path: "/my-reports" },
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

      <div className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""} ${belowBar ? styles.sidebarBelowBar : ""}`}>
        {/* Header with Logo and Title */}
        <div className={styles.sidebarHeader}>
          <img src={logo} alt="HazardWatcher Logo" className={styles.sidebarLogo} />
          <div className={styles.headerText}>
            <h1 className={styles.sidebarTitle}>HazardWatcher</h1>
            <span className={styles.userBadge}>User</span>
          </div>
        </div>

        <nav>
          <ul>
            {navItems.map((item) => (
              <li
                key={item.path}
                className={location.pathname === item.path ? styles.active : ""}
              >
                <Link to={item.path} className={styles.sidebarLink}>
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout button */}
        <div className={styles.logoutContainer}>
          <button onClick={handleLogout} className={`${styles.sidebarLink} ${styles.logoutBtn}`}>
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

export default Sidebar;