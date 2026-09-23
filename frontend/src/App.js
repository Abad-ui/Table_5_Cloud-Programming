import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/forgotPassword";
import ResetPasswordOTP from "./pages/resetPasswordOTP";
import VerifyOTP from "./pages/verifyOTP";
import Home from "./pages/Home";
import ReportHazard from "./pages/ReportHazards";
import ViewHazard from "./pages/ViewHazards";
import MyReports from "./pages/MyReports";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminManageReports from "./pages/admin/AdminManageReports";
import AdminManageUsers from "./pages/admin/AdminManageUsers";
import AdminViewHazards from "./pages/admin/AdminViewHazards";
import AdminAnalysis from "./pages/admin/AdminAnalysis";
import Toast from "./components/Toast/Toast";
import "./index.css";

function App() {
  return (
    <Router>
      <Toast />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP/>} />
        <Route path="/reset-password-otp" element={<ResetPasswordOTP/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        
        
        {/* User Routes */}
        <Route path="/home" element={<Home />} />
        <Route path="/report-hazard" element={<ReportHazard />} />
        <Route path="/view-hazards" element={<ViewHazard />} />
        <Route path="/my-reports" element={<MyReports />} />
        
        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-manage-reports" element={<AdminManageReports />} />
        <Route path="/admin-manage-users" element={<AdminManageUsers />} />
        <Route path="/admin-view-hazards" element={<AdminViewHazards />} />
        <Route path="/admin-analysis" element={<AdminAnalysis />} />
      </Routes>
    </Router>
  );
}

export default App;
