// PageLayout.jsx
import React from "react";
import DotSpinner from "./DotSpinner";

const PageLayout = ({ title, children, footer, loading = false }) => {
  return (
    <div
      className="flex flex-col max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] bg-white shadow-lg rounded-xl overflow-hidden relative"
      style={{
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE & Edge
      }}
    >
      {/* Hide scrollbar for Chrome & Safari */}
      <style>
        {`
          div::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white px-3 pt-3 pb-2 border-b border-gray-300 rounded-t-xl">
        <h1 className="text-sm text-gray-800">{title}</h1>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-3 space-y-0 relative">
        {children}

        {/* Loading Overlay */}
        {loading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.6)",
              zIndex: 1000,
              pointerEvents: "none", // optionally block interaction
            }}
          >
            <DotSpinner />
          </div>
        )}
      </div>

      {/* Footer */}
      {footer && (
        <footer className="sticky bottom-0 z-20 bg-white px-3 py-2 border-t border-gray-300 rounded-b-xl">
          {footer}
        </footer>
      )}
    </div>
  );
};

export default PageLayout;
