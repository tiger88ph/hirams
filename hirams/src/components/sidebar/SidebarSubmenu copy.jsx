import React from "react";
import { CircularProgress } from "@mui/material";

const ITEM_HEIGHT = "min-h-[32px]";

const SidebarSubmenu = ({
  label,
  active = false,
  count,
  redCount,
  orangeCount,
  countLoading = false,
  onClick,
  indent = "pl-5",
}) => {
  return (
    <div
      className={`
        flex items-center gap-1.5 ${indent} pr-1.5 rounded-md
        ${ITEM_HEIGHT} cursor-pointer select-none transition-colors duration-150
        ${active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
        }
      `}
      onClick={onClick}
    >
      {/* dot indicator */}
      <span
        className={`w-1 h-1 rounded-full flex-shrink-0 ${
          active ? "bg-blue-500" : "bg-gray-300"
        }`}
      />

      {/* label */}
      <span className={`flex-1 truncate text-[13px] ${active ? "font-medium" : ""}`}>
        {label}
      </span>

      {/* badges */}
      {countLoading ? (
        <CircularProgress
          size={10}
          thickness={5}
          sx={{ color: active ? "#3b82f6" : "#9ca3af", flexShrink: 0 }}
        />
      ) : (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {redCount > 0 && (
            <span className="text-[10px] font-medium rounded-full px-1.5 leading-[18px] min-w-[18px] text-center bg-red-100 text-red-500">
              {redCount}
            </span>
          )}
          {orangeCount > 0 && (
            <span className="text-[10px] font-medium rounded-full px-1.5 leading-[18px] min-w-[18px] text-center bg-orange-100 text-orange-500">
              {orangeCount}
            </span>
          )}
          {count > 0 && (
            <span
              className={`
                text-[10px] font-medium rounded-full px-1.5 leading-[18px]
                min-w-[18px] text-center
                ${active ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}
              `}
            >
              {count}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SidebarSubmenu;