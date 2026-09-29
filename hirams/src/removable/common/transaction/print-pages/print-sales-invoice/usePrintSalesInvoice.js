import { useEffect, useState, useRef } from "react";
import ExportAPI from "../../../../../api/endpoints/export.api.js";
import { iframeTemplate } from "./iframeSalesInvoice";

function buildSIFilename(transactionCode) {
  const code = (
    transactionCode && transactionCode !== "—" ? transactionCode : "export"
  ).replace(/[^A-Za-z0-9_-]/g, "_");
  return `SI${code}.xlsx`;
}

export default function usePrintSalesInvoice() {
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
      const raw = sessionStorage.getItem("printSI_data");
      if (!raw) throw new Error("No sales invoice data found.");
      data = JSON.parse(raw);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    ExportAPI.previewSalesInvoice({
      transaction: data.transaction,
      invoiceItems: data.invoiceItems,
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
        setError("Failed to load sales invoice preview.");
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
    win?.__printSI ? win.__printSI() : win?.print();

    printTimeoutRef.current = setTimeout(() => setPrinting(false), 2000);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const raw = sessionStorage.getItem("printSI_data");
      if (!raw) throw new Error("No sales invoice data found.");
      const data = JSON.parse(raw);

      const blob = await ExportAPI.exportSalesInvoice({
        transaction: data.transaction,
        invoiceItems: data.invoiceItems,
        assignedAOName: data.assignedAOName,
        assignedAONo: data.assignedAONo,
        transactionCode: data.transactionCode,
      });
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildSIFilename(data.transactionCode);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export sales invoice.");
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
