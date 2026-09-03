import api from "../axios.js";

export const PricingAPI = {
  getPricingSets: (transactionId) => api.get(`pricing-sets?nTransactionId=${transactionId}`),
  getItemPricings: (pricingSetId) => api.get(`item-pricings?pricing_set_id=${pricingSetId}`),
  updateItemPricing: (id, payload) => api.put(`item-pricings/${id}`, payload),
  bulkStoreItemPricings: (payload) => api.post("item-pricings/bulkStore", payload),
  getItemPricingTax: (params) => api.get(`item-pricings/tax?${params}`),
  createPricingSet: (payload) => api.post("pricing-sets", payload), // new
  updatePricingSet: (id, payload) => api.patch(`pricing-sets/${id}`, payload), // new
  
};

export default PricingAPI;