import React, { useState, useMemo } from "react";
import { Typography, Box, Paper, Skeleton } from "@mui/material";
import { ArrowUpward, ArrowDownward, UnfoldMore } from "@mui/icons-material";
import CustomPagination from "./Pagination";
import DotSpinner from "./DotSpinner";

// ── Skeleton row ───────────────────────────────────────────────────────────────
const SkeletonRow = ({ columns, index }) => {
  const isEven = index % 2 === 0;
  return (
    <Box
      sx={{
        px: 1.5,
        py: 0.75,
        background: isEven ? "#ffffff" : "#f9fafb",
        borderLeft: "3px solid #e2e8f0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box sx={{ width: "40px", display: "flex", justifyContent: "center" }}>
          <Skeleton variant="text" width={18} height={14} sx={{ borderRadius: 1 }} />
        </Box>
        {columns.map((col) => (
          <Box key={col.key} sx={{ flex: 1, px: 0.5 }}>
            <Skeleton
              variant="text"
              width={`${55 + ((index * 13 + col.key?.length * 7) % 35)}%`}
              height={14}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ── Loading state renderer ─────────────────────────────────────────────────────
const TableLoadingState = ({ useSkeleton, columns, rowsPerPage }) => {
  if (useSkeleton) {
    return Array.from({ length: rowsPerPage > 0 ? Math.min(rowsPerPage, 6) : 5 }).map((_, i) => (
      <SkeletonRow key={i} columns={columns} index={i} />
    ));
  }

  return (
    <Box sx={{ p: 1.5, textAlign: "center", background: "#fafafa" }}>
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={1}>
        <DotSpinner size={12} gap={0.5} />
      </Box>
    </Box>
  );
};

const CustomTable = ({
  columns = [],
  rows = [],
  page = 0,
  rowsPerPage = 10,
  loading = false,
  enableSorting = true,
  onRowClick,
  getRowId = (row) => row.id || row.nSupplierId || row.nClientId,
  onPageChange,
  onRowsPerPageChange,
  showPagination = true,
  rowSx,
  useSkeleton = true,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // REMOVED: internalLoading state and useEffect — loading prop is now the sole source of truth

  const handleSort = (key) => {
    if (!enableSorting) return;
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

  const visibleRows = useMemo(() => {
    if (rowsPerPage === -1) return sortedRows;
    return sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedRows, page, rowsPerPage]);

  const getSortIcon = (colKey) => {
    if (!enableSorting) return null;
    if (sortConfig.key !== colKey)
      return <UnfoldMore sx={{ fontSize: "0.75rem", opacity: 0.4 }} />;
    return sortConfig.direction === "asc" ? (
      <ArrowUpward sx={{ fontSize: "0.75rem", color: "#1565c0" }} />
    ) : (
      <ArrowDownward sx={{ fontSize: "0.75rem", color: "#1565c0" }} />
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: "950px" }}>
          <Paper
            elevation={2}
            sx={{ borderRadius: "8px", overflow: "hidden", border: "1px solid #e0e0e0" }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 1.5,
                py: 0.75,
                background: "linear-gradient(135deg, #f1f1f1 0%, #e8e8e8 100%)",
                borderBottom: "2px solid #d0d0d0",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: "40px",
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: "0.65rem",
                    color: "text.secondary",
                  }}
                >
                  #
                </Box>
                {columns.map((col) => (
                  <Box
                    key={col.key}
                    sx={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      cursor: enableSorting ? "pointer" : "default",
                      transition: "all 0.2s ease",
                      "&:hover": { opacity: enableSorting ? 0.7 : 1 },
                    }}
                    onClick={() => handleSort(col.key)}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "0.6rem", sm: "0.625rem", md: "0.65rem" },
                        color: "text.primary",
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {col.label}
                    </Typography>
                    {getSortIcon(col.key)}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Loading state — controlled entirely by loading prop */}
            {loading && (
              <TableLoadingState
                useSkeleton={useSkeleton}
                columns={columns}
                rowsPerPage={rowsPerPage}
              />
            )}

            {/* Empty state */}
            {!loading && visibleRows.length === 0 && (
              <Box sx={{ p: 1, textAlign: "center", background: "#fafafa" }}>
                <Typography variant="caption" sx={{ color: "text.disabled", fontSize: "0.7rem" }}>
                  No data available
                </Typography>
              </Box>
            )}

            {/* Data rows */}
            {!loading &&
              visibleRows.length > 0 &&
              visibleRows.map((row, index) => {
                const isEven = index % 2 === 0;
                return (
                  <Box
                    key={getRowId(row)}
                    sx={{
                      px: 1.5,
                      lineHeight: 3,   // add this
                      background: isEven ? "#ffffff" : "#f9fafb",
                      borderLeft: "3px solid #1565c0",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: onRowClick ? "pointer" : "default",
                      transition: "all 0.15s ease",
                      "&:hover": onRowClick
                        ? { backgroundColor: "#f0f7ff", borderLeftWidth: "5px" }
                        : {},
                      "&:last-child": {
                        borderBottom: showPagination ? "1px solid #f0f0f0" : "none",
                      },
                      ...(rowSx ? rowSx(row) : {}),
                    }}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: "40px",
                          textAlign: "center",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          color: "text.secondary",
                        }}
                      >
                        {rowsPerPage === -1 ? index + 1 : page * rowsPerPage + index + 1}
                      </Box>
                      {columns.map((col) => (
                        <Box
                          key={col.key}
                          sx={{
                            flex: 1,
                            textAlign: col.align || "left",
                            fontSize: "0.75rem",
                            px: 0.5,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: "text.primary",
                            fontWeight: 500,
                          }}
                          title={col.render ? undefined : row[col.key]?.toString()}
                          onClick={(e) => {
                            if (e.target.closest("button, svg, a")) e.stopPropagation();
                          }}
                        >
                          {col.render
                            ? col.render(row[col.key], row)
                            : (row[col.key] ?? "---").toString().length > 50
                              ? `${(row[col.key] ?? "").toString().slice(0, 50)}...`
                              : row[col.key]}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}

            {/* Pagination */}
            {showPagination && !loading && visibleRows.length > 0 && (
              <CustomPagination
                count={sortedRows.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={onPageChange}
                onRowsPerPageChange={onRowsPerPageChange}
              />
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomTable;