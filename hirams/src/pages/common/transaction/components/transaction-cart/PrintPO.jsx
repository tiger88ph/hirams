import { useEffect, useState, useRef } from "react";
import api from "../../../../../utils/api/api";
// ── Filename builder: PO{YEAR}-{strPurchaseOrderNo}({transactionCode}).xlsx ──
function buildPOFilename(
  po,
  transactionCode,
  year = new Date().getFullYear(),
) {
  const safeYear = String(year).replace(/[^A-Za-z0-9]/g, "_");

  const code = (
    transactionCode && transactionCode !== "—" ? transactionCode : "export"
  ).replace(/[^A-Za-z0-9_-]/g, "_");

  const poNo = po?.strPurchaseOrderNo
    ? po.strPurchaseOrderNo.replace(/[^A-Za-z0-9_-]/g, "_")
    : "";

  return poNo
    ? `PO${poNo}(${code}).xlsx`
    : `PO${safeYear}-(${code}).xlsx`;
}

export default function PrintPO() {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false); // ← ADD THIS
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

    api
      .post(
        "purchase-order/preview",
        {
          po: data.po,
          options: data.options,
          assignedAOName: data.assignedAOName,
          firstOption: data.firstOption,
          total: data.total,
          checkByOtherAOName: data.checkByOtherAOName, // ← ADD
          generalManagerName: data.generalManagerName, // ← ADD
        },
        { responseType: "text" },
      )
      .then((res) => {
        const rawHtml = typeof res === "string" ? res : res.data;
        const injectedScript = `
  <style>
    html, body {
      margin: 0;
      padding: 0;
      background: #f1f5f9;
    }

    body > div {
      display: flex;
      justify-content: center;
      padding: 24px 0 80px;
      min-height: 100vh;
      background: #f1f5f9;
    }

    table {
      table-layout: fixed !important;
      border-collapse: collapse !important;
      background: #fff !important;
    }

    tr { overflow: hidden !important; }

    @media print {
      @page {
        margin: 10mm;
        size: A4 portrait;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body > div {
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
        display: block !important;
        width: 100% !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      table {
        table-layout: fixed !important;
        border-collapse: collapse !important;
        width: 100% !important;
        background: #fff !important;
      }
      tr { page-break-inside: avoid !important; overflow: hidden !important; }
      td, th { overflow: hidden !important; }
    }
  </style>

  <script>
    window.__printPO = function () { window.print(); };

    document.addEventListener('DOMContentLoaded', function () {
      var tables = document.querySelectorAll('table');
      tables.forEach(function (table) {

        table.style.setProperty('table-layout', 'fixed', 'important');
        table.style.setProperty('border-collapse', 'collapse', 'important');
        table.style.setProperty('background', '#fff', 'important');

        // ── Lock col widths, collapse hidden cols ───────────────────────────
        var cols = table.querySelectorAll('col');
        var colIdx = 0;
        cols.forEach(function (col) {
          var span = parseInt(col.getAttribute('span') || '1', 10);
          if (colIdx >= 10) {
            col.style.cssText = 'width:0!important;min-width:0!important;max-width:0!important;visibility:collapse!important;';
          } else {
            var w = col.style.width || '';
            if (w) {
              col.style.setProperty('width', w, 'important');
              col.style.setProperty('min-width', w, 'important');
              col.style.setProperty('max-width', w, 'important');
            }
          }
          colIdx += span;
        });

        // ── Walk rows: lock heights + fix borders + hide cols > J ──────────
        var rowspanMap = {};
        var rows = table.querySelectorAll('tr');

        rows.forEach(function (row) {
          // Lock row height
          var inlineHeight = row.style.height;
          if (inlineHeight) {
            var px = parseFloat(inlineHeight);
            if (px > 0) {
              row.style.setProperty('height',     px + 'px', 'important');
              row.style.setProperty('max-height', px + 'px', 'important');
              row.style.setProperty('min-height', px + 'px', 'important');
              row.style.setProperty('overflow',   'hidden',  'important');
            }
          }

          var logicalCol = 0;
          var cells = Array.from(row.querySelectorAll('td, th'));

          // Find the last visible cell index (last cell with logicalCol < 10)
          // We need this to fix its right border
          var lastVisibleCellIdx = -1;
          var tempCol = 0;
          var tempRowspanMap = Object.assign({}, rowspanMap);
          cells.forEach(function (cell, i) {
            while (tempRowspanMap[tempCol] && tempRowspanMap[tempCol] > 0) {
              tempRowspanMap[tempCol]--;
              tempCol++;
            }
            var cs = parseInt(cell.getAttribute('colspan') || '1', 10);
            if (tempCol < 10) lastVisibleCellIdx = i;
            tempCol += cs;
          });

          cells.forEach(function (cell, cellDomIdx) {
            while (rowspanMap[logicalCol] && rowspanMap[logicalCol] > 0) {
              rowspanMap[logicalCol]--;
              logicalCol++;
            }

            var colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            var rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);

            if (logicalCol >= 10) {
              cell.style.cssText = [
                'padding:0!important',
                'width:0!important',
                'min-width:0!important',
                'max-width:0!important',
                'border:none!important',
                'border-left:none!important',
                'border-right:none!important',
                'border-top:none!important',
                'border-bottom:none!important',
                'overflow:hidden!important',
                'background:transparent!important',
                'outline:none!important',
              ].join(';');
              cell.innerHTML = '';

            } else if (logicalCol + colspan > 10) {
              // ── Straddles boundary: clip colspan, keep right border ───────
              var allowed = 10 - logicalCol;
              cell.setAttribute('colspan', allowed);
              var w = cell.style.width;
              if (w) cell.style.setProperty('width', w, 'important');
              // This is now the last visible cell — ensure it has a right border
              // Use its existing border-right or fall back to the table's border style
              var existingBorderRight = cell.style.borderRight || cell.style.border || '';
              if (!existingBorderRight) {
                cell.style.setProperty('border-right', '1px solid #000', 'important');
              }
              for (var c = logicalCol; c < logicalCol + allowed; c++) {
                if (rowspan > 1) rowspanMap[c] = (rowspanMap[c] || 0) + (rowspan - 1);
              }
              logicalCol += allowed;
              return;

            } else {
              // ── Fully visible cell: lock dimensions, fix thin-row padding ─
              var cellW = cell.style.width;
              if (cellW) cell.style.setProperty('width', cellW, 'important');

              var cellH = cell.style.height || (inlineHeight ? inlineHeight : '');
              if (cellH) {
                var chpx = parseFloat(cellH);
                if (chpx > 0) {
                  cell.style.setProperty('height',     chpx + 'px', 'important');
                  cell.style.setProperty('max-height', chpx + 'px', 'important');
                  cell.style.setProperty('overflow',   'hidden',    'important');
                  if (chpx < 8) {
                    cell.style.setProperty('padding-top',    '0',   'important');
                    cell.style.setProperty('padding-bottom', '0',   'important');
                    cell.style.setProperty('line-height',    '1',   'important');
                    cell.style.setProperty('font-size',      '1px', 'important');
                  }
                }
              }

              for (var c = logicalCol; c < logicalCol + colspan; c++) {
                if (rowspan > 1) rowspanMap[c] = (rowspanMap[c] || 0) + (rowspan - 1);
              }
            }

            logicalCol += colspan;
          });

          Object.keys(rowspanMap).forEach(function (k) {
            if (parseInt(k) >= 10 && rowspanMap[k] > 0) rowspanMap[k]--;
          });
        });
      });
    });
  <\/script>
`;

        const enriched = rawHtml.includes("</head>")
          ? rawHtml.replace("</head>", injectedScript + "</head>")
          : injectedScript + rawHtml;

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

      // Derive transaction code the same way the backend does — from the
      // first option's nested transaction chain.
      const transactionCode =
        data.firstOption?.purchase_option?.transaction_item?.transaction?.strCode ?? "—";

      const blob = await api.postBlob("purchase-order/export", {
        po: data.po,
        options: data.options,
        assignedAOName: data.assignedAOName,
        firstOption: data.firstOption,
        total: data.total,
        checkByOtherAOName: data.checkByOtherAOName,
        generalManagerName: data.generalManagerName,
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
  /* ── Loading ── */
  if (loading)
    return (
      <div style={styles.center}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
          @keyframes arc { to { transform: rotate(360deg); } }
          @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div style={styles.logoMark}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#1e3a5f" />
            <path
              d="M8 10h16M8 16h10M8 22h13"
              stroke="#93c5fd"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={styles.spinnerTrack} />
        <p style={styles.loadingLabel}>Preparing purchase order…</p>
        <p style={styles.loadingSubLabel}>Filling template from server</p>
      </div>
    );

  /* ── Error ── */
  if (error)
    return (
      <div style={styles.center}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&display=swap');
          @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        `}</style>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>✕</div>
          <p style={styles.errorTitle}>Failed to Load</p>
          <p style={styles.errorMsg}>{error}</p>
          <button style={styles.errorBtn} onClick={() => window.close()}>
            Close Window
          </button>
        </div>
      </div>
    );

  /* ── Preview ── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: #cbd5e1; }
        @keyframes fadein { from { opacity:0; } to { opacity:1; } }
        @keyframes arc    { to   { transform: rotate(360deg); } }
        @media print { .print-bar { display: none !important; } }
      `}</style>

      {/* Top bar */}
      <div style={styles.topBar}>
        <div style={styles.topBarInner}>
          <div style={styles.topBarLeft}>
            <div style={styles.topBarIcon}>
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path
                  d="M8 10h16M8 16h10M8 22h13"
                  stroke="#93c5fd"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div style={styles.topBarTitle}>Purchase Order Preview</div>
              <div style={styles.topBarSub}>
                Template rendered from POTemplate.xlsx
              </div>
            </div>
          </div>
          <div style={styles.topBarRight}>
            <div style={styles.badge}>
              <span style={styles.badgeDot} />
              Ready to print
            </div>
          </div>
        </div>
      </div>

      {/* iframe — pure template output */}
      <iframe
        ref={iframeRef}
        title="Purchase Order Preview"
        style={{
          width: "100%",
          height: "calc(100vh - 52px - 56px)",
          border: "none",
          display: "block",
          animation: "fadein 0.4s ease",
        }}
      />

      {/* Bottom print bar */}
   {/* Bottom print bar */}
      <div className="print-bar" style={styles.bar}>
        <button
          style={styles.closeBtn}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "rgba(255,255,255,0.6)")
          }
          onClick={() => window.close()}
        >
          ✕ Close
        </button>
        <div style={styles.barDivider} />
        <button
          style={styles.printBtn}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          onClick={() => {
            const win = iframeRef.current?.contentWindow;
            if (win?.__printPO) {
              win.__printPO();
            } else {
              win?.print();
            }
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print Purchase Order
        </button>
        <div style={styles.barDivider} />
        <button
          style={{
            ...styles.printBtn,
            background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
            opacity: exporting ? 0.6 : 1,
            cursor: exporting ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => { if (!exporting) e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={(e) => { if (!exporting) e.currentTarget.style.opacity = "1"; }}
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <>
              <span style={{
                display: "inline-block", width: 14, height: 14,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff", borderRadius: "50%",
                animation: "arc 0.6s linear infinite",
              }} />
              Exporting…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <polyline points="7 10 12 15 17 10" />
                <path d="M3 21h18" />
              </svg>
              Export [XLSX]
            </>
          )}
        </button>
      </div>
    </>
  );
}

const styles = {
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "radial-gradient(ellipse at 50% 40%, #dbeafe 0%, #cbd5e1 60%)",
    fontFamily: "'DM Sans', sans-serif",
    gap: 8,
  },
  logoMark: {
    marginBottom: 16,
    filter: "drop-shadow(0 4px 12px rgba(30,58,95,0.25))",
  },
  spinnerTrack: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "3px solid #dbeafe",
    borderTop: "3px solid #1e3a5f",
    animation: "arc 0.75s linear infinite",
    marginBottom: 4,
  },
  loadingLabel: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e3a5f",
    marginTop: 4,
  },
  loadingSubLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  errorCard: {
    background: "#fff",
    borderRadius: 16,
    padding: "36px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
    maxWidth: 340,
  },
  errorIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#fee2e2",
    border: "1.5px solid #fca5a5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#dc2626",
    fontWeight: 700,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111827",
  },
  errorMsg: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 1.5,
  },
  errorBtn: {
    marginTop: 8,
    padding: "9px 24px",
    borderRadius: 8,
    border: "1px solid #E5E7EB",
    background: "#fff",
    color: "#374151",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  topBar: {
    height: 52,
    background: "linear-gradient(90deg, #0f1e33 0%, #1a2f4e 100%)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    padding: "0 20px",
    flexShrink: 0,
  },
  topBarInner: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  topBarIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "rgba(147,197,253,0.12)",
    border: "0.5px solid rgba(147,197,253,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  topBarTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: "#f0f6ff",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.2,
  },
  topBarSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.2,
    marginTop: 1,
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 50,
    background: "rgba(34,197,94,0.12)",
    border: "0.5px solid rgba(34,197,94,0.3)",
    fontSize: 10,
    fontWeight: 600,
    color: "#4ade80",
    fontFamily: "'DM Sans', sans-serif",
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: "#4ade80",
    boxShadow: "0 0 6px #4ade80",
    display: "inline-block",
  },
  bar: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    background: "linear-gradient(90deg, #0f1e33 0%, #1a2f4e 100%)",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    zIndex: 100,
    boxShadow: "0 -4px 24px rgba(0,0,0,0.25)",
  },
  barDivider: {
    width: 1,
    height: 24,
    background: "rgba(255,255,255,0.12)",
    margin: "0 12px",
  },
  printBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 22px",
    borderRadius: 9,
    border: "none",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.01em",
    boxShadow: "0 2px 12px rgba(29,78,216,0.4)",
    fontFamily: "'DM Sans', sans-serif",
    transition: "opacity 0.15s",
  },
  closeBtn: {
    padding: "9px 18px",
    borderRadius: 9,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    transition: "color 0.15s",
  },
};
