import axios from "axios";
import { ENV } from "./env";
import { getItem } from "../utils/storage/localStorage";
import { forceLogout } from "../utils/auth/logout";

// Create Axios instance
const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 120000, // optional: 30s timeout
});

// ── Request Interceptor → Attach Token ───────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // 👇 ADD THIS LINE
    console.log("📤 Axios Request:", config.method?.toUpperCase(), config.baseURL + config.url, "| Token:", token ? "YES ✅" : "NO ❌");
    return config;
  },
  (error) => Promise.reject(error)
);
// ── Helpers ────────────────────────────────────────────
const isSessionExpired = (status, data, endpoint = "") => {
  if (endpoint?.includes("login")) return false;
  return (
    status === 401 ||
    status === 419 ||
    (status === 500 && typeof data === "string" && data.includes("Route [login] not defined"))
  );
};

const createError = (data, status) => {
  const message = data?.message || data?.warning || "Request failed";
  const error = new Error(message);
  error.status = status;
  error.data = data;
  return error;
};

// ── Response Interceptor → Handle Errors & Session ────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const endpoint = error.config?.url || "";
    const status = error.response?.status;
    const data = error.response?.data;

    // Auto-logout on expired session
    if (isSessionExpired(status, data, endpoint)) {
      await forceLogout();
      return Promise.reject(createError("Session expired", status));
    }

    // Re-throw consistent error shape
    if (error.response) {
      return Promise.reject(createError(data, status));
    }
    return Promise.reject(error); // network / no response
  }
);

export default apiClient;