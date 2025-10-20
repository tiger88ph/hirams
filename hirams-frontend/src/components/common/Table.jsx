// src/components/common/CustomTable.jsx
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
} from "@mui/material";

const CustomTable = ({
  columns = [],
  rows = [],
  page = 0,
  rowsPerPage = 5,
  enableSorting = true,
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
    <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden" }}>
      <TableContainer
        sx={{
          maxHeight: "60vh",
          "& td, & th": {
            whiteSpace: "nowrap",
            textAlign: "center", // center everything
            fontSize: "0.7rem",
            padding: "6px 12px",
            verticalAlign: "middle",
          },
          "& thead th": {
            backgroundColor: "#0d47a1",
            color: "#fff",
            textTransform: "uppercase",
            fontWeight: 100,
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
                      hideSortIcon={false} // always show arrow
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#fff", // default color
                        "&.Mui-active": {
                          color: "white !important", // color when sorted
                          "& .MuiTableSortLabel-icon": {
                            color: "orange !important", // icon color when sorted
                          },
                        },
                        "& .MuiTableSortLabel-icon": {
                          color: "#fff !important", // icon default color
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
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => {
                const globalIndex = sortedRows.findIndex(
                  (r) => r.id === row.id
                );
                return (
                  <TableRow key={row.id || globalIndex} hover>
                    <TableCell>{globalIndex + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render
                          ? col.render(row[col.key], row)
                          : (row[col.key] ?? "-")}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
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
