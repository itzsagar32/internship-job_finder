import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to automatically add JWT Bearer token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("internshala_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-handle expired/invalid sessions & network down
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401) {
        const msg =
          error.response?.data?.error || "Session expired. Please log in again.";

        // Clear stale token so the UI reflects logged-out state
        localStorage.removeItem("internshala_token");

        // Show a user-friendly alert once per page load
        if (!(window as any).__sessionExpiredShown) {
          (window as any).__sessionExpiredShown = true;
          alert(msg);
          // Redirect to home after user dismisses
          window.location.href = "/";
        }
      } else if (!error.response && error.message === "Network Error") {
        console.warn(
          "[API] Network Error: Unable to reach backend server at",
          API_BASE_URL,
          ". Make sure 'node index.js' is running in the backend folder."
        );
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
