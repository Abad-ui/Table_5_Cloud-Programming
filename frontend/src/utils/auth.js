// src/utils/auth.js
// Client-side user metadata helpers.
// The JWT itself lives in an HttpOnly cookie (not readable by JavaScript);
// non-sensitive user details are cached here for the UI and refreshed via /me.

export const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  sessionStorage.setItem("user", JSON.stringify(user));
};

export const clearAuth = () => {
  sessionStorage.removeItem("user");
};