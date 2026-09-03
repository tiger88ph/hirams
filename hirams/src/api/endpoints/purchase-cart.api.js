import api from "../axios.js";
export const PurchaseCartAPI = {
  getAllPurchaseOrders: () => api.get("purchase-orders/get-all-purchase-orders"),
};
export default PurchaseCartAPI;