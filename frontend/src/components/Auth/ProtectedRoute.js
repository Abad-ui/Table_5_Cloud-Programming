import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getCurrentUser } from "../../services/userServices";
import { setStoredUser, clearAuth } from "../../utils/auth";

function ProtectedRoute({ children, requireAdmin = false }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let mounted = true;

    getCurrentUser().then((result) => {
      if (!mounted) return;

      if (!result.success || !result.user) {
        clearAuth();
        setStatus("invalid");
      } else {
        setStoredUser(result.user);
        if (requireAdmin && result.user.role !== "admin") {
          setStatus("forbidden");
        } else {
          setStatus("valid");
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [requireAdmin]);

  if (status === "loading") {
    return null;
  }

  if (status === "invalid") {
    return <Navigate to="/" replace />;
  }

  if (status === "forbidden") {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;