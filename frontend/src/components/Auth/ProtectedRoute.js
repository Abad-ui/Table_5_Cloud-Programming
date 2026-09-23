import React from "react";
import { Navigate } from "react-router-dom";
import { getToken, decodeToken, isTokenValid, getTokenRole, clearAuth } from "../../utils/auth";

function ProtectedRoute({ children, requireAdmin = false }) {
  if (!getToken()) {
    return <Navigate to="/" replace />;
  }

  if (!isTokenValid()) {
    clearAuth();
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && getTokenRole() !== "admin") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;