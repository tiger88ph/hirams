import api from "../axios.js";

export const PurchaseOptionAPI = {
  createOption: (payload) => api.post("purchase-options", payload),
  updateOption: (id, payload) => api.put(`purchase-options/${id}`, payload),
  updateSpecs: (id, payload) =>
    api.put(`purchase-options/${id}/update-specs`, payload, {
      headers: { "Content-Type": "application/json" },
    }),
  getSuggestions: (params) => api.get(`purchase-options/suggestions?${params}`),
  calculateEWT: (payload) =>
    api.post("purchase-options/calculate-ewt", payload),
  delete: (id) => api.delete(`purchase-options/${id}`),
};

export default PurchaseOptionAPI;
