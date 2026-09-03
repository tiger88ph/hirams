import api from "../axios.js";

export const TransactionItemAPI = {
  createItem: (payload) => api.post("transaction-items", payload),
  createBulk: (transactionId, payload) =>
    api.post(`transactions/${transactionId}/items/bulk`, payload),
  updateItem: (id, payload) => api.put(`transaction-items/${id}`, payload),
  updateSpecs: (id, payload) =>
    api.put(`transaction-item/${id}/update-specs`, payload, {
      headers: { "Content-Type": "application/json" },
    }),
  updateOrder: (payload) => api.put("transactions/items/update-order", payload),
  delete: (id) => api.delete(`transaction-items/${id}`),
};

export default TransactionItemAPI;