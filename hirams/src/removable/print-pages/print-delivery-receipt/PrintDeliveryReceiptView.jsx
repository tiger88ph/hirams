export default function PrintDeliveryReceiptView({
  html, error, loading, printing, exporting, iframeRef, handlePrint, handleExport
}) {
  if (loading)
    return (
      <div className="print-center">
        <div className="print-logo-mark">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="#1e3a5f" />
            <path d="M6 10h20M6 16h14M6 22h17" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="print-spinner-track" />
        <p className="print-loading-label">Preparing delivery receipt…</p>
        <p className="print-loading-sub">Filling template from server</p>
      </div>
    );

  if (error)
    return (
      <div className="print-center">
        <div className="print-error-card">
          <div className="print-error-icon">✕</div>
          <p className="print-error-title">Failed to Load</p>
          <p className="print-error-msg">{error}</p>
          <button className="print-error-btn" onClick={() => window.close()}>Close Window</button>
        </div>
      </div>
    );

  return (
    <>
      <div className="print-top-bar">
        <div className="print-top-inner">
          <div className="print-top-left">
            <div className="print-top-icon">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <path d="M6 10h20M6 16h14M6 22h17" stroke="#93c5fd" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="print-top-title">Delivery Receipt Preview</div>
              <div className="print-top-sub">Showing columns A–I · Template rendered from DRTemplate.xlsx</div>
            </div>
          </div>
          <div className="print-top-right">
            <div className="print-badge">
              <span className="print-badge-dot" /> Ready to print
            </div>
          </div>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        title="Delivery Receipt Preview"
        style={{ width: "100%", height: "calc(100vh - 52px - 56px)", border: "none", display: "block", animation: "fadein 0.4s ease" }}
      />

      <div className="print-bar">
        <button className="print-close" onClick={() => window.close()}>✕ Close</button>
        <div className="print-divider" />
        <button className="print-btn" onClick={handlePrint} disabled={printing} style={{ opacity: printing ? 0.6 : 1, cursor: printing ? "not-allowed" : "pointer" }}>
          {printing ? (
            <>
              <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "arc 0.6s linear infinite" }} />
              Preparing…
            </>
          ) : (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print Delivery Receipt
            </>
          )}
        </button>
        <div className="print-divider" />
        <button className="print-btn print-btn-export" onClick={handleExport} disabled={exporting} style={{ opacity: exporting ? 0.6 : 1, cursor: exporting ? "not-allowed" : "pointer" }}>
          {exporting ? (
            <>
              <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", animation: "arc 0.6s linear infinite" }} />
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
