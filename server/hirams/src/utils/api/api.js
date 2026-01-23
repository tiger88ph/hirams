// src/api/api.js

const API_BASE_URL = "https://lgu.net.ph/apiHirams/public/api/";
// const API_BASE_URL = "http://127.0.0.1:8000/api/";

// ✅ Centralized response handler
// ✅ Centralized response handler
const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Attach HTTP status and message for easier handling in frontend
    const error = new Error(data.message || data.warning || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ✅ Reusable API methods
const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return handleResponse(response);
  },

  // New method for downloading binary files
  getBlob: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!response.ok) {
      const data = await response.text();
      const error = new Error(data || "Request failed");
      error.status = response.status;
      throw error;
    }
    return response.blob(); // return the binary file
  },
  // Add this inside your api object
  postBlob: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(text || "Request failed");
      error.status = response.status;
      throw error;
    }

    return response.blob(); // return binary file as Blob
  },

  post: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  put: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  patch: async (endpoint, data) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },
};

export default api;
