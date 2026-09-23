import React, { useState } from "react";
import logo from "../../assets/images/logo.png";
import "./TopBar.css";

function TopBar({ title }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, message: "New hazard reported in your area", time: "5 min ago", read: false },
    { id: 2, message: "Flood warning issued for Dagupan City", time: "1 hour ago", read: false },
    { id: 3, message: "Your report has been acknowledged", time: "2 hours ago", read: true }
  ]);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <img src={logo} alt="HazardWatcher Logo" className="topbar-logo" />
        <h1>HazardWatcher</h1>
      </div>
      
      <div className="topbar-right">
        <div className="notification-container">
          <button 
            className="notification-btn"
            onClick={toggleNotifications}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                <span className="notification-count">{notifications.length} total</span>
              </div>
              
              <div className="notification-list">
                {notifications.map(notification => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-message">
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {notification.time}
                    </div>
                  </div>
                ))}
              </div>

              {notifications.length === 0 && (
                <div className="no-notifications">
                  No notifications
                </div>
              )}

              <div className="notification-footer">
                <button className="view-all-btn">
                  View All Notifications
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TopBar;