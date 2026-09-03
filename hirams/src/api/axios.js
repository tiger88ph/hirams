import apiClient from "../config/axiosConfig";

const api = {
  get: async (endpoint, config = {}) => {  // ✅ Accept config argument
    const res = await apiClient.get(endpoint, config); // ✅ Pass it through!
    return res.data;
  },

  getBlob: async (endpoint, config = {}) => {
    const res = await apiClient.get(endpoint, { responseType: "blob", ...config });
    return res.data;
  },

  postBlob: async (endpoint, data, config = {}) => {
    const res = await apiClient.post(endpoint, data, {
      responseType: "blob",
      signal: config.signal,
    });
    return res.data;
  },

  post: async (endpoint, data, config = {}) => {
    const res = await apiClient.post(endpoint, data, config);
    return res.data;
  },

  put: async (endpoint, data, config = {}) => {
    const res = await apiClient.put(endpoint, data, config);
    return res.data;
  },

  patch: async (endpoint, data, config = {}) => { // ✅ Also add config here
    const res = await apiClient.patch(endpoint, data, config);
    return res.data;
  },

  delete: async (endpoint, config = {}) => { // ✅ Also add config here
    const res = await apiClient.delete(endpoint, config);
    return res.data;
  },
};

export default api;