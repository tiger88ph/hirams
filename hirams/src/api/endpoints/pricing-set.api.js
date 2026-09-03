import api from "../axios.js";

export const PricingSetAPI = {
  delete: (id) => api.delete(`pricing-sets/${id}`),
  choose: (id) => api.patch(`pricing-sets/${id}/choose`),
};

export default PricingSetAPI;