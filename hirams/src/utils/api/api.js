import { forceLogout } from "../../utils/auth/logout";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getToken = () => localStorage.getItem("token");

const authHeaders = (extra = {}) => ({
  "Content-Type": "application/json",
  "Accept": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const isSessionExpired = (status, data, endpoint = "") => {
  if (endpoint.includes("login")) return false; // ✅ never treat login errors as session expiry
  return (
    status === 401 ||
    status === 419 ||
    (status === 500 && typeof data === "string" && data.includes("Route [login] not defined"))
  );
};

const handleResponse = async (response, endpoint = "") => {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (isSessionExpired(response.status, data, endpoint)) { // ✅ pass endpoint
    await forceLogout();
    return;
  }

  if (!response.ok) {
    const error = new Error(data.message || data.warning || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};
const handleBlobResponse = async (response) => {
  if (isSessionExpired(response.status, "")) {
    await forceLogout();
    return;
  }
  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || "Request failed");
    error.status = response.status;
    throw error;
  }
  return response.blob();
};

const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers: authHeaders() });
    return handleResponse(response);
  },

  getBlob: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers: authHeaders() });
    return handleBlobResponse(response);
  },

  postBlob: async (endpoint, data, config = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
      signal: config.signal,
    });
    return handleBlobResponse(response);
  },

post: async (endpoint, data) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response, endpoint); // ✅ pass endpoint
},

  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  patch: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return handleResponse(response);
  },
};

export default api;