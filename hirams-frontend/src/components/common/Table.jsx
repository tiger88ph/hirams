import React, { useState, useMemo, useEffect } from "react";
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
  Box,
} from "@mui/material";
import DotSpinner from "./DotSpinner";

const CustomTable = ({
  columns = [],
  rows = [],
  page = 0,
  rowsPerPage = 5,
  loading = false,
  enableSorting = true,
  onRowClick,
  getRowId = (row) => row.id || row.nSupplierId || row.nClientId,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [internalLoading, setInternalLoading] = useState(loading);

  useEffect(() => {
    if (!loading) {
      setInternalLoading(true);
      const timer = setTimeout(() => setInternalLoading(false), 200);
      return () => clearTimeout(timer);
    }
  }, [rows, loading]);

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
      sx={{ borderRadius: 1, overflow: "hidden", position: "relative" }}
    >
      <TableContainer
        sx={{
          "& thead th": {
            textAlign: "center !important",
            backgroundColor: "#0d47a1",
            color: "#fff",
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
            <TableRow
              sx={{
                "& th": {
                  fontSize: "0.700rem",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableCell align="center">#</TableCell>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  align="center"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {enableSorting ? (
                    <TableSortLabel
                      active={sortConfig.key === col.key}
                      direction={sortConfig.direction}
                      onClick={() => handleSort(col.key)}
                      sx={{
                        color: "#fff",
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
                        whiteSpace: "nowrap",
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
            {(internalLoading || visibleRows.length === 0) && (
              <TableRow sx={{ "& td": { fontSize: "0.82rem" } }}>
                <TableCell colSpan={columns.length + 1} sx={{ py: 1 }}>
                  <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    flexDirection="row"
                  >
                    {internalLoading && <DotSpinner size={10} gap={0.5} />}
                    <Typography variant="body2" ml={internalLoading ? 1 : 0}>
                      {internalLoading ? "" : "No data available"}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!internalLoading &&
              visibleRows.length > 0 &&
              visibleRows.map((row, index) => (
                <TableRow
                  key={getRowId(row)}
                  hover
                  sx={{
                    cursor: onRowClick ? "pointer" : "default",
                    "& td": { fontSize: "0.8rem", padding: "4px 5px" },
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
                      sx={{
                        maxWidth: 200,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={row[col.key]}
                      onClick={(e) => {
                        if (e.target.closest("button, svg, a"))
                          e.stopPropagation();
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] ?? "---").toString().length > 50
                        ? `${(row[col.key] ?? "").toString().slice(0, 50)}...`
                        : row[col.key]}
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
