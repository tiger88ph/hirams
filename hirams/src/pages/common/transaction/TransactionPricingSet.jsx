import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Checkbox, Chip, Tooltip } from "@mui/material";
import {
  ArrowBack,
  Add,
  Edit,
  Delete,
  VerifiedUser,
  DoneAll,
  Undo,
  TrendingDown,
  TrendingUp,
  TrendingFlat,
  Lock,
  Visibility, // ← add this
} from "@mui/icons-material";
import { Box } from "@mui/material";

import CustomTable from "../../../components/common/Table";
import PageLayout from "../../../components/common/PageLayout";
import BaseButton from "../../../components/common/BaseButton";
import CustomSearchField from "../../../components/common/SearchField";
import SetAEModal from "./modal/transaction-pricing-set/SetAEModal";
import DeleteVerificationModal from "../modal/DeleteVerificationModal";
import TransactionActionModal from "../modal/TransactionActionModal";
import api from "../../../utils/api/api";
import echo from "../../../utils/echo";

function TransactionPricingSet() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    transaction,
    selectedStatusCode,
    isManagement,
    transacstatus,
    forPricingKey,
    priceVerificationKey,
    priceApprovalKey,
    isPricingSetting,
    currentStatusLabel,
  } = state || {};
  const transactionFromState = state?.transaction;
  const clientNickName =
    state?.clientNickName || transactionFromState?.clientName;

  const proc_status = state?.proc_status ?? {};
  const priceSettingKey = state?.priceSettingKey ?? "";
  const priceFinalizeKey = state?.priceFinalizeKey ?? "";
  const priceFinalizeVerificationKey =
    state?.priceFinalizeVerificationKey ?? "";

  const [loading, setLoading] = useState(false);
  const [setsLoading, setSetsLoading] = useState(false);
  const [pricingSets, setPricingSets] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);

  /* ── Status derivations ── */
  const statusCode = String(
    transaction?.status_code ?? transaction?.latest_history?.nStatus ?? "",
  );

  const canEditChoice = !isManagement
    ? priceSettingKey?.includes(statusCode)
    : true;
  const showRevert = !isManagement
    ? !priceSettingKey?.includes(statusCode)
    : true;
  const showVerify = !isManagement
    ? priceFinalizeVerificationKey?.includes(statusCode)
    : statusCode !== "" && statusCode === priceVerificationKey;
  const showFinalize = !isManagement && priceSettingKey?.includes(statusCode);

  const priceSettingLabel = !isManagement
    ? (proc_status[priceSettingKey] ?? "")
    : (transacstatus[forPricingKey] ?? "");
  const priceFinalizeVerificationLabel = !isManagement
    ? (proc_status[priceFinalizeVerificationKey] ?? "")
    : (transacstatus[priceVerificationKey] ?? "");

  const hasChosenSet = useMemo(
    () => pricingSets.some((s) => s.chosen),
    [pricingSets],
  );

  /* ── Action modal helpers ── */
  const openActionModal = useCallback((type) => {
    setActionType(type);
    setActionModalOpen(true);
  }, []);

  const closeActionModal = useCallback(() => {
    setActionModalOpen(false);
    setActionType(null);
  }, []);

  const handleAfterAction = useCallback(
    (newStatusCode) => {
      closeActionModal();
      if (newStatusCode)
        sessionStorage.setItem("selectedStatusCode", newStatusCode);
      navigate(-1);
    },
    [closeActionModal, navigate],
  );

  /* ── API ── */
  const fetchPricingSets = useCallback(
    async ({ showLoading = false } = {}) => {
      if (!transaction?.nTransactionId) return;
      if (showLoading) setSetsLoading(true);
      try {
        const res = await api.get(
          `pricing-sets?nTransactionId=${transaction.nTransactionId}`,
        );
        const formatted = (res.data ?? []).map((s) => ({
          id: s.nPricingSetId,
          name: s.strName,
          chosen: s.bChosen === 1,
          itemCount: s.item_pricings_count ?? 0,
          item: s.item ?? "0/0",
          totalSellingPrice: s.totalSellingPrice ?? 0,
          diveAmount: s.diveAmount ?? 0,
          divePercentage: s.divePercentage ?? "0.00%",
          raw: s,
        }));
        setPricingSets(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        if (showLoading) setSetsLoading(false);
      }
    },
    [transaction?.nTransactionId],
  );

  /* ── Fetch transaction if not passed directly ── */
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionFromState && state?.transactionId) {
        setLoading(true);
        try {
          const res = await api.get(
            `transaction/procurement/${state.transactionId}`,
          );
          setTransaction(res.transaction ?? null);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchTransaction();
  }, [transactionFromState, state?.transactionId]);

  /* ── Initial load — keyed on ID not object reference ── */
  useEffect(() => {
    fetchPricingSets({ showLoading: true });
  }, [transaction?.nTransactionId]);

  /* ── Realtime ── */
  useEffect(() => {
    if (!transaction?.nTransactionId) return;

    const channel = echo.channel(
      `transaction.${transaction.nTransactionId}.pricing-sets`,
    );

    channel.listen(".pricing-set.updated", (event) => {
      if (event.action === "deleted") {
        setPricingSets((prev) =>
          prev.filter((s) => s.id !== event.pricingSetId),
        );
        return;
      }
      fetchPricingSets();
    });

    channel.listen(".item-pricing.updated", () => {
      fetchPricingSets();
    });

    return () => {
      echo.leaveChannel(
        `transaction.${transaction.nTransactionId}.pricing-sets`,
      );
    };
  }, [transaction?.nTransactionId, fetchPricingSets]);

  /* ── Helpers ── */
  const isFullyPriced = useCallback((itemStr) => {
    const [priced, total] = itemStr.split("/").map(Number);
    if (isNaN(priced) || isNaN(total) || total === 0) return false;
    return priced === total;
  }, []);

  const fmt = useCallback(
    (val) =>
      Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );

  const getItemBadge = useCallback((itemStr) => {
    const [priced, total] = itemStr.split("/").map(Number);
    if (isNaN(priced) || isNaN(total) || total === 0)
      return { color: "default", label: itemStr };
    if (priced === 0) return { color: "error", label: itemStr };
    if (priced < total) return { color: "warning", label: itemStr };
    return { color: "success", label: itemStr };
  }, []);

  const getDiveProps = useCallback((diveAmount) => {
    if (diveAmount < 0)
      return {
        icon: <TrendingDown sx={{ fontSize: 15 }} />,
        cls: "text-red-500",
      };
    if (diveAmount > 0)
      return {
        icon: <TrendingUp sx={{ fontSize: 15 }} />,
        cls: "text-emerald-600",
      };
    return {
      icon: <TrendingFlat sx={{ fontSize: 15 }} />,
      cls: "text-gray-400",
    };
  }, []);

  const getTspColor = useCallback(
    (tsp) => (tsp <= 0 ? "text-gray-400" : "text-blue-600"),
    [],
  );

  /* ── Filtered + sorted rows — only recomputes when data or search changes ── */
  const filtered = useMemo(
    () =>
      pricingSets
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
          if (a.chosen === b.chosen) return a.name.localeCompare(b.name);
          return b.chosen - a.chosen;
        }),
    [pricingSets, search],
  );

  /* ── Row actions ── */
  const handleChoose = useCallback(
    async (row, event) => {
      event.stopPropagation();
      if (!canEditChoice) return;
      if (!row.chosen && !isFullyPriced(row.item)) return;
      setPricingSets((prev) =>
        prev.map((s) => ({
          ...s,
          chosen: s.id === row.id ? !row.chosen : false,
        })),
      );
      try {
        await api.patch(`pricing-sets/${row.id}/choose`);
      } catch (err) {
        console.error(err);
        fetchPricingSets();
      }
    },
    [canEditChoice, isFullyPriced, fetchPricingSets],
  );

  const handleEdit = useCallback((row, event) => {
    event.stopPropagation();
    setModalData(row);
    setModalOpen(true);
  }, []);

  const handleDelete = useCallback((row, event) => {
    event.stopPropagation();
    setDeleteTarget({ type: "pricing-set", data: row });
    setDeleteModalOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    fetchPricingSets();
    setDeleteTarget(null);
    setDeleteModalOpen(false);
  }, [deleteTarget, fetchPricingSets]);

  const handleRowClick = useCallback(
    (row) => {
      navigate("/transaction-pricing", {
        state: {
          transaction,
          clientNickName,
          selectedSet: row,
          isPricingSetting,
          currentStatusLabel,
        },
      });
    },
    [
      navigate,
      transaction,
      clientNickName,
      isPricingSetting,
      currentStatusLabel,
    ],
  );

  /* ── Columns — memoized so CustomTable rows don't all re-render ── */
  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Pricing Set",
        render: (_, row) => {
          const canChoose = canEditChoice && isFullyPriced(row.item);
          const checkboxNode = (
            <Checkbox
              checked={row.chosen}
              onChange={(e) => handleChoose(row, e)}
              onClick={(e) => e.stopPropagation()}
              disabled={
                !canEditChoice || (!row.chosen && !isFullyPriced(row.item))
              }
              sx={{
                p: 0.5,
                color:
                  !canChoose && !row.chosen
                    ? "text.disabled"
                    : "text.secondary",
              }}
            />
          );

          const tooltipTitle = !canEditChoice
            ? "Selecting a pricing set is only allowed during price setting"
            : `All items must be priced before selecting (${row.item})`;

          return (
            <div className="flex items-center gap-2">
              {!canChoose && !row.chosen ? (
                <Tooltip title={tooltipTitle} arrow>
                  <span className="flex items-center">
                    {checkboxNode}
                    <Lock
                      sx={{ fontSize: 13, color: "text.disabled", ml: -0.5 }}
                    />
                  </span>
                </Tooltip>
              ) : (
                checkboxNode
              )}
              <span
                className={`font-medium truncate ${row.chosen ? "text-emerald-700" : "text-gray-800"}`}
              >
                {row.name}
              </span>
            </div>
          );
        },
      },
      {
        key: "item",
        label: "Status",
        align: "center",
        render: (_, row) => {
          const { color, label } = getItemBadge(row.item);
          return (
            <Tooltip title="Priced / Total Items">
              <Chip
                label={label}
                size="small"
                color={color}
                variant="filled"
                sx={{ fontWeight: 600, fontSize: 12, minWidth: 52 }}
              />
            </Tooltip>
          );
        },
      },
      {
        key: "totalSellingPrice",
        label: "Total Selling Price",
        align: "right",
        render: (_, row) => (
          <span
            className={`text-sm font-semibold ${getTspColor(row.totalSellingPrice)}`}
          >
            ₱ {fmt(row.totalSellingPrice)}
          </span>
        ),
      },
      {
        key: "diveAmount",
        label: "Dive Amount",
        align: "right",
        render: (_, row) => {
          const { cls } = getDiveProps(row.diveAmount);
          const pct = parseFloat(row.divePercentage);
          return (
            <div
              className={`flex items-center justify-end gap-1 text-sm font-semibold ${cls}`}
            >
              <span>₱ {fmt(row.diveAmount)}</span>
              <span
                className={`ml-1 text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  pct < 0
                    ? "bg-red-100 text-red-600"
                    : pct > 0
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                }`}
              >
                {row.divePercentage}
              </span>
            </div>
          );
        },
      },
      {
        key: "actions",
        label: "Actions",
        render: (_, row) => (
          <div className="flex justify-center gap-1">
            <BaseButton
              icon={<Visibility />}
              tooltip="View Pricing"
              size="small"
              actionColor="view"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(row);
              }}
            />
            <BaseButton
              icon={<Edit />}
              tooltip="Edit Pricing Set"
              size="small"
              actionColor="edit"
              onClick={(e) => handleEdit(row, e)}
            />
            <BaseButton
              icon={<Delete />}
              tooltip="Delete Pricing Set"
              size="small"
              actionColor="delete"
              onClick={(e) => handleDelete(row, e)}
              disabled={row.chosen}
            />
          </div>
        ),
      },
    ],
    [
      canEditChoice,
      isFullyPriced,
      handleChoose,
      getItemBadge,
      getTspColor,
      fmt,
      getDiveProps,
      handleEdit,
      handleDelete,
    ],
  );

  /* ── Render ── */
  return (
    <PageLayout
      title="Transaction"
      subtitle={`/ ${currentStatusLabel || ""} / ${transaction?.strCode || transaction?.transactionId || ""}`}
      loading={loading}
      footer={
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <BaseButton
            label="Back"
            icon={<ArrowBack />}
            onClick={() => navigate(-1)}
            actionColor="back"
            disabled={loading}
          />

          <Box sx={{ display: "flex", gap: 1 }}>
            {showRevert && (
              <BaseButton
                label="Revert"
                icon={<Undo />}
                onClick={() => openActionModal("revert")}
                disabled={loading}
                actionColor="revert"
              />
            )}

            {showVerify && (
              <BaseButton
                label="Verify"
                icon={<VerifiedUser />}
                onClick={() => openActionModal("verify")}
                disabled={loading}
                actionColor="verify"
              />
            )}

            {showFinalize && (
              <BaseButton
                label="Finalize"
                icon={<DoneAll />}
                onClick={() => openActionModal("finalize")}
                disabled={loading || !hasChosenSet}
                actionColor="finalize"
                tooltip={
                  !hasChosenSet
                    ? "Please select at least one pricing set before finalizing"
                    : ""
                }
              />
            )}
          </Box>
        </Box>
      }
    >
      {/* Search + Add */}
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Pricing Set"
            value={search}
            onChange={setSearch}
          />
        </div>
        <BaseButton
          label="Set"
          icon={<Add />}
          variant="contained"
          actionColor="approve" // ← was color="primary"
          onClick={() => {
            setModalData(null);
            setModalOpen(true);
          }}
        />
      </section>

      {/* Table */}
      <section className="bg-white shadow-sm rounded-lg overflow-hidden">
        <CustomTable
          rowSx={(row) =>
            row.chosen ? { backgroundColor: "rgba(16, 185, 129, 0.08)" } : {}
          }
          columns={columns}
          rows={filtered}
          page={page}
          rowsPerPage={rowsPerPage}
          loading={setsLoading}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          onRowClick={handleRowClick}
        />
      </section>

      {/* Modals */}
      <SetAEModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={modalData}
        onSaved={fetchPricingSets}
        transactionId={transaction?.nTransactionId}
      />

      <DeleteVerificationModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        entityToDelete={deleteTarget}
        onSuccess={confirmDelete}
      />

      {actionModalOpen && (
        <TransactionActionModal
          open={actionModalOpen}
          onClose={closeActionModal}
          // ── PROCUREMENT block — replace closeActionModal with handleAfterAction ──
          {...(!isManagement && {
            actionType,
            transaction,
            aostatus: proc_status,
            onVerified: handleAfterAction, // ← was closeActionModal
            onFinalized: handleAfterAction, // ← was closeActionModal
            onReverted: handleAfterAction, // ← was closeActionModal
            priceFinalizeVerificationLabel,
            priceSettingLabel,
            role: "P",
          })}
          {...(isManagement && {
            actionType: actionType === "verify" ? "verified" : "reverted",
            transaction: {
              ...transaction,
              latest_history: {
                nStatus:
                  transaction?.status_code ??
                  transaction?.latest_history?.nStatus,
              },
            },
            transacstatus,
            onVerified: handleAfterAction,
            onReverted: handleAfterAction,
            canvasVerificationLabel: priceFinalizeVerificationLabel,
            isPricing: true,
            role: "M",
          })}
          disabled={loading}
        />
      )}
    </PageLayout>
  );
}

export default TransactionPricingSet;
