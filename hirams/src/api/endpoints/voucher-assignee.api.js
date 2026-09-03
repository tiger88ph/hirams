import api from "../axios.js";

export const VoucherAssigneeAPI = {
  create: (payload) => api.post("voucher-assignees", payload),
  update: (nVoucherAssigneeId, payload) =>
    api.put(`voucher-assignees/${nVoucherAssigneeId}`, payload),
  delete: (nVoucherAssigneeId) =>
    api.delete(`voucher-assignees/${nVoucherAssigneeId}`),
};

export default VoucherAssigneeAPI;