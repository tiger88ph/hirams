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

/**
 * CustomTable component
 *
 * Props:
 * - columns: array of { key, label, render? }
 * - rows: array of data objects
 * - page: current page (for pagination)
 * - rowsPerPage: number of rows per page
 * - loading: boolean
 * - enableSorting: boolean
 * - getRowId: function to extract unique ID from row (optional)
 */
const CustomTable = ({
  columns = [],
  rows = [],
  page = 0,
  rowsPerPage = 5,
  loading = false,
  enableSorting = true,
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

  return (
    <Paper
      elevation={1}
      sx={{
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        overflow: "hidden",
      }}
    >
      <TableContainer
        sx={{
          maxHeight: "60vh",
          "& td, & th": {
            whiteSpace: "nowrap",
            textAlign: "center",
            fontSize: "0.7rem",
            padding: "6px 12px",
          },
          "& thead th": {
            backgroundColor: "#0d47a1",
            color: "#fff",
            textTransform: "uppercase",
            fontWeight: 100,
            transition: "color 0.2s ease",
            "& .MuiTableSortLabel-root": {
              color: "#fff",
              "&:hover": {
                color: "#bbdefb", // light blue on hover
              },
              "&.Mui-active": {
                color: "#fff !important",
                "& .MuiTableSortLabel-icon": {
                  color: "#fff !important",
                },
              },
            },
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
              <TableCell>#</TableCell>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  {enableSorting ? (
                    <TableSortLabel
                      active={sortConfig.key === col.key}
                      direction={sortConfig.direction}
                      onClick={() => handleSort(col.key)}
                      hideSortIcon={false}
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#fff",
                        "&.Mui-active": {
                          color: "#fff !important",
                          "& .MuiTableSortLabel-icon": {
                            color: "#fff !important",
                          },
                        },
                        "& .MuiTableSortLabel-icon": {
                          color: "#fff !important",
                        },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#fff",
                        textAlign: "center",
                        display: "block",
                      }}
                    >
                      {col.label}
                    </Typography>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  sx={{ py: 4, color: "gray", textAlign: "center" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <CircularProgress size={15} thickness={5} color="primary" />
                    <Typography variant="caption" sx={{ color: "gray" }}>
                      Loading data...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : visibleRows.length > 0 ? (
              visibleRows.map((row, index) => (
                <TableRow key={getRowId(row)} hover>
                  <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] != null && row[col.key] !== ""
                          ? row[col.key]
                          : "---"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  sx={{ py: 3, color: "gray", textAlign: "center" }}
                >
                  No data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default CustomTable;
