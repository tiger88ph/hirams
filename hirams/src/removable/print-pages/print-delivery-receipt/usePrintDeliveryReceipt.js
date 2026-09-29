import { useEffect, useState, useRef } from "react";
import ExportAPI from "../../../../../api/endpoints/export.api.js";
import { iframeTemplate } from "./iframeDeliveryReceipt";

function buildDRFilename(
  transactionCode,
  receiptNumber,
  year = new Date().getFullYear(),
) {
  const safeYear = String(year).replace(/[^A-Za-z0-9]/g, "_");
  const code = (
    transactionCode && transactionCode !== "—" ? transactionCode : "export"
  ).replace(/[^A-Za-z0-9_-]/g, "_");
  const receipt = receiptNumber
    ? receiptNumber.replace(/[^A-Za-z0-9_-]/g, "_")
    : "";
  return receipt
    ? `DR${receipt}(${code}).xlsx`
    : `DR${safeYear}-(${code}).xlsx`;
}

export default function usePrintDeliveryReceipt() {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const iframeRef = useRef(null);
  const printTimeoutRef = useRef(null);

  useEffect(() => {
    let data;
    try {
      const raw = sessionStorage.getItem("printDR_data");
      if (!raw) throw new Error("No delivery receipt data found.");
      data = JSON.parse(raw);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    ExportAPI.previewDeliveryReceipt({
      transaction: data.transaction,
      deliveredOptions: data.deliveredOptions,
      assignedAOName: data.assignedAOName,
      assignedAONo: data.assignedAONo,
      transactionCode: data.transactionCode,
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
        setError("Failed to load delivery receipt preview.");
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

  const handlePrint = () => {
    if (printing) return;
    setPrinting(true);
    if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);

    const win = iframeRef.current?.contentWindow;
    win?.__printDR ? win.__printDR() : win?.print();

    printTimeoutRef.current = setTimeout(() => setPrinting(false), 2000);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const raw = sessionStorage.getItem("printDR_data");
      if (!raw) throw new Error("No delivery receipt data found.");
      const data = JSON.parse(raw);
      const receiptNumber = data.receiptNumber ?? "";

      const blob = await ExportAPI.exportDeliveryReceipt({
        transaction: data.transaction,
        deliveredOptions: data.deliveredOptions,
        assignedAOName: data.assignedAOName,
        assignedAONo: data.assignedAONo,
        transactionCode: data.transactionCode,
        receiptNumber,
      });
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildDRFilename(data.transactionCode, receiptNumber);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export delivery receipt.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
    };
  }, []);

  return {
    html,
    error,
    loading,
    printing,
    exporting,
    iframeRef,
    handlePrint,
    handleExport,
  };
}
