import api from "../axios.js";

export const SupplierAPI = {
  getAll: () => api.get("suppliers/all"),
  getSuppliers: () => api.get("suppliers"),
  create: (payload) => api.post("suppliers", payload),
  update: (id, payload) => api.put(`suppliers/${id}`, payload),
  updateStatus: (id, payload) => api.patch(`suppliers/${id}/status`, payload),
  delete: (id) => api.delete(`suppliers/${id}`),
};

export default SupplierAPI;