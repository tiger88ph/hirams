// PageLayout.jsx
import React from "react";

const PageLayout = ({ title, children }) => {
  return (
    <div className="max-h-[calc(100vh-10rem)] min-h-[calc(100vh-9rem)] overflow-auto bg-white shadow-lg rounded-xl p-3 pt-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white -mx-3 px-3 pt-3 pb-2 border-b border-gray-300 mb-3">
        <h1 className="text-sm text-gray-800">{title}</h1>
      </header>

      {/* Page content */}
      <div className="space-y-0">{children}</div>
    </div>
  );
};

export default PageLayout;
