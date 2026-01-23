// src/api/api.js

// ✅ Auto-detect API base URL
const getAPIBaseURL = () => {
  // Priority 1: Use environment variable if set (Vite uses import.meta.env, CRA uses process.env)
  const envURL = typeof import.meta !== 'undefined' 
    ? import.meta.env.VITE_API_BASE_URL 
    : typeof process !== 'undefined' 
      ? process.env.REACT_APP_API_BASE_URL 
      : null;
  
  if (envURL) {
    return envURL;
  }
  
  // Priority 2: Detect based on hostname
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return "http://127.0.0.1:8000/api/";
  }
  
  // Priority 3: Default to production
  return "http://lgu.net.ph/apiHirams/public/api/";
};

const API_BASE_URL = getAPIBaseURL();

// Optional: Log API being used (helpful for debugging)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('🔗 Using API:', API_BASE_URL);
}

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
    return response.blob();
  },

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
    return response.blob();
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