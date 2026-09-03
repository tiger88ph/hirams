import api from "../axios.js";

export const VoucherAPI = {
  getVouchers: () => api.get("vouchers"),
  createVoucher: (payload) => api.post("vouchers", payload),
  updateVoucherStatus: (nVoucherId, cStatus) =>
    api.patch(`vouchers/${nVoucherId}/status`, { cStatus }),
  updateVoucherForJevStatus: (nVoucherId, bIsForJev) =>
    api.patch(`vouchers/${nVoucherId}/voucher-jev-status`, { bIsForJev }),
  preview: (payload) =>
    api.post("voucher/preview", payload, { responseType: "text" }),
  export: (payload) => api.postBlob("voucher/export", payload),
  previewCheque: (payload) =>
    api.post("voucher/preview-cheque", payload, { responseType: "text" }),
  exportCheque: (payload) => api.postBlob("voucher/export-cheque", payload),
  
  createJev: (nVoucherId, data) =>
    api.post(`vouchers/${nVoucherId}/create-jev`, data),
};

export default VoucherAPI;
