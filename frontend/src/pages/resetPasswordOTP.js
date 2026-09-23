import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./resetPasswordOTP.css";
import logo from "../assets/images/logo.png";
import { resetPassword, resendPasswordResetOTP } from "../services/userServices";
import { showToast } from "../components/Toast/Toast";

function ResetPasswordOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [step, setStep] = useState(1); // Step 1: OTP, Step 2: New Password
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const lastFilledIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastFilledIndex].focus();
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    setError("");

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    // Just move to step 2, don't verify yet
    setStep(2);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

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
      // Now send everything together: email, OTP code, and new password
      const result = await resetPassword(email, otp.join(""), newPassword);

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
        setStep(1); // Go back to step 1
        inputRefs.current[0].focus();
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
    <div className="reset-password-otp-page">
      <div className="reset-password-otp-container">
        <div className="reset-password-otp-header">
          <img src={logo} alt="HazardWatcher Logo" className="logo" />
          <h1>HazardWatcher</h1>
        </div>

        {step === 1 ? (
          <>
            <div className="section-title">Enter Reset Code</div>
            <p className="reset-instructions">
              We've sent a 6-digit reset code to <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyOTP} className="reset-password-otp-form">
              <label>Enter Verification Code</label>
              
              <div className="otp-inputs-container">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={loading}
                    className="otp-input-box"
                  />
                ))}
              </div>

              <button type="submit" disabled={loading || otp.join("").length !== 6}>
                {loading ? "Verifying..." : "Continue"}
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
              <span onClick={() => navigate("/forgot-password")}>Back to Forgot Password</span>
            </p>
          </>
        ) : (
          <>
            <div className="section-title">Create New Password</div>
            <p className="reset-instructions">
              Enter your new password below
            </p>

            <form onSubmit={handleResetPassword} className="reset-password-otp-form">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter new password"
                required
                disabled={loading}
              />

              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Confirm new password"
                required
                disabled={loading}
              />

              <button type="submit" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              {error && (
                <p className="error-message" onClick={() => setError("")}>
                  {error}
                </p>
              )}
            </form>

            <p className="back-link">
              <span onClick={() => setStep(1)}>Back to Enter Code</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordOTP;