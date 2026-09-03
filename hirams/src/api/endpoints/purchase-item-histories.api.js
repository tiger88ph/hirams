import api from "../axios.js";

export const PurchaseItemHistoriesAPI = {
  getLatest: (payload) => api.post("purchase-item-histories/latest", payload),
  getAllForOption: (optionId) => api.get(`purchase-item-histories/option/${optionId}/all`), // new
  getLatestForOption: (optionId) => api.get(`purchase-item-histories/latest-purchase-history/${optionId}`), // new
};

export default PurchaseItemHistoriesAPI;