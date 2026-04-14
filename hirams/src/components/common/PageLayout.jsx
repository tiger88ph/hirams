import React from "react";
import DotSpinner from "./DotSpinner";

const PageLayout = ({
  title,
  subtitle,
  children,
  footer,
  loading = false,
  scrollRef,
  actions,
  onArchive,
}) => {
  return (
    <div
      className="flex flex-col max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] bg-white shadow-lg rounded-xl overflow-hidden relative"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      <header className="sticky top-0 z-20 bg-white px-3 pt-3 pb-2 border-b border-gray-300 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-semibold text-gray-600">{title}</h1>
            {subtitle && (
              <span
                style={{ fontSize: "0.75em", fontWeight: 400, color: "#666" }}
              >
                {subtitle}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {actions}
            <button
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-md px-2 py-1 transition-colors"
              onClick={onArchive}
            >
              {/* <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg> */}
              Archives
            </button>
          </div>
        </div>
      </header>

      {/* ✅ ref added, overflow-hidden removed (was resetting scrollTop) */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 space-y-0 relative overflow-auto"
        style={loading ? { pointerEvents: "none" } : undefined}
      >
        {children}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-[1000]">
            <DotSpinner message={true} />
          </div>
        )}
      </div>

      {footer && (
        <footer className="sticky bottom-0 z-20 bg-white px-3 py-2 border-t border-gray-300 rounded-b-xl">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default PageLayout;
