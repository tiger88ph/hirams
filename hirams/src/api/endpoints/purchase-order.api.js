import api from "../axios.js";

export const PurchaseOrderAPI = {
  syncStatus: (payload) => api.post("purchase-order/sync-status", payload),
  removeFromCart: (payload) =>
    api.post("purchase-order/remove-from-cart", payload),
  addToCart: (payload) => api.post("purchase-order/add-to-cart", payload),
  // ✅ Ensure params are passed correctly
  getBySupplier: (params) => api.get(`purchase-orders/by-supplier`, { params }),
  updateCartStatusBulk: (payload) =>
    api.patch("purchase-orders/update-cart-status-bulk", payload),
  updateCartStatus: (payload) =>
    api.patch("purchase-orders/update-cart-status", payload),
  proceedToPODetails: (payload) =>
    api.patch("purchase-orders/proceed-to-po-details", payload),
  preview: (payload) =>
    api.post("purchase-order/preview", payload, { responseType: "text" }),
  export: (payload) => api.postBlob("purchase-order/export", payload),
};

export default PurchaseOrderAPI;
