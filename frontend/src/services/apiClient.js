// src/services/apiClient.js
// Shared axios instance - always sends cookies (HttpOnly auth token) with requests.
import axios from "axios";

const apiClient = axios.create({
  withCredentials: true,
});

export default apiClient;