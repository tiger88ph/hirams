import api from "../axios.js";

export const ExportAPI = {
  exportPricingReport: (payload, options) =>
    api.postBlob("export-pricing-report", payload, options),
  previewSalesInvoice: (payload) =>
    api.post("export/preview-si", payload, { responseType: "text" }),
  exportSalesInvoice: (payload) => api.postBlob("export/export-si", payload),
  previewDeliveryReceipt: (payload) =>
    api.post("export/preview-dr", payload, { responseType: "text" }),
  exportDeliveryReceipt: (payload) => api.postBlob("export/export-dr", payload),
};

export default ExportAPI;