import React from "react";
import { TablePagination, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const CustomPagination = ({
  count = 0,
  page = 0,
  rowsPerPage = 5,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.between("sm", "md"));

  return (
    <div
      className="w-full flex justify-end sm:justify-between items-center px-2 sm:px-4 pb-2 rounded-b-lg"
      style={{
        overflowX: "auto",
        backgroundColor: "#f9fafb", // ✅ soft gray background
        borderTop: "1px solid #e5e7eb", // subtle border to separate from table
      }}
    >
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={isXs ? [10, 50] : [10, 50, 100]}
        labelRowsPerPage={isXs ? "" : "Rows per page:"}
        showFirstButton={!isXs}
        showLastButton={!isXs}
        sx={{
          width: "100%",
          "& .MuiTablePagination-toolbar": {
            flexWrap: isXs ? "wrap" : "nowrap",
            justifyContent: isXs ? "center" : "flex-end",
            alignItems: "center",
            minHeight: "40px",
            gap: isXs ? "4px" : "12px",
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
            {
              fontSize: isXs ? "0.65rem" : isMd ? "0.75rem" : "0.8rem",
              color: "#4b5563", // ✅ gray text
              whiteSpace: "nowrap",
            },
          "& .MuiTablePagination-select": {
            fontSize: isXs ? "0.65rem" : "0.8rem",
            color: "#374151", // ✅ darker gray for better contrast
            paddingRight: "6px",
          },
          "& .MuiTablePagination-actions button": {
            padding: isXs ? "2px" : "4px",
            margin: isXs ? "0 1px" : "0 2px",
            color: "#4b5563", // ✅ gray icon color
          },
        }}
      />
    </div>
  );
};

export default CustomPagination;
