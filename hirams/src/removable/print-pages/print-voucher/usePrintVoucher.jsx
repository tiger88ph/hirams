import { useEffect, useState, useRef } from "react";
import VoucherAPI from "../../../../../api/endpoints/voucher.api.js";
import { iframeTemplate } from "./iframeVoucher";

function buildVoucherFilename(
  voucher,
  payeeName,
  year = new Date().getFullYear(),
) {
  const sanitize = (s) => String(s ?? "").replace(/[^A-Za-z0-9_-]/g, "_");
  const safeYear = sanitize(year);
  const safePayee =
    payeeName && payeeName !== "—" ? sanitize(payeeName) : "export";
  const voucherNo = voucher?.strNumber ? sanitize(voucher.strNumber) : "";
  return voucherNo
    ? `DV${voucherNo}(${safePayee}).xlsx`
    : `DV${safeYear}-(${safePayee}).xlsx`;
}

export default function usePrintVoucher() {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    let data;
    try {
      const raw = sessionStorage.getItem("printVoucher_data");
      if (!raw) throw new Error("No voucher data found.");
      data = JSON.parse(raw);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    VoucherAPI.preview({
      payeeName: data.payeeName,
      supplierTIN: data.supplierTIN,
      supplierAddress: data.supplierAddress,
      voucher: data.voucher,
      isAssigneeType: data.isAssigneeType,
      particulars: data.particulars,
      cPaymentTerms: data.cPaymentTerms,
      strTitle: data.strTitle,
      ewtAmount: data.ewtAmount,
      jevParticulars: data.jevParticulars,
    })
      .then((res) => {
        const rawHtml = typeof res === "string" ? res : res.data;
        const enriched = rawHtml.includes("</head>")
          ? rawHtml.replace("</head>", iframeTemplate + "</head>")
          : iframeTemplate + rawHtml;
        setHtml(enriched);
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load voucher preview.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!html || !iframeRef.current) return;
    const doc = iframeRef.current.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const raw = sessionStorage.getItem("printVoucher_data");
      if (!raw) throw new Error("No voucher data found.");
      const data = JSON.parse(raw);
      const year = data.voucher?.dtCreated
        ? new Date(data.voucher.dtCreated).getFullYear()
        : new Date().getFullYear();
      const blob = await VoucherAPI.export({
        payeeName: data.payeeName,
        supplierTIN: data.supplierTIN,
        supplierAddress: data.supplierAddress,
        voucher: data.voucher,
        isAssigneeType: data.isAssigneeType,
        particulars: data.particulars,
        cPaymentTerms: data.cPaymentTerms,
        strTitle: data.strTitle,
        ewtAmount: data.ewtAmount,
        jevParticulars: data.jevParticulars,
      });
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildVoucherFilename(data.voucher, data.payeeName, year);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export voucher.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    win?.__printVoucher ? win.__printVoucher() : win?.print();
  };

  return {
    html,
    error,
    loading,
    exporting,
    iframeRef,
    handleExport,
    handlePrint,
  };
}
