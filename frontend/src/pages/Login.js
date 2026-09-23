import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Login.module.css";
import logo from "../assets/images/logo.png";
import { useUsers } from "../hooks/useUsers";
import { getCurrentUser } from "../services/userServices";
import { setStoredUser, clearAuth } from "../utils/auth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { login, loading, error, clearError } = useUsers();

  // If a valid session cookie exists, skip the login form (handles back/refresh)
  useEffect(() => {
    let mounted = true;

    getCurrentUser().then((result) => {
      if (!mounted) return;

      if (result.success && result.user) {
        setStoredUser(result.user);
        navigate(result.user.role === "admin" ? "/admin-dashboard" : "/home", { replace: true });
      } else {
        clearAuth();
      }
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);

    if (result?.success) {
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/home");
      }
    }
  };

  const handleInputChange = (setter) => (e) => {
    if (error) clearError();
    setter(e.target.value);
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <img src={logo} alt="HazardWatcher Logo" className={styles.logo} />
          <h1>HazardWatcher</h1>
        </div>

        <div className={styles.sectionTitle}>Login</div>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
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

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <p className={styles.errorMessage} onClick={clearError}>
              {error}
            </p>
          )}
        </form>

        {/* Forgot Password Link */}
        <p className={styles.forgotPasswordLink}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </p>

        <p className={styles.registerLink}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;