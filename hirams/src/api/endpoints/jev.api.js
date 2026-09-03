import api from "../axios.js";

export const JevAPI = {
  getAll: () => api.get("/jev"),
  getById: (id) => api.get(`/jev/${id}`),
  getByLink: (link) => api.get(`/jev/by-link/${link}`),
  create: (data) => api.post("/jev", data),
  update: (id, data) => api.put(`/jev/${id}`, data),
  delete: (id) => api.delete(`/jev/${id}`),
};

export default JevAPI;