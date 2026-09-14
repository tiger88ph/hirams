import api from "../axios.js";

export const InventoryAPI = {
  getInventory: () => api.get("/inventory/get-inventory"),
  getAll: () => api.get("/inventory"), // keep if used elsewhere
  createInventory: (payload) => api.post("inventory", payload), // ← add this
  updateInventory: (id, payload) => api.put(`inventory/${id}`, payload),
  getHistory: (purchaseOptionId) =>
    api.get(`inventory/history?nPurchaseItemId=${purchaseOptionId}`),
  getLatestDeliveredReceipt: (params) =>
    api.get("inventory/latest-delivered-receipt", { params }),
};

export default InventoryAPI;
