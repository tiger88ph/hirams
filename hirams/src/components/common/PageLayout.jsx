import React from "react";
import DotSpinner from "./DotSpinner";

const PageLayout = ({ title, subtitle, children, footer, loading = false, scrollRef }) => {
  return (
    <div
      className="flex flex-col max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] bg-white shadow-lg rounded-xl overflow-hidden relative"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <style>
        {`div::-webkit-scrollbar { display: none; }`}
      </style>

      <header className="sticky top-0 z-20 bg-white px-3 pt-3 pb-2 border-b border-gray-300 rounded-t-xl">
        <div className="flex items-baseline gap-2">
          <h1 className="text-sm font-semibold text-gray-600">{title}</h1>
          {subtitle && (
            <span style={{ fontSize: "0.75em", fontWeight: 400, color: "#666" }}>
              {subtitle}
            </span>
          )}
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