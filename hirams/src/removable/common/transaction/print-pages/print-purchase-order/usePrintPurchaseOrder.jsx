import { useEffect, useState, useRef } from "react";
import PurchaseOrderAPI from "../../../../../api/endpoints/purchase-order.api.js";
import { iframeTemplate } from "./iframePurchaseOrder";

function buildPOFilename(po, transactionCode, year = new Date().getFullYear()) {
  const safeYear = String(year).replace(/[^A-Za-z0-9]/g, "_");
  const code = (
    transactionCode && transactionCode !== "—" ? transactionCode : "export"
  ).replace(/[^A-Za-z0-9_-]/g, "_");
  const poNo = po?.strPurchaseOrderNo
    ? po.strPurchaseOrderNo.replace(/[^A-Za-z0-9_-]/g, "_")
    : "";
  return poNo ? `PO${poNo}(${code}).xlsx` : `PO${safeYear}-(${code}).xlsx`;
}

export default function usePrintPurchaseOrder() {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    let data;
    try {
      const raw = sessionStorage.getItem("printPO_data");
      if (!raw) throw new Error("No purchase order data found.");
      data = JSON.parse(raw);
    } catch (e) {
      setError(e.message);
      setLoading(false);
      return;
    }

    PurchaseOrderAPI.preview({
      po: data.po,
      options: data.options,
      assignedAOName: data.assignedAOName,
      firstOption: data.firstOption,
      total: data.total,
      checkByOtherAOName: data.checkByOtherAOName,
      generalManagerName: data.generalManagerName,
      freightAmount: data.freightAmount ?? 0,
      ewtAmount: data.ewtAmount ?? 0,
    })
      .then((res) => {
        const rawHtml = typeof res === "string" ? res : res.data;
        // Inject your full exact template
        const enriched = rawHtml.includes("</head>")
          ? rawHtml.replace("</head>", iframeTemplate + "</head>")
          : iframeTemplate + rawHtml;
        setHtml(enriched);
      })
      .catch((e) => {
        console.error(e);
        setError("Failed to load purchase order preview.");
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
      const raw = sessionStorage.getItem("printPO_data");
      if (!raw) throw new Error("No purchase order data found.");
      const data = JSON.parse(raw);
      const transactionCode =
        data.firstOption?.purchase_option?.transaction_item?.transaction
          ?.strCode ?? "—";

      const blob = await PurchaseOrderAPI.export({
        po: data.po,
        options: data.options,
        assignedAOName: data.assignedAOName,
        firstOption: data.firstOption,
        total: data.total,
        checkByOtherAOName: data.checkByOtherAOName,
        generalManagerName: data.generalManagerName,
        freightAmount: data.freightAmount ?? 0,
        ewtAmount: data.ewtAmount ?? 0,
      });
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildPOFilename(data.po, transactionCode);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export purchase order.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const win = iframeRef.current?.contentWindow;
    win?.__printPO ? win.__printPO() : win?.print();
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
