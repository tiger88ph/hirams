import api from "../axios.js";

export const DirectCostOptionAPI = {
  // getDirectCosts: () => api.get("direct-cost-options"),
  getDirectCostOptions: () => api.get("direct-cost-options"),
  createDirectCostOption: (payload) => api.post("direct-cost-options", payload),
  updateDirectCostOption: (id, payload) => api.put(`direct-cost-options/${id}`, payload),
  deleteDirectCostOption: (id) => api.delete(`direct-cost-options/${id}`),
  
};

export default DirectCostOptionAPI;