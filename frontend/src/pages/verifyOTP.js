import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./verifyOTP.css";
import logo from "../assets/images/logo.png";
import { verifyOTP, resendOTP } from "../services/userServices";
import { showToast } from "../components/Toast/Toast";

function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [timer, setTimer] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);

    try {
      const result = await verifyOTP(email, otp);

      if (result.success) {
        showToast("Account verified successfully! You can now login.", "success");
        navigate("/");
      } else {
        setError(result.message || "Verification failed");
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
      const result = await resendOTP(email);

      if (result.success) {
        setResendMessage("New code sent! Check your email.");
        setTimer(60); // 60 second cooldown
      } else {
        setError(result.message || "Failed to resend code");
      }
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only numbers
    if (value.length <= 6) {
      setOtp(value);
      setError("");
    }
  };

  return (
    <div className="verify-otp-page">
      <div className="verify-otp-container">
        <div className="verify-otp-header">
          <img src={logo} alt="HazardWatcher Logo" className="logo" />
          <h1>HazardWatcher</h1>
        </div>

        <div className="section-title">Verify Your Email</div>

        <p className="verify-instructions">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="verify-otp-form">
          <label>Verification Code</label>
          <input
            type="text"
            value={otp}
            onChange={handleInputChange}
            placeholder="000000"
            maxLength={6}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify Account"}
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
          Wrong email? <span onClick={() => navigate("/register")}>Go back</span>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;