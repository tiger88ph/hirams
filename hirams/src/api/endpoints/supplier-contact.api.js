import api from "../axios.js";

export const SupplierContactAPI = {
  getBySupplier: (supplierId) => api.get(`suppliers/${supplierId}/contacts`),
  createContact: (payload) => api.post("supplier-contacts", payload),
  updateContact: (id, payload) => api.put(`supplier-contacts/${id}`, payload),
  deleteContact: (id) => api.delete(`supplier-contacts/${id}`),
};

export default SupplierContactAPI;