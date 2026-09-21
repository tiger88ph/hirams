import api from "../axios.js";

export const InventoryAPI = {
  // inventory.api.js
  bulkCreateJev: (type, nPurchaseItemIds) =>
    api.post("/inventory/bulk-create-jev", { type, nPurchaseItemIds }),
  bulkReceiveDeliver: (payload) => api.post("inventory/bulk", payload),
  getHistoryBulk: (ids) => api.post("inventory/history-bulk", { ids }),
  bulkUpdateStatus: (ids, cStatus) =>
    api.post("inventory/bulk-status", { ids, cStatus }),
  createJevForPendingDelivered: (nPurchaseItemId) =>
    api.post("/inventory/create-jev-delivered", { nPurchaseItemId }),
  createJevForPending: (nPurchaseItemId) =>
    api.post("/inventory/create-jev", { nPurchaseItemId }),
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
