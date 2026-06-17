import React, {
  useState,
  useMemo,
  useRef,
  useState as useLocalState,
} from "react";
import {
  Typography,
  Box,
  Paper,
  IconButton,
  Menu,
  MenuItem as MuiMenuItem,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  UnfoldMore,
  MoreVert,
} from "@mui/icons-material";
import CustomPagination from "./Pagination";
import DotSpinner from "./DotSpinner";
import { CustomTableSkeleton } from "../helper/Skeleton";

const ACTION_COLORS = {
  default: { bg: "#1e40af", hover: "#1e3a8a" },
  login: { bg: "#1e40af", hover: "#1e3a8a" },
  register: { bg: "#047857", hover: "#065f46" },
  add: { bg: "#0284c7", hover: "#0369a1" },
  edit: { bg: "#d97706", hover: "#b45309" },
  delete: { bg: "#dc2626", hover: "#b91c1c" },
  view: { bg: "#2563eb", hover: "#1d4ed8" },
  submit: { bg: "#2563eb", hover: "#1d4ed8" },
  save: { bg: "#0284c7", hover: "#0369a1" },
  approve: { bg: "#059669", hover: "#047857" },
  finalize: { bg: "#0f766e", hover: "#0d6b63" },
  verify: { bg: "#7c3aed", hover: "#6d28d9" },
  apply: { bg: "#0891b2", hover: "#0e7490" },
  confirm: { bg: "#16a34a", hover: "#15803d" },
  assign: { bg: "#d97706", hover: "#b45309" },
  reassign: { bg: "#ea580c", hover: "#c2410c" },
  markup: { bg: "#4f46e5", hover: "#4338ca" },
  breakdown: { bg: "#0891b2", hover: "#0e7490" },
  deactivate: { bg: "#6b7280", hover: "#4b5563" },
  cancel: { bg: "#6b7280", hover: "#4b5563" },
  revert: { bg: "#92400e", hover: "#78350f" },
  reset: { bg: "#92400e", hover: "#78350f" },
  back: { bg: "#475569", hover: "#334155" },
  close: { bg: "#374151", hover: "#1f2937" },
};

const ActionsCell = ({ render }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const open = Boolean(anchorEl);
  const content = render();
  const showDot = useMediaQuery("(max-width:1364px)");

  return (
    <>
      {!showDot && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>{content}</Box>
      )}

      {showDot && (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(e.currentTarget);
            }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={() => setAnchorEl(null)}
            onClick={(e) => e.stopPropagation()}
            PaperProps={{
              sx: {
                minWidth: 180,
                borderRadius: "10px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                py: 0.5,
              },
            }}
          >
            {React.Children.map(content?.props?.children, (child, i) => {
              if (!child) return null;
              const actionColor = child.props?.actionColor ?? "default";
              const colors =
                ACTION_COLORS[actionColor] ?? ACTION_COLORS.default;
              const isHovered = hoveredIndex === i;

              return (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    px: 1.5,
                    py: 0.75,
                    mx: 0.75,
                    mb: 0.25,
                    borderRadius: "8px",
                    cursor: "pointer",
                    background: isHovered ? `${colors.bg}15` : "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    child.props?.onClick?.(e);
                    setAnchorEl(null);
                  }}
                >
                  {/* Icon with action color */}
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `${colors.bg}18`,
                      color: colors.bg,
                      flexShrink: 0,
                      transition: "background 0.15s",
                      ...(isHovered && { background: `${colors.bg}30` }),
                    }}
                  >
                    {child.props?.icon}
                  </Box>

                  {/* Label */}
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      color: isHovered ? colors.bg : "#374151",
                      transition: "color 0.15s",
                    }}
                  >
                    {child.props?.tooltip ?? ""}
                  </Typography>
                </Box>
              );
            })}
          </Menu>
        </Box>
      )}
    </>
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
  getRowId = (row) => row.id ?? row.nSupplierId ?? row.nClientId,
  onPageChange,
  onRowsPerPageChange,
  showPagination = true,
  rowSx,
  useSkeleton = true,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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
    return sortedRows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
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
        <Box sx={{ minWidth: "800px" }}>
          <Paper
            elevation={2}
            sx={{
              borderRadius: "8px",
              overflow: "hidden",
              border: "1px solid #e0e0e0",
            }}
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
                {columns.map((col, ci) => (
                  <Box
                    key={col.key ?? `header-col-${ci}`}
                    sx={{
                      flex: col.xs ?? 1,
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
                        fontSize: {
                          xs: "0.6rem",
                          sm: "0.625rem",
                          md: "0.65rem",
                        },
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
          
            {loading && (
              <CustomTableSkeleton
                columns={columns}
                rows={rowsPerPage}
                useSkeleton={useSkeleton}
              />
            )}
            {/* Empty state */}
            {!loading && visibleRows.length === 0 && (
              <Box sx={{ p: 1, textAlign: "center", background: "#fafafa" }}>
                <Typography
                  variant="caption"
                  sx={{ color: "text.disabled", fontSize: "0.7rem" }}
                >
                  No data available
                </Typography>
              </Box>
            )}
            {/* Data rows */}
            {!loading &&
              visibleRows.length > 0 &&
              visibleRows.map((row, index) => {
                const rowKey = getRowId(row) ?? `row-fallback-${index}`;
                const isEven = index % 2 === 0;
                return (
                  <Box
                    key={rowKey}
                    sx={{
                      px: 1.5,
                      lineHeight: 3,
                      background: isEven ? "#ffffff" : "#f9fafb",
                      borderLeft: "3px solid #1565c0",
                      borderBottom: "1px solid #f0f0f0",
                      cursor: onRowClick ? "pointer" : "default",
                      transition: "all 0.15s ease",
                      "&:hover": onRowClick
                        ? { backgroundColor: "#f0f7ff", borderLeftWidth: "5px" }
                        : {},
                      "&:last-child": {
                        borderBottom: showPagination
                          ? "1px solid #f0f0f0"
                          : "none",
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
                        {rowsPerPage === -1
                          ? index + 1
                          : page * rowsPerPage + index + 1}
                      </Box>
                      {columns.map((col, ci) => {
                        const isActionsCol = col.key === "actions";
                        return (
                          <Box
                            key={col.key ?? `cell-${index}-${ci}`}
                            sx={{
                              flex: col.xs ?? 1,
                              textAlign: col.align || "left",
                              fontSize: "0.75rem",
                              px: 0.5,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              color: "text.primary",
                              fontWeight: 500,
                            }}
                            title={
                              col.render ? undefined : row[col.key]?.toString()
                            }
                            onClick={(e) => {
                              if (e.target.closest("button, svg, a"))
                                e.stopPropagation();
                            }}
                          >
                            {isActionsCol && col.render ? (
                              <ActionsCell
                                render={() => col.render(row[col.key], row)}
                              />
                            ) : col.render ? (
                              col.render(row[col.key], row)
                            ) : (row[col.key] ?? "---").toString().length >
                              50 ? (
                              `${(row[col.key] ?? "").toString().slice(0, 50)}...`
                            ) : (
                              row[col.key] || "--"
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                );
              })}
            {/* Pagination */}
            {/* Pagination */}
            {showPagination && ( //&& visibleRows.length > 0
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
