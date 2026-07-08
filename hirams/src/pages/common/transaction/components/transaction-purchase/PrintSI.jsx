import { useEffect, useState, useRef } from "react";
import api from "../../../../../utils/api/api";

export default function PrintSI() {
  const [html, setHtml] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
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

    api
      .post(
        "export/preview-si",
        {
          transaction: data.transaction,
          invoiceItems: data.invoiceItems,
          assignedAOName: data.assignedAOName,
          assignedAONo: data.assignedAONo,
          transactionCode: data.transactionCode,
        },
        { responseType: "text" },
      )
      .then((res) => {
        const rawHtml = typeof res === "string" ? res : res.data;

        // ── OPTIMIZED: Simpler script that runs once on load ────────────
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
      @page { margin: 10mm; size: A4 portrait; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
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
      }
      table {
        table-layout: fixed !important;
        border-collapse: collapse !important;
        width: 100% !important;
      }
      tr { page-break-inside: avoid !important; }
      td, th { overflow: hidden !important; }
      /* Hide columns beyond I */
      col:nth-child(n+10) { display: none !important; }
      td:nth-child(n+10),
      th:nth-child(n+10) { display: none !important; }
    }
  </style>
  <script>
    window.__printSI = function () {
      if (window.matchMedia) {
        window.matchMedia('print').addListener(function(mql) {
          if (!mql.matches) {
            window.__printState = null;
          }
        });
      }
      setTimeout(function() { window.print(); }, 100);
    };

    // ── Lock row/cell heights exactly like the template, incl. thin rows ──
    document.addEventListener('DOMContentLoaded', function () {
      var VISIBLE_COLS = 9; // A–I

      var tables = document.querySelectorAll('table');
      tables.forEach(function (table) {
        table.style.setProperty('table-layout', 'fixed', 'important');
        table.style.setProperty('border-collapse', 'collapse', 'important');
        table.style.setProperty('background', '#fff', 'important');

        // ── Lock col widths, collapse hidden cols ───────────────────────
        var cols = table.querySelectorAll('col');
        var colIdx = 0;
        cols.forEach(function (col) {
          var span = parseInt(col.getAttribute('span') || '1', 10);
          if (colIdx >= VISIBLE_COLS) {
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

        // ── Walk rows: lock heights + hide cols beyond VISIBLE_COLS ─────
        var rowspanMap = {};
        var rows = table.querySelectorAll('tr');

        rows.forEach(function (row) {
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

          cells.forEach(function (cell) {
            while (rowspanMap[logicalCol] && rowspanMap[logicalCol] > 0) {
              rowspanMap[logicalCol]--;
              logicalCol++;
            }

            var colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            var rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);

            if (logicalCol >= VISIBLE_COLS) {
              cell.style.cssText = [
                'padding:0!important',
                'width:0!important',
                'min-width:0!important',
                'max-width:0!important',
                'border:none!important',
                'overflow:hidden!important',
                'background:transparent!important',
              ].join(';');
              cell.innerHTML = '';

            } else if (logicalCol + colspan > VISIBLE_COLS) {
              var allowed = VISIBLE_COLS - logicalCol;
              cell.setAttribute('colspan', allowed);
              var w = cell.style.width;
              if (w) cell.style.setProperty('width', w, 'important');
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
            if (parseInt(k) >= VISIBLE_COLS && rowspanMap[k] > 0) rowspanMap[k]--;
          });
        });
      });
    }, { once: true });
  <\/script>
`;
        const enriched = rawHtml.includes("</head>")
          ? rawHtml.replace("</head>", injectedScript + "</head>")
          : injectedScript + rawHtml;

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
    if (printing) return; // Prevent multiple clicks

    setPrinting(true);

    // Clear any existing timeout
    if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);

    const win = iframeRef.current?.contentWindow;

    if (win?.__printSI) {
      win.__printSI();
    } else {
      win?.print();
    }

    // Auto-reset printing state after 2s (print dialog closes quickly on most browsers)
    printTimeoutRef.current = setTimeout(() => {
      setPrinting(false);
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (printTimeoutRef.current) clearTimeout(printTimeoutRef.current);
    };
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
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
              d="M6 10h20M6 16h14M6 22h17"
              stroke="#93c5fd"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div style={styles.spinnerTrack} />
        <p style={styles.loadingLabel}>Preparing sales invoice…</p>
        <p style={styles.loadingSubLabel}>Filling template from server</p>
      </div>
    );

  // ── Error ────────────────────────────────────────────────────────────────
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

  // ── Preview ──────────────────────────────────────────────────────────────
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
                  d="M6 10h20M6 16h14M6 22h17"
                  stroke="#93c5fd"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <div style={styles.topBarTitle}>Sales Invoice Preview</div>
              <div style={styles.topBarSub}>
                Showing columns A–I · Template rendered from SITemplate.xlsx
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

      {/* iframe */}
      <iframe
        ref={iframeRef}
        title="Sales Invoice Preview"
        style={{
          width: "100%",
          height: "calc(100vh - 52px - 56px)",
          border: "none",
          display: "block",
          animation: "fadein 0.4s ease",
        }}
      />

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
          style={{
            ...styles.printBtn,
            opacity: printing ? 0.6 : 1,
            cursor: printing ? "not-allowed" : "pointer",
          }}
          onMouseEnter={(e) => {
            if (!printing) e.currentTarget.style.opacity = "0.88";
          }}
          onMouseLeave={(e) => {
            if (!printing) e.currentTarget.style.opacity = "1";
          }}
          onClick={handlePrint}
          disabled={printing}
        >
          {printing ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTop: "2px solid #fff",
                  borderRadius: "50%",
                  animation: "arc 0.6s linear infinite",
                }}
              />
              Preparing…
            </>
          ) : (
            <>
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
              Print Sales Invoice
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
  loadingSubLabel: { fontSize: 11, color: "#6B7280" },
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
  errorTitle: { fontSize: 16, fontWeight: 700, color: "#111827" },
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
  topBarLeft: { display: "flex", alignItems: "center", gap: 10 },
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
  topBarRight: { display: "flex", alignItems: "center", gap: 8 },
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