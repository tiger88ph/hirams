import api from "../axios.js";

export const SerialNumberAPI = {
  createSerialNumber: (payload) => api.post("serial-numbers", payload),
};

export default SerialNumberAPI;