import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TableSortLabel,
  Typography,
  CircularProgress,
  Box,
} from "@mui/material";

const CustomTable = ({
  columns = [],
  rows = [],
  page = 0,
  rowsPerPage = 5,
  loading = false,
  enableSorting = true,
  onRowClick,
  getRowId = (row) =>
    row.id ||
    row.nSupplierId ||
    row.nClientId ||
    row.nCompanyId ||
    row.nSupplierContactId ||
    row.nSupplierBankId,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return rows;
    return [...rows].sort((a, b) => {
      const valA = a[sortConfig.key] ?? "";
      const valB = b[sortConfig.key] ?? "";
      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  const visibleRows = useMemo(
    () =>
      sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedRows, page, rowsPerPage]
  );

  // Helper function to truncate text to 15 characters
  const truncateText = (text, maxLength = 20) => {
    if (typeof text === "string" && text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
  };

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 1,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <TableContainer
        sx={{
          maxHeight: "60vh",
          "& td, & th": {
            whiteSpace: "nowrap",
            fontSize: "0.75rem",
            padding: "6px 12px",
          },
          "& thead th": {
            textAlign: "center !important",
            backgroundColor: "#0d47a1",
            color: "#fff",
            textTransform: "uppercase",
            fontWeight: 500,
          },
          "& tbody tr:nth-of-type(odd)": { backgroundColor: "#f9fafb" },
          "& tbody tr:nth-of-type(even)": { backgroundColor: "#e5e7eb" },
          "& tbody tr:hover": {
            backgroundColor: "#e3f2fd",
            transition: "background-color 0.2s ease",
          },
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center">#</TableCell>
              {columns.map((col) => (
                <TableCell key={col.key} align="center">
                  {enableSorting ? (
                    <TableSortLabel
                      active={sortConfig.key === col.key}
                      direction={sortConfig.direction}
                      onClick={() => handleSort(col.key)}
                      sx={{
                        color: "#fff",
                        "& .MuiTableSortLabel-icon": { color: "#fff !important" },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: "#fff", textAlign: "center" }}
                    >
                      {col.label}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {(loading || visibleRows.length === 0) && (
              <TableRow>
                <TableCell colSpan={columns.length + 1} sx={{ py: 3 }}>
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    flexDirection="row"
                  >
                    {loading && <CircularProgress size={20} />}
                    <Typography variant="body2" ml={loading ? 1 : 0}>
                      {loading ? "Loading..." : "No data available"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              visibleRows.length > 0 &&
              visibleRows.map((row, index) => (
                <TableRow
                  key={getRowId(row)}
                  hover
                  sx={{
                    cursor: onRowClick ? "pointer" : "default",
                  }}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  <TableCell align="center">
                    {page * rowsPerPage + index + 1}
                  </TableCell>

                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      align={col.align || "left"}
                      onClick={(e) => {
                        if (e.target.closest("button, svg, a")) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] != null && row[col.key] !== ""
                        ? truncateText(row[col.key])
                        : "---"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default CustomTable;
