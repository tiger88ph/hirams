import api from "../axios.js";

export const SupplierBankAPI = {
  getBySupplier: (supplierId) => api.get(`suppliers/${supplierId}/banks`),
  createBank: (payload) => api.post("supplier-banks", payload),
  updateBank: (id, payload) => api.put(`supplier-banks/${id}`, payload),
  deleteBank: (id) => api.delete(`supplier-banks/${id}`),
};

export default SupplierBankAPI;