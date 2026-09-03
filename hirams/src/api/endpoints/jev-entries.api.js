import api from "../axios.js";

export const JevEntriesAPI = {
  getAll: () => api.get("/jev-entries"),
  getById: (id) => api.get(`/jev-entries/${id}`),
  getByJevId: (jevId) => api.get(`/jev-entries/by-jev/${jevId}`),
  create: (data) => api.post("/jev-entries", data),
  update: (id, data) => api.put(`/jev-entries/${id}`, data),
  delete: (id) => api.delete(`/jev-entries/${id}`),
};

export default JevEntriesAPI;