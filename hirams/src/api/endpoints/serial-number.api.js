import api from "../axios.js";

export const SerialNumberAPI = {
  createSerialNumber: (payload) => api.post("serial-numbers", payload),
  // Serials sitting on one inventory row — used when a receipt/delivery line
  // is corrected down and the row's S/N have to be trimmed with it.
  getByInventory: (inventoryId) =>
    api.get(`serial-numbers/by-inventory/${inventoryId}`),
  deleteSerialNumber: (id) => api.delete(`serial-numbers/${id}`),
};

export default SerialNumberAPI;
