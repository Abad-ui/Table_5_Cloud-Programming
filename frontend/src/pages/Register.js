import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import logo from "../assets/images/logo.png";
import { useUsers } from "../hooks/useUsers";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();

  const { register, loading, error, clearError } = useUsers();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    const result = await register(username, email, password);

    if (result?.success) {
      navigate("/verify-otp", { state: { email } });
    }
  };

  const handleInputChange = (setter) => (e) => {
    if (error) clearError();
    setter(e.target.value);
  };

  return (
    <div className={styles.registerPage}>
      <div className={styles.registerContainer}>
        {/* Header: Logo + Title */}
        <div className={styles.registerHeader}>
          <img src={logo} alt="HazardWatcher Logo" className={styles.logo} />
          <h1>HazardWatcher</h1>
        </div>

        {/* Section Title */}
        <div className={styles.sectionTitle}>Create Account</div>

        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={handleInputChange(setUsername)}
            placeholder="Enter your username"
            required
            disabled={loading}
          />

          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={handleInputChange(setEmail)}
            placeholder="Enter your email"
            required
            disabled={loading}
          />

          <label>Password</label>
          <div className={styles.passwordInputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handleInputChange(setPassword)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              <span className={styles.passwordToggleIcon}>
                {showPassword ? (
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
          <div className={styles.passwordInputWrapper}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={handleInputChange(setConfirmPassword)}
              placeholder="Confirm your password"
              required
              disabled={loading}
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              <span className={styles.passwordToggleIcon}>
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

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          {passwordError && (
            <p className={styles.errorMessage} onClick={() => setPasswordError("")}>
              {passwordError}
            </p>
          )}

          {error && (
            <p className={styles.errorMessage} onClick={clearError}>
              {error}
            </p>
          )}
        </form>

        <p className={styles.loginLink}>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;