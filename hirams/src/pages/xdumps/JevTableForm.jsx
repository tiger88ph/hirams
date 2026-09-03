// components/common/JevForm.jsx
import { useState, useEffect, useMemo } from "react";
import { Box, Typography, IconButton, Skeleton } from "@mui/material";
import JevAPI from "../../api/endpoints/jev.api.js";
import JournalAccountAPI from "../../api/endpoints/journal-account.api.js";
import DataTable from "../../components/common/DataTable.jsx";
import { EditOutlined, DeleteOutlineOutlined } from "@mui/icons-material";

const fmtPHP = (n) =>
  `₱${Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export const AccountChainSelect = ({ value, onChange, error }) => {
  const [chainOptions, setChainOptions] = useState([]);
  const [chainSelected, setChainSelected] = useState([]);
  const [loadingLevel, setLoadingLevel] = useState(null);

  const isInitialLoading = chainOptions.length === 0;
  const isLoadingNextLevel =
    !isInitialLoading &&
    loadingLevel !== null &&
    loadingLevel === chainOptions.length;

  useEffect(() => {
    let active = true;
    setLoadingLevel(0);
    // ✅ SAME URL, SAME RESPONSE — just wrapped in endpoint
    JournalAccountAPI.getParents()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setChainOptions([list]);
      })
      .catch((err) => {
        console.error("Failed to fetch accounts:", err);
        if (active) setChainOptions([[]]);
      })
      .finally(() => active && setLoadingLevel(null));
    return () => {
      active = false;
    };
  }, []);

  const handleSelectAt = async (levelIdx, rawValue) => {
    const accountId = rawValue ? Number(rawValue) : "";

    const newSelected = chainSelected.slice(0, levelIdx);
    newSelected[levelIdx] = accountId;
    setChainSelected(newSelected);
    setChainOptions((prev) => prev.slice(0, levelIdx + 1));

    if (!accountId) {
      onChange("");
      return;
    }

    setLoadingLevel(levelIdx + 1);
    try {
      // ✅ SAME URL, SAME RESPONSE — just wrapped in endpoint
      const res = await JournalAccountAPI.getChildren(accountId);
      const children = Array.isArray(res) ? res : (res?.data ?? []);

      if (children.length > 0) {
        setChainOptions((prev) => {
          const next = prev.slice(0, levelIdx + 1);
          next[levelIdx + 1] = children;
          return next;
        });
      } else {
        onChange(accountId);
      }
    } catch (err) {
      console.error("Failed to fetch linked accounts:", err);
      onChange(accountId);
    } finally {
      setLoadingLevel(null);
    }
  };

  const fieldSx = {
    width: "100%",
    px: 1.25,
    py: 0.875,
    fontSize: "0.75rem",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "inherit",
    color: "#111827",
    background: "#FAFAFA",
    boxSizing: "border-box",
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 600,
          color: "#374151",
          mb: 0.4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Account Title
      </Typography>

      {isInitialLoading ? (
        <Skeleton
          variant="rounded"
          height={34}
          sx={{ borderRadius: "8px", bgcolor: "rgba(0,0,0,0.06)" }}
        />
      ) : (
        chainOptions.map((options, idx) => {
          const isLastLevel = idx === chainOptions.length - 1;
          const selectedId = chainSelected[idx] ?? "";
          const selectedAcc = options.find(
            (a) => a.nJournalAccountId === selectedId,
          );
          const hasChildren =
            selectedAcc &&
            chainOptions.length > idx + 1 &&
            chainOptions[idx + 1]?.length > 0;

          return (
            <Box key={idx} sx={{ mb: !isLastLevel ? 0.6 : 0 }}>
              <Box
                component="select"
                value={selectedId}
                onChange={(e) => handleSelectAt(idx, e.target.value)}
                sx={{
                  ...fieldSx,
                  border: `0.5px solid ${
                    error && isLastLevel && !hasChildren ? "#EF4444" : "#D1D5DB"
                  }`,
                }}
              >
                <option value="">
                  {idx === 0 ? "Select account…" : "Select linked account…"}
                </option>
                {options.map((acc) => (
                  <option
                    key={acc.nJournalAccountId}
                    value={acc.nJournalAccountId}
                  >
                    {acc.strAccountName}
                  </option>
                ))}
              </Box>

              {hasChildren && (
                <Typography
                  sx={{ fontSize: "0.58rem", color: "#F59E0B", mt: 0.3 }}
                >
                  ⓘ Please select a linked account below — this parent has
                  sub-accounts.
                </Typography>
              )}
            </Box>
          );
        })
      )}

      {isLoadingNextLevel && (
        <Skeleton
          variant="rounded"
          height={34}
          sx={{ borderRadius: "8px", mt: 0.6, bgcolor: "rgba(0,0,0,0.06)" }}
        />
      )}

      {error && (
        <Typography sx={{ fontSize: "0.58rem", color: "#EF4444", mt: 0.3 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

const JevTableForm = ({
  formData,
  setFormData,
  formErrors,
  lockedType,
  setFormErrors, // ✅ ADD THIS LINE
  suggestedAmount,
  isEditing,
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", px: 1.5, py: 1 }}>
    <AccountChainSelect
      value={formData.nJournalAccountId}
      onChange={(id) => setFormData((p) => ({ ...p, nJournalAccountId: id }))}
      error={formErrors.nJournalAccountId}
    />

    <Box sx={{ mb: 1 }}>
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 600,
          color: "#374151",
          mb: 0.4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Type
      </Typography>
      <Box sx={{ display: "flex", gap: 0.75 }}>
        {["from", "to"].map((t) => {
          const isLocked = lockedType === t;
          return (
            <Box
              key={t}
              onClick={() => {
                if (isLocked) return;
                setFormData((p) => ({ ...p, cType: t }));
              }}
              sx={{
                flex: 1,
                textAlign: "center",
                py: 0.75,
                borderRadius: "8px",
                border: `1px solid ${formData.cType === t ? "#3B82F6" : "#D1D5DB"}`,
                background:
                  formData.cType === t
                    ? "#EFF6FF"
                    : isLocked
                      ? "#F3F4F6"
                      : "#FAFAFA",
                cursor: isLocked ? "not-allowed" : "pointer",
                opacity: isLocked ? 0.5 : 1,
                fontSize: "0.68rem",
                fontWeight: 700,
                color: formData.cType === t ? "#3B82F6" : "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "all 0.15s",
              }}
            >
              {t}
            </Box>
          );
        })}
      </Box>
      {lockedType && (
        <Typography sx={{ fontSize: "0.58rem", color: "#9CA3AF", mt: 0.4 }}>
          This account already has a {lockedType} entry — remove it first to
          switch this line to {lockedType}.
        </Typography>
      )}
    </Box>

    <Box sx={{ mb: 1.5 }}>
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 600,
          color: "#374151",
          mb: 0.4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Amount
      </Typography>
      <Box sx={{ position: "relative" }}>
        <Typography
          sx={{
            position: "absolute",
            left: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.72rem",
            color: "#6B7280",
            pointerEvents: "none",
          }}
        >
          ₱
        </Typography>
        <Box
          component="input"
          type="number"
          min="0"
          step="0.01"
          max={suggestedAmount > 0 ? suggestedAmount : undefined}
          placeholder={
            isEditing && suggestedAmount > 0
              ? suggestedAmount.toFixed(2)
              : "0.00"
          }
          value={formData.amount}
          onChange={(e) => {
            const raw = e.target.value;
            let errorMsg = null;
            let finalValue = raw;

            // 1. Empty = valid but warn
            if (raw === "" || raw === "0") {
              finalValue = raw === "" ? "" : "0";
              errorMsg = null;
            } else {
              const num = Number(raw);

              // 2. Must be a valid number
              if (isNaN(num)) {
                errorMsg = "Please enter a valid amount.";
              }
              // 3. Cannot be negative
              else if (num < 0) {
                errorMsg = "Amount cannot be negative.";
              }
              // 4. Cannot exceed suggested amount limit
              else if (suggestedAmount > 0 && num > suggestedAmount) {
                finalValue = String(suggestedAmount);
                errorMsg = `Amount cannot exceed ₱${suggestedAmount.toFixed(2)}`;
              }
              // ✅ All good
              else {
                errorMsg = null;
              }
            }

            // Update form data AND errors together
            setFormData((p) => ({ ...p, amount: finalValue }));
            setFormErrors((p) => ({ ...p, amount: errorMsg }));
          }}
          sx={{
            width: "100%",
            pl: 2.5,
            pr: 1.25,
            py: 0.875,
            fontSize: "0.75rem",
            border: `0.5px solid ${formErrors.amount ? "#EF4444" : "#D1D5DB"}`,
            borderRadius: "8px",
            outline: "none",
            fontFamily: "inherit",
            color: "#111827",
            background: "#FAFAFA",
            boxSizing: "border-box",
          }}
        />
      </Box>
      {suggestedAmount > 0 && Number(formData.amount) >= suggestedAmount && (
        <Typography sx={{ fontSize: "0.58rem", color: "#9CA3AF", mt: 0.3 }}>
          Max: ₱{suggestedAmount.toFixed(2)}
        </Typography>
      )}
      {formErrors.amount && (
        <Typography sx={{ fontSize: "0.58rem", color: "#EF4444", mt: 0.3 }}>
          {formErrors.amount}
        </Typography>
      )}
    </Box>
  </Box>
);

export const JournalEntryVoucherTable = ({
  jevLink,
  refreshKey,
  onEdit,
  onDelete,
  removingAccountId,
}) => {
  const [particulars, setParticulars] = useState([]);
  const [totals, setTotals] = useState({ dTotalDebit: 0, dTotalCredit: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jevLink) return;
    let active = true;
    setLoading(true);
    // ✅ SAME URL, SAME RESPONSE — just wrapped in endpoint
    JevAPI.getByLink(jevLink)
      .then((res) => {
        if (!active) return;
        setParticulars(res?.particulars ?? []);
        setTotals(res?.totals ?? { dTotalDebit: 0, dTotalCredit: 0 });
      })
      .catch((err) => {
        console.error("Failed to fetch JEV lines:", err);
        if (active) {
          setParticulars([]);
          setTotals({ dTotalDebit: 0, dTotalCredit: 0 });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [jevLink, refreshKey]);

  const groupedRows = useMemo(() => {
    const groups = new Map();
    particulars.forEach((row) => {
      const key = row.strParentAccountName || row.strAccountName;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });

    const flat = [];
    groups.forEach((children, parentName) => {
      const showHeader =
        children.length > 1 || children[0]?.strAccountName !== parentName;

      if (showHeader) {
        flat.push({
          _rowType: "header",
          _key: `header-${parentName}`,
          strAccountName: parentName,
        });
      }
      children.forEach((child) => {
        flat.push({
          ...child,
          _rowType: "child",
          _indent: showHeader,
          _key: `child-${child.nJournalAccountId}`,
        });
      });
    });
    return flat;
  }, [particulars]);

  const columns = [
    {
      key: "strAccountName",
      label: "Account Title",
      xs: 6,
      align: "left",
      headerAlign: "center",
      render: (row) => {
        if (row._rowType === "header") {
          return (
            <Typography
              sx={{
                fontSize: "0.65rem",
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {row.strAccountName}
            </Typography>
          );
        }
        return (
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#111827",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              width: "100%",
              pl: row._indent ? 1.5 : 0,
            }}
          >
            {row._indent && (
              <Box
                component="span"
                sx={{ color: "#CBD5E1", mr: 0.5, fontWeight: 400 }}
              >
                ↳
              </Box>
            )}
            {row.strAccountName}
          </Typography>
        );
      },
      summaryRender: () => (
        <Typography
          sx={{ fontSize: "0.67rem", fontWeight: 700, color: "#334155" }}
        >
          Total
        </Typography>
      ),
    },
    {
      key: "dDebit",
      label: "FROM",
      xs: 3,
      align: "right",
      headerAlign: "center",
      render: (row) => {
        if (row._rowType === "header") return null;
        const isRemoving = removingAccountId === row.nJournalAccountId;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.3,
              width: "100%",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: row.dDebit > 0 ? 700 : 400,
                color: row.dDebit > 0 ? "#DC2626" : "#D1D5DB",
              }}
            >
              {row.dDebit > 0 ? `-${fmtPHP(row.dDebit)}` : "—"}
            </Typography>
            {row.dDebit > 0 && onEdit && (
              <IconButton
                size="small"
                onClick={() =>
                  onEdit({
                    nJEVId: row.nDebitJEVId,
                    nJournalAccountId: row.nJournalAccountId,
                    cType: "from",
                    amount: row.dDebit,
                    hasOpposite: row.dCredit > 0,
                  })
                }
                sx={{
                  width: 18,
                  height: 18,
                  color: "#DC2626",
                  opacity: 0.6,
                  "&:hover": { opacity: 1, background: "#FEF2F2" },
                  p: 0,
                }}
              >
                <EditOutlined sx={{ fontSize: "0.68rem" }} />
              </IconButton>
            )}
            {row.dDebit > 0 && onDelete && (
              <IconButton
                size="small"
                disabled={isRemoving}
                onClick={() => onDelete(row.nDebitJEVId, row.nJournalAccountId)}
                sx={{
                  width: 18,
                  height: 18,
                  color: "#EF4444",
                  opacity: isRemoving ? 0.4 : 0.6,
                  "&:hover": { opacity: 1, background: "#FEF2F2" },
                  p: 0,
                }}
              >
                {isRemoving ? (
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      border: "1.5px solid #EF4444",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                ) : (
                  <DeleteOutlineOutlined sx={{ fontSize: "0.68rem" }} />
                )}
              </IconButton>
            )}
          </Box>
        );
      },
      summaryValue: (summaryRow) => summaryRow?.dTotalDebit,
      summaryRender: (summaryRow) => (
        <Typography
          sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#DC2626" }}
        >
          -{fmtPHP(summaryRow?.dTotalDebit)}
        </Typography>
      ),
    },
    {
      key: "dCredit",
      label: "TO",
      xs: 3,
      align: "right",
      headerAlign: "center",
      hideBorder: true,
      render: (row) => {
        if (row._rowType === "header") return null;
        const isRemoving = removingAccountId === row.nJournalAccountId;
        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.3,
              width: "100%",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: row.dCredit > 0 ? 700 : 400,
                color: row.dCredit > 0 ? "#16A34A" : "#D1D5DB",
              }}
            >
              {row.dCredit > 0 ? `+${fmtPHP(row.dCredit)}` : "—"}
            </Typography>
            {row.dCredit > 0 && onEdit && (
              <IconButton
                size="small"
                onClick={() =>
                  onEdit({
                    nJEVId: row.nCreditJEVId,
                    nJournalAccountId: row.nJournalAccountId,
                    cType: "to",
                    amount: row.dCredit,
                    hasOpposite: row.dDebit > 0,
                  })
                }
                sx={{
                  width: 18,
                  height: 18,
                  color: "#16A34A",
                  opacity: 0.6,
                  "&:hover": { opacity: 1, background: "#F0FDF4" },
                  p: 0,
                }}
              >
                <EditOutlined sx={{ fontSize: "0.68rem" }} />
              </IconButton>
            )}
            {row.dCredit > 0 && onDelete && (
              <IconButton
                size="small"
                disabled={isRemoving}
                onClick={() =>
                  onDelete(row.nCreditJEVId, row.nJournalAccountId)
                }
                sx={{
                  width: 18,
                  height: 18,
                  color: "#EF4444",
                  opacity: isRemoving ? 0.4 : 0.6,
                  "&:hover": { opacity: 1, background: "#FEF2F2" },
                  p: 0,
                }}
              >
                {isRemoving ? (
                  <Box
                    sx={{
                      width: 9,
                      height: 9,
                      border: "1.5px solid #EF4444",
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.6s linear infinite",
                    }}
                  />
                ) : (
                  <DeleteOutlineOutlined sx={{ fontSize: "0.68rem" }} />
                )}
              </IconButton>
            )}
          </Box>
        );
      },
      summaryValue: (summaryRow) => summaryRow?.dTotalCredit,
      summaryRender: (summaryRow) => (
        <Typography
          sx={{ fontSize: "0.72rem", fontWeight: 800, color: "#16A34A" }}
        >
          +{fmtPHP(summaryRow?.dTotalCredit)}
        </Typography>
      ),
    },
  ];

  return (
    <Box sx={{ mx: 1.5, mb: 1.5 }}>
      <DataTable
        columns={columns}
        rows={groupedRows}
        rowKey={(row) => row._key}
        rowSx={(row) =>
          row._rowType === "header"
            ? { background: "rgba(100,116,139,0.06)" }
            : {}
        }
        loading={loading}
        emptyText="No data found."
        minWidth="0px"
        summaryRow={particulars.length > 0 ? totals : null}
      />
    </Box>
  );
};

export default JevTableForm;
