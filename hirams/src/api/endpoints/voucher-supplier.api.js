import api from "../axios.js";

export const VoucherSupplierAPI = {
  create: (payload) => api.post("voucher-suppliers", payload),
  delete: (nVoucherSupplierId) =>
    api.delete(`voucher-suppliers/${nVoucherSupplierId}`),
};

export default VoucherSupplierAPI;