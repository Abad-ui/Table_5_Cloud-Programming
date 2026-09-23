// src/utils/auth.js
// Local, synchronous token validation helpers.
// The JWT payload contains { _id, role, exp } (signed by the backend),
// so we can check validity/role without a network round-trip.

export const getToken = () => localStorage.getItem("token");

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;

  const payload = decodeToken(token);
  if (!payload || typeof payload.exp !== "number") return false;

  return payload.exp * 1000 > Date.now();
};

export const getTokenRole = () => {
  const payload = decodeToken(getToken());
  return payload?.role || null;
};

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};