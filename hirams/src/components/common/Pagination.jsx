import React from "react";
import { TablePagination, useMediaQuery, Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const CustomPagination = ({
  count = 0,
  page = 0,
  rowsPerPage: propRowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down("sm"));
  const isMd = useMediaQuery(theme.breakpoints.between("sm", "md"));
  
  // ✅ Dropdown options with "All" option
  const rowsPerPageOptions = [
    { label: "All", value: -1 },
    10, 
    50, 
    100, 
    500
  ];
  
  // ✅ Default to 10 if undefined or invalid
  const validValues = [-1, 10, 50, 100, 500];
  const rowsPerPage = validValues.includes(propRowsPerPage)
    ? propRowsPerPage
    : 10;

  // Calculate summary info
  const effectiveRowsPerPage = rowsPerPage === -1 ? count : rowsPerPage;
  const startRecord = count === 0 ? 0 : page * effectiveRowsPerPage + 1;
  const endRecord = rowsPerPage === -1 ? count : Math.min((page + 1) * effectiveRowsPerPage, count);
  const totalPages = rowsPerPage === -1 ? 1 : Math.ceil(count / effectiveRowsPerPage);
  const currentPage = page + 1;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: { xs: 1.5, sm: 2 },
        py: 1,
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)",
        borderTop: "1px solid #e5e7eb",
      }}
    >
      {/* Left Side - Summary (hidden on mobile) */}
      {!isXs && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            Showing {startRecord}-{endRecord} of {count}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              color: "#9ca3af",
              mx: 0.25,
            }}
          >
            •
          </Typography>
          <Typography
            variant="caption"
            sx={{
              fontSize: "0.75rem",
              color: "#6b7280",
              fontWeight: 500,
            }}
          >
            Page {currentPage} of {totalPages || 1}
          </Typography>
        </Box>
      )}

      {/* Right Side - Pagination Controls */}
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={onPageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={onRowsPerPageChange}
        rowsPerPageOptions={rowsPerPageOptions}
        labelRowsPerPage={isXs ? "" : "Rows:"}
        showFirstButton={!isXs}
        showLastButton={!isXs}
        labelDisplayedRows={({ from, to, count }) => 
          isXs ? `${from}-${to} of ${count}` : ""
        }
        sx={{
          width: isXs ? "100%" : "auto",
          border: "none",
          "& .MuiTablePagination-toolbar": {
            minHeight: { xs: "36px", sm: "38px" },
            padding: 0,
            gap: { xs: 0.5, sm: 1 },
            justifyContent: isXs ? "space-between" : "flex-end",
          },
          "& .MuiTablePagination-selectLabel": {
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            color: "#6b7280",
            fontWeight: 500,
            margin: 0,
          },
          "& .MuiTablePagination-select": {
            fontSize: { xs: "0.7rem", sm: "0.75rem" },
            color: "#374151",
            fontWeight: 600,
            paddingTop: "4px",
            paddingBottom: "4px",
            paddingLeft: "8px",
            paddingRight: "24px",
            backgroundColor: "#fff",
            borderRadius: "4px",
            border: "1px solid #e5e7eb",
            "&:focus": {
              backgroundColor: "#fff",
              borderRadius: "4px",
            },
          },
          "& .MuiTablePagination-displayedRows": {
            fontSize: "0.7rem",
            color: "#6b7280",
            fontWeight: 500,
            margin: 0,
          },
          "& .MuiTablePagination-actions": {
            marginLeft: { xs: 0.5, sm: 1 },
            gap: 0.25,
          },
          "& .MuiTablePagination-actions button": {
            padding: { xs: "4px", sm: "6px" },
            color: "#6b7280",
            border: "1px solid #e5e7eb",
            borderRadius: "4px",
            backgroundColor: "#fff",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#f3f4f6",
              color: "#1565c0",
              borderColor: "#1565c0",
            },
            "&.Mui-disabled": {
              backgroundColor: "#f9fafb",
              color: "#d1d5db",
              borderColor: "#e5e7eb",
            },
          },
        }}
      />
    </Box>
  );
};

export default CustomPagination;