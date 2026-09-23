import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./forgotPassword.css";
import logo from "../assets/images/logo.png";
import { requestPasswordReset, resetPassword, resendPasswordResetOTP } from "../services/userServices";
import { showToast } from "../components/Toast/Toast";

function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  // Countdown timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Step 1: Send reset code to email
  const handleSendResetCode = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await requestPasswordReset(email);

      if (result.success) {
        setStep(2); // Move to OTP step
        setTimer(60); // Start 60 second timer for resend
      } else {
        setError(result.message || "Failed to send reset code");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Step 2: Verify OTP and reset password (all in one step like the image)
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const result = await resetPassword(email, otpCode, newPassword);

      if (result.success) {
        showToast("Password reset successfully! You can now login with your new password.", "success");
        navigate("/");
      } else {
        setError(result.message || "Failed to reset password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Resend OTP
  const handleResendOTP = async () => {
    setResendLoading(true);
    setResendMessage("");
    setError("");

    try {
      const result = await resendPasswordResetOTP(email);

      if (result.success) {
        setResendMessage("New code sent! Check your email.");
        setTimer(60);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError(result.message || "Failed to resend code");
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-header">
          <img src={logo} alt="HazardWatcher Logo" className="logo" />
          <h1>HazardWatcher</h1>
        </div>

        {step === 1 && (
          <>
            <div className="section-title">Forgot Password</div>
            <p className="forgot-instructions">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>

            <form onSubmit={handleSendResetCode} className="forgot-password-form">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter your email"
                required
                disabled={loading}
              />

              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Code"}
              </button>

              {error && (
                <p className="error-message" onClick={() => setError("")}>
                  {error}
                </p>
              )}
            </form>

            <p className="back-link">
              Remember your password? <Link to="/">Back to Login</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="section-title">Recovery Password</div>
            <p className="forgot-instructions">
              We've sent a 6-digit verification code to <strong>{email}</strong>. Enter the code and your new password below.
            </p>

            <form onSubmit={handleVerifyOTP} className="forgot-password-form">
              <label>Verification Code</label>
              <input
                type="text"
                value={otp.join("")}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  const newOtp = value.split("").concat(Array(6 - value.length).fill(""));
                  setOtp(newOtp);
                  setError("");
                }}
                placeholder="Enter 6-digit code from email"
                required
                disabled={loading}
                maxLength={6}
              />

              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                >
                  <span className="password-toggle-icon">
                    {showNewPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1742 15.0074 10.8016 14.8565C10.4291 14.7056 10.0827 14.4811 9.78087 14.1944C9.47903 13.9078 9.22676 13.5636 9.03677 13.1796C8.84678 12.7956 8.72235 12.3782 8.66997 11.9491C8.6176 11.5201 8.63829 11.0862 8.73073 10.6642C8.82317 10.2422 8.98573 9.83889 9.21087 9.47363" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </button>
              </div>

              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  <span className="password-toggle-icon">
                    {showConfirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1742 15.0074 10.8016 14.8565C10.4291 14.7056 10.0827 14.4811 9.78087 14.1944C9.47903 13.9078 9.22676 13.5636 9.03677 13.1796C8.84678 12.7956 8.72235 12.3782 8.66997 11.9491C8.6176 11.5201 8.63829 11.0862 8.73073 10.6642C8.82317 10.2422 8.98573 9.83889 9.21087 9.47363" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </button>
              </div>

              <button type="submit" disabled={loading || otp.join("").length !== 6 || !newPassword || !confirmPassword}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              {error && (
                <p className="error-message" onClick={() => setError("")}>
                  {error}
                </p>
              )}
              {resendMessage && <p className="success-message">{resendMessage}</p>}
            </form>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              {timer > 0 ? (
                <p className="resend-timer">Resend available in {timer}s</p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={resendLoading}
                  className="resend-button"
                >
                  {resendLoading ? "Sending..." : "Resend Code"}
                </button>
              )}
            </div>

            <p className="back-link">
              <span onClick={() => setStep(1)}>Back to Enter Email</span>
            </p>
          </>
        )}

      </div>
    </div>
  );
}

export default ForgotPassword;