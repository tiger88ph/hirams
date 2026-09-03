import api from "../axios.js";

export const DirectCostAPI = {
  // getDirectCosts: () => api.get("direct-cost-options"),

  getByTransaction: (transactionId, params = "") =>
    api.get(`direct-cost?nTransactionID=${transactionId}${params}`),
  createDirectCost: (payload) => api.post("direct-cost", payload),
  updateDirectCost: (id, payload) => api.put(`direct-cost/${id}`, payload),
  deleteDirectCost: (id) => api.delete(`direct-cost/${id}`),
  getDirectCosts: (params) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`direct-cost?${query}`);
  },
};

export default DirectCostAPI;
