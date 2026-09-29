import { useEffect, useState, useRef } from "react";
import VoucherAPI from "../../../../../api/endpoints/voucher.api.js";
import { iframeTemplate } from "./iframeCheque";

function buildChequeFilename(
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
    ? `CHQ${voucherNo}(${safePayee}).xlsx`
    : `CHQ${safeYear}-(${safePayee}).xlsx`;
}

export default function usePrintCheque() {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    let data;
    try {
      const raw = sessionStorage.getItem("printCheque_data");
      if (!raw) throw new Error("No cheque data found.");
      data = JSON.parse(raw);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    VoucherAPI.previewCheque({
      payeeName: data.payeeName,
      voucher: data.voucher,
      particulars: data.particulars ?? [],
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
        setError("Failed to load cheque preview.");
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
      const raw = sessionStorage.getItem("printCheque_data");
      if (!raw) throw new Error("No cheque data found.");
      const data = JSON.parse(raw);

      let year = new Date().getFullYear();
      if (data.voucher?.dtCreated) {
        const d = new Date(data.voucher.dtCreated);
        if (!isNaN(d.getTime())) year = d.getFullYear();
      }

      const blob = await VoucherAPI.exportCheque({
        payeeName: data.payeeName,
        voucher: data.voucher,
        particulars: data.particulars ?? [],
      });

      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildChequeFilename(data.voucher, data.payeeName, year);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export cheque.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    win?.__printCheque ? win.__printCheque() : win?.print();
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