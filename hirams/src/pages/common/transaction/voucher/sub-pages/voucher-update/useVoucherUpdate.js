import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PurchaseItemHistoriesAPI from "../../../../../../api/endpoints/purchase-item-histories.api.js";
import VoucherAPI from "../../../../../../api/endpoints/voucher.api.js";
import PurchaseOrderAPI from "../../../../../../api/endpoints/purchase-order.api.js";
import JevAPI from "../../../../../../api/endpoints/jev.api.js";
import JevEntriesAPI from "../../../../../../api/endpoints/jev-entries.api.js";
import VoucherSupplierAPI from "../../../../../../api/endpoints/voucher-supplier.api.js";
import VoucherAssigneeAPI from "../../../../../../api/endpoints/voucher-assignee.api.js";
import { getItem } from "../../../../../../utils/storage/localStorage.js";
import {
  withSpinner,
  showSwal,
} from "../../../../../../utils/helpers/swal.jsx";
import { printRoute } from "../../../../../../utils/helpers/printRoute.js";
import useKeysLabels from "../../../../../../hooks/useKeysLabels.js";

export default function useVoucherUpdate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const voucherId = searchParams.get("id");

  // ── User / mapping ───────────────────────────────────────────────────
  const user = useMemo(() => getItem("user", {}), []);
  const currentUserId = user?.nUserId;
  const {
    // Mappings
    voucherStatus,
    userTypes,
    jev_types,
    jev_status,
    paymentTerms,
    loading: mappingLoading,
    // Payment-mode keys (values stored in cPaymentTerms) + display labels
    cashKey,
    creditCardKey,
    chequeKey,
    otherPaymentTermKey,
    cashLabel,
    creditCardLabel,
    chequeLabel,
    otherPaymentTermLabel,
    // Keys
    jevDisbursementVoucherKey,
    jevActiveKey,
    jevCancelledKey,
    jevPendingKey,
    voucherActiveKey,
    voucherClosedKey,
    voucherPaidKey,
    voucherCancelledKey,
    voucherSupplierTypeKey,
    voucherAssigneeTypeKey,
    forPaymentKey,
    pendingReceiptKey,
    isFinanceOfficer,
    isManagement,
  } = useKeysLabels();

  // ── Voucher data ─────────────────────────────────────────────────────
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVoucher = useCallback(async () => {
    if (!voucherId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setVoucher(null); // reset immediately
    try {
      let data = null;
      if (typeof VoucherAPI.getVoucher === "function") {
        const res = await VoucherAPI.getVoucher(voucherId);
        data = res?.data || res;
      } else {
        const res = await VoucherAPI.getVouchers();
        const list = Array.isArray(res) ? res : res.data || [];
        data = list.find((v) => String(v.nVoucherId) === String(voucherId));
      }
      setVoucher(data || null);
    } catch (err) {
      console.error("Failed to fetch voucher:", err);
      setVoucher(null);
    } finally {
      setLoading(false);
    }
  }, [voucherId]);

  useEffect(() => {
    fetchVoucher();
  }, [fetchVoucher]);

  const notifyUpdated = useCallback(() => {
    window.dispatchEvent(new CustomEvent("voucher_data_updated"));
  }, []);

  const handleBack = useCallback(() => navigate("/voucher"), [navigate]);

  // ── Local UI state ───────────────────────────────────────────────────
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    particular: "",
    amount: "",
    quantity: 1,
    strUOM: "",
    companyId: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [optionHistories, setOptionHistories] = useState({});
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [showJevConfirm, setShowJevConfirm] = useState(false);
  const [creatingJev, setCreatingJev] = useState(false);
  const [showJevPanel, setShowJevPanel] = useState(false);
  const [isJevBalanced, setIsJevBalanced] = useState(false);
  const [jevBalanceLoading, setJevBalanceLoading] = useState(false);
  const [jevBalanceStatus, setJevBalanceStatus] = useState("no_entries"); // "no_entries" | "unbalanced" | "balanced_mismatch" | "balanced"
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);

  useEffect(() => {
    setShowAddItem(false);
    setEditingAssignee(null);
    setSaving(false);
    setFormData({
      particular: "",
      amount: "",
      quantity: 1,
      strUOM: "",
      companyId: "",
    });
    setFormErrors({});
    setConfirmAction(null);
    setConfirmLoading(false);
    setShowJevConfirm(false);
    setShowJevPanel(false);
    setOptionHistories({});
    setHistoriesLoading(false);
  }, [voucherId]);

  // ── Derived values ───────────────────────────────────────────────────
  const isAssigneeType =
    voucher?.voucher_assignees?.length > 0 &&
    !voucher?.voucher_suppliers?.length;

  const assigneeLinks = voucher?.voucher_assignees || [];
  const supplierLinks = voucher?.voucher_suppliers || [];
  const hasJev = !!voucher?.nJEVId;
  const hasActiveJev =
    !!voucher?.nJEVId && String(voucher?.jev?.cStatus) === "A";

  // ── EWT (derived) ────────────────────────────────────────────────────
  // Mirrors POListPanel/PORowPanel exactly: sum of dEWT on each
  // purchase_option. Previously this was recomputed via a separate
  // DirectCost API call, which could disagree with what's shown in the
  // PO list/rows. Deriving it the same way keeps every view consistent.
  const ewtAmount = useMemo(() => {
    if (!voucher || isAssigneeType) return 0;
    return supplierLinks.reduce((sum, link) => {
      const opts = link.purchase_order?.purchase_order_options ?? [];
      return (
        sum +
        opts.reduce((s, opt) => s + Number(opt.purchase_option?.dEWT || 0), 0)
      );
    }, 0);
  }, [voucher, isAssigneeType, supplierLinks]);

  const ewtLoading = false; // kept for API compatibility with the view/props

  const particularsGrandTotal = isAssigneeType
    ? assigneeLinks.reduce(
        (sum, a) => sum + Number(a.dAmount || 0) * Number(a.nQuantity || 1),
        0,
      )
    : supplierLinks.reduce((sum, link) => {
        const opts = link.purchase_order?.purchase_order_options ?? [];
        return opts.reduce((s, opt) => {
          const p = opt.purchase_option;
          return s + (p?.nQuantity || 0) * (p?.dUnitPrice || 0);
        }, sum);
      }, 0);

  // ── JEV entries (single source of truth — also reused for the preview nav) ──
  const [jevEntries, setJevEntries] = useState([]);
  useEffect(() => {
    const jevId = voucher?.nJEVId;
    if (!jevId) {
      setJevEntries([]);
      return;
    }

    let active = true;

    JevEntriesAPI.getByJevId(jevId)
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setJevEntries(list);
      })
      .catch((err) => {
        if (!active) return;
        console.error("useVoucherUpdate — jevEntries fetch failed:", err);
        setJevEntries([]);
      });

    return () => {
      active = false;
    };
  }, [voucher?.nJEVId, balanceRefreshKey]);

  // ── JEV balance check ───────────────────────────────────────────────
  useEffect(() => {
    const jevId = voucher?.nJEVId;
    if (!jevId) {
      setIsJevBalanced(false);
      setJevBalanceStatus("no_entries");
      return;
    }

    let active = true;
    setJevBalanceLoading(true);

    JevEntriesAPI.getByJevId(jevId)
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        const fromTotal = list
          .filter((e) => Number(e.dAmount) < 0)
          .reduce((sum, e) => sum + Math.abs(Number(e.dAmount || 0)), 0);
        const toTotal = list
          .filter((e) => Number(e.dAmount) >= 0)
          .reduce((sum, e) => sum + Math.abs(Number(e.dAmount || 0)), 0);

        const balanced = fromTotal > 0 && toTotal > 0 && fromTotal === toTotal;
        const matchesGrandTotal =
          Number(fromTotal.toFixed(2)) ===
          Number(particularsGrandTotal.toFixed(2));
        setIsJevBalanced(balanced && matchesGrandTotal);

        if (fromTotal === 0 && toTotal === 0) {
          setJevBalanceStatus("no_entries");
        } else if (!balanced) {
          setJevBalanceStatus("unbalanced");
        } else if (
          Number(fromTotal.toFixed(2)) !==
          Number(particularsGrandTotal.toFixed(2))
        ) {
          setJevBalanceStatus("balanced_mismatch");
        } else {
          setJevBalanceStatus("balanced");
        }
      })
      .catch((err) => {
        console.error("JEV balance check failed:", err);
        if (active) {
          setIsJevBalanced(false);
          setJevBalanceStatus("unbalanced");
        }
      })
      .finally(() => {
        if (active) setJevBalanceLoading(false);
      });

    return () => {
      active = false;
    };
  }, [voucher?.nJEVId, particularsGrandTotal, balanceRefreshKey]);

  // ── Real-time: JEV entries changed (from JevViewPanel or another tab) ──
  useEffect(() => {
    const jevId = voucher?.nJEVId;

    const handleEntryChange = (e) => {
      const eventJevId = e.detail?.jevId;
      if (!jevId || String(eventJevId) !== String(jevId)) return;
      setBalanceRefreshKey((k) => k + 1);
    };

    window.addEventListener("jev_entry_data_updated", handleEntryChange);
    window.addEventListener("jev_entry_data_deleted", handleEntryChange);
    return () => {
      window.removeEventListener("jev_entry_data_updated", handleEntryChange);
      window.removeEventListener("jev_entry_data_deleted", handleEntryChange);
    };
  }, [voucher?.nJEVId]);

  const jevBalanceMessage = useMemo(() => {
    switch (jevBalanceStatus) {
      case "no_entries":
        return "JEV Entries not yet added";
      case "unbalanced":
        return "JEV entries not balanced yet";
      case "balanced_mismatch":
        return "JEV entries balanced but do not match the grand total";
      default:
        return "";
    }
  }, [jevBalanceStatus]);

  // ── Purchase option histories ────────────────────────────────────────
  useEffect(() => {
    if (!voucher || isAssigneeType || !pendingReceiptKey) return;

    const ids = (voucher.voucher_suppliers ?? [])
      .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
      .map((o) => o.purchase_option?.nPurchaseItemId)
      .filter(Boolean);

    if (!ids.length) return;

    setHistoriesLoading(true);
    PurchaseItemHistoriesAPI.getLatest({ nPurchaseItemId: ids })
      .then((res) => {
        const map = {};
        (res?.histories || []).forEach(
          (h) => (map[Number(h.nPurchaseItemId)] = h),
        );
        setOptionHistories(map);
      })
      .catch((err) => console.error("History fetch error:", err))
      .finally(() => setHistoriesLoading(false));
  }, [voucher, pendingReceiptKey, isAssigneeType]);

  // ── Helper display flags ─────────────────────────────────────────────
  const firstAssignee = voucher?.voucher_assignees?.[0];
  const payeeName = isAssigneeType
    ? (firstAssignee?.assignee?.strAssigneeName ??
      voucher?.assignee?.strAssigneeName ??
      "—")
    : (voucher?.supplier?.strSupplierName ?? "—");
  const payeeNickName = isAssigneeType
    ? (firstAssignee?.assignee?.strAssigneeNickName ??
      voucher?.assignee?.strAssigneeNickName ??
      "—")
    : (voucher?.supplier?.strSupplierNickName ?? "—");
  const supplierTIN = isAssigneeType
    ? firstAssignee?.assignee?.strTIN
    : voucher?.supplier?.strTIN;
  const supplierAddress = isAssigneeType
    ? firstAssignee?.assignee?.strAddress
    : voucher?.supplier?.strAddress;
  const particularsCount = isAssigneeType
    ? assigneeLinks.length
    : supplierLinks.length;

  // ── Company (for logo on preview) ───────────────────────────────────
  // Supplier-type: same lookup chain as the PO preview.
  // Assignee-type: no PO chain exists, so fall back to the voucher's own company.
  const firstPOOption =
    supplierLinks?.[0]?.purchase_order?.purchase_order_options?.[0];
  const company = isAssigneeType
    ? (voucher?.company ?? null)
    : (firstPOOption?.purchase_option?.transaction_item?.transaction?.company ??
      null);

  const isClosed = String(voucher?.cStatus) === String(voucherClosedKey);
  const isMarkedPaid = String(voucher?.cStatus) === String(voucherPaidKey);
  const isEligibleForPaid = isClosed; // Mark as Paid → ONLY when Closed
  const isEligibleForUnpaid = isMarkedPaid; // Mark as Unpaid → ONLY when Paid
  const canShowPrintButtons = isClosed || isMarkedPaid;

  // Supplier-type: payment terms live on the linked Purchase Order.
  // Assignee-type: no PO chain exists, so fall back to the voucher's own column.
  const cPaymentTerms = isAssigneeType
    ? (voucher?.cPaymentTerms ?? null)
    : (voucher?.voucher_suppliers?.[0]?.purchase_order?.cPaymentTerms ?? null);

  // ── JEV handlers ─────────────────────────────────────────────────────
  const handleAddJev = () => setShowJevConfirm(true);
  const handleViewJev = () => setShowJevPanel(true);
  const confirmCreateJev = async () => {
    const entity = "JEV";
    setShowJevConfirm(false);
    try {
      await withSpinner(entity, async () => {
        await VoucherAPI.createJev(voucher.nVoucherId, {
          cJEVLinkType: jevDisbursementVoucherKey,
        });
        await fetchVoucher();
        notifyUpdated();
      });
      await showSwal("SUCCESS", {}, { entity, action: "created" });
      setShowJevPanel(true);
    } catch (err) {
      console.error("Create JEV failed:", err);
      await showSwal("ERROR", {}, { entity });
    }
  };

  // ── Item handlers ────────────────────────────────────────────────────
  const handleRemovePO = async (id) => {
    await VoucherSupplierAPI.delete(id);
    await fetchVoucher();
    notifyUpdated();
  };

  const handleEditAssignee = (assignee) => {
    setEditingAssignee(assignee);
    setFormData({
      particular: assignee.strParticular || "",
      amount: assignee.dAmount || "",
      quantity: assignee.nQuantity || 1,
      strUOM: assignee.strUOM || "",
      companyId: assignee.nCompanyId || "",
    });
    setShowAddItem(true);
  };

  const handleDeleteAssignee = async (id) => {
    const res = await VoucherAssigneeAPI.delete(id);
    notifyUpdated();
    if (res.voucher_deleted) {
      navigate("/voucher");
    } else {
      await fetchVoucher();
    }
  };

  const handleSaveAssignee = async () => {
    const errs = {};
    if (!formData.particular?.trim())
      errs.particular = "Particular is required";
    if (!formData.amount || Number(formData.amount) <= 0)
      errs.amount = "Amount must be > 0";
    if (!formData.quantity || Number(formData.quantity) <= 0)
      errs.quantity = "Quantity must be > 0";
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const payload = {
        strParticular: formData.particular,
        dAmount: Number(formData.amount),
        nQuantity: Number(formData.quantity),
        strUOM: formData.strUOM || "",
        nCompanyId: formData.companyId || null,
      };

      editingAssignee
        ? await VoucherAssigneeAPI.update(
            editingAssignee.nVoucherAssigneeId,
            payload,
          )
        : await VoucherAssigneeAPI.create({
            nVoucherId: voucher.nVoucherId,
            nAssigneeId: firstAssignee.nAssigneeId,
            ...payload,
          });

      await fetchVoucher();
      notifyUpdated();
      setShowAddItem(false);
      setEditingAssignee(null);
      setFormData({
        particular: "",
        amount: "",
        quantity: 1,
        strUOM: "",
        companyId: "",
      });
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const buildParticulars = () =>
    isAssigneeType
      ? assigneeLinks.map((a) => ({
          particular: a.strParticular,
          quantity: Number(a.nQuantity || 1),
          unitAmount: Number(a.dAmount || 0),
          amount: Number(a.dAmount || 0) * Number(a.nQuantity || 1),
          strUOM: a.strUOM || "",
        }))
      : supplierLinks.map((vs) => {
          const opts = vs.purchase_order?.purchase_order_options ?? [];
          return {
            particular:
              vs.purchase_order?.strPurchaseOrderNo ??
              `PO #${vs.nPurchaseOrderId}`,
            amount: opts.reduce(
              (sum, o) =>
                sum +
                (o.purchase_option?.nQuantity || 0) *
                  (o.purchase_option?.dUnitPrice || 0),
              0,
            ),
            strUOM: "txn", // hardcoded, always "txn" for supplier-type
          };
        });

  const handlePreviewVoucher = async () => {
    try {
      const particulars = buildParticulars();

      if (String(voucher.cStatus) === String(voucherActiveKey)) {
        await withSpinner("Voucher", async () => {
          await VoucherAPI.updateVoucherStatus(
            voucher.nVoucherId,
            voucherClosedKey,
          );
          await fetchVoucher();
          notifyUpdated();
        });
      }

      // Uses the jevEntries already held in state (kept fresh via the fetch
      // effect + real-time listeners above) — no extra network round trip
      // right before navigating, which was causing a delay on click.
      navigate("/preview-voucher", {
        state: {
          voucher,
          isAssigneeType,
          payeeName,
          payeeNickName,
          supplierTIN,
          supplierAddress,
          particulars,
          cPaymentTerms,
          paymentTerms,
          ewtAmount: isAssigneeType ? 0 : ewtAmount,
          company,
          jevEntries,
          cashKey,
          creditCardKey,
          chequeKey,
          otherPaymentTermKey,
          cashLabel,
          creditCardLabel,
          chequeLabel,
          otherPaymentTermLabel,
        },
      });
    } catch (err) {
      console.error("Preview voucher error:", err);
      await showSwal("ERROR", {}, { entity: "Voucher" });
    }
  };
  const handlePreviewCheque = async () => {
    try {
      const chequeAmount = isAssigneeType
        ? particularsGrandTotal
        : particularsGrandTotal - ewtAmount;

      if (String(voucher.cStatus) === String(voucherActiveKey)) {
        await withSpinner("Voucher", async () => {
          await VoucherAPI.updateVoucherStatus(
            voucher.nVoucherId,
            voucherClosedKey,
          );
          await fetchVoucher();
          notifyUpdated();
        });
      }

      navigate("/preview-cheque", {
        state: {
          cheque: voucher?.cheque ?? null,
          payeeName,
          amount: chequeAmount,
        },
      });
    } catch (err) {
      console.error("Preview cheque error:", err);
      await showSwal("ERROR", {}, { entity: "Voucher" });
    }
  };
  const ACTION_LABELS = {
    cancel: "cancelled",
    reopen: "reopened",
    paid: "marked as paid",
    unpaid: "marked as unpaid",
    close: "closed",
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    const entity = "Voucher";

    setConfirmAction(null);

    if (action === "print_only") {
      try {
        await withSpinner(entity, handlePreviewVoucher);
        await fetchVoucher();
      } catch (err) {
        console.error("Preview voucher error:", err);
        await showSwal("ERROR", {}, { entity });
      }
      return;
    }

    if (action === "finalize_jev" || action === "undo_finalize_jev") {
      const jevId = voucher?.jev?.nJEVId;
      if (!jevId) {
        await showSwal(
          "ERROR",
          {},
          { entity: "JEV", message: "JEV not found" },
        );
        return;
      }
      try {
        await withSpinner("JEV", async () => {
          await JevAPI.update(jevId, { cStatus: "toggle" });
          await fetchVoucher();
          notifyUpdated();
        });
        const actionLabel =
          action === "finalize_jev" ? "finalized" : "status updated";
        await showSwal("SUCCESS", {}, { entity: "JEV", action: actionLabel });
      } catch (err) {
        console.error("Toggle JEV status failed:", err);
        await showSwal("ERROR", {}, { entity: "JEV" });
      }
      return;
    }

    if (action === "print_cheque") {
      try {
        await withSpinner(entity, async () => {
          sessionStorage.setItem(
            "printCheque_data",
            JSON.stringify({
              voucher,
              payeeName,
              particulars: buildParticulars(),
              isAssigneeType,
              ewtAmount: isAssigneeType ? 0 : ewtAmount,
            }),
          );
          printRoute("/print-cheque");
        });
      } catch (err) {
        console.error("Print cheque error:", err);
        await showSwal("ERROR", {}, { entity });
      }
      return;
    }

    try {
      await withSpinner(entity, async () => {
        switch (action) {
          case "cancel":
            await VoucherAPI.updateVoucherStatus(
              voucher.nVoucherId,
              voucherCancelledKey,
            );
            break;
          case "reopen":
            await VoucherAPI.updateVoucherStatus(
              voucher.nVoucherId,
              voucherActiveKey,
            );
            break;
          case "paid":
            isAssigneeType
              ? await VoucherAPI.updateVoucherStatus(
                  voucher.nVoucherId,
                  voucherPaidKey,
                )
              : await Promise.all([
                  PurchaseOrderAPI.updateCartStatusBulk({
                    nPurchaseOrderIds: supplierLinks.map(
                      (vs) => vs.nPurchaseOrderId,
                    ),
                    nStatus: pendingReceiptKey,
                    nUserId: currentUserId,
                  }),
                  VoucherAPI.updateVoucherStatus(
                    voucher.nVoucherId,
                    voucherPaidKey,
                  ),
                ]);
            break;
          case "unpaid":
            isAssigneeType
              ? await VoucherAPI.updateVoucherStatus(
                  voucher.nVoucherId,
                  voucherClosedKey,
                )
              : await Promise.all([
                  PurchaseOrderAPI.updateCartStatusBulk({
                    nPurchaseOrderIds: supplierLinks.map(
                      (vs) => vs.nPurchaseOrderId,
                    ),
                    nStatus: forPaymentKey,
                    nUserId: currentUserId,
                  }),
                  VoucherAPI.updateVoucherStatus(
                    voucher.nVoucherId,
                    voucherClosedKey,
                  ),
                ]);
            break;
          case "close":
            await VoucherAPI.updateVoucherStatus(
              voucher.nVoucherId,
              voucherClosedKey,
            );
            break;
        }
      });

      await showSwal("SUCCESS", {}, { entity, action: ACTION_LABELS[action] });
      notifyUpdated();

      if (["cancel", "reopen", "close", "paid", "unpaid"].includes(action)) {
        navigate("/voucher");
      } else {
        await fetchVoucher();
      }
    } catch (err) {
      console.error(`Failed to ${action} voucher:`, err);
      await showSwal("ERROR", {}, { entity });
    }
  };

  return {
    voucher,
    company, // ← add this
    loading: loading || mappingLoading,
    voucherId,
    voucherAssigneeTypeKey,
    voucherActiveKey,
    voucherClosedKey,
    voucherPaidKey,
    voucherCancelledKey,
    voucherStatus,
    currentUserId,
    isManagement,
    isFinanceOfficer,
    chequeKey,
    jevDisbursementVoucherKey,
    isAssigneeType,
    assigneeLinks,
    supplierLinks,
    hasJev,
    hasActiveJev,
    particularsGrandTotal,
    particularsCount,
    payeeName,
    payeeNickName,
    supplierTIN,
    supplierAddress,
    cPaymentTerms,
    isEligibleForPaid,
    isEligibleForUnpaid,
    isMarkedPaid,
    historiesLoading,
    ewtAmount,
    ewtLoading,
    firstAssignee,
    showAddItem,
    setShowAddItem,
    editingAssignee,
    setEditingAssignee,
    saving,
    formData,
    setFormData,
    formErrors,
    confirmAction,
    setConfirmAction,
    confirmLoading,
    showJevConfirm,
    setShowJevConfirm,
    creatingJev,
    showJevPanel,
    setShowJevPanel,
    isJevBalanced,
    jevBalanceLoading,
    jevBalanceStatus,
    jevBalanceMessage,
    handleBack,
    handleAddJev,
    handleViewJev,
    confirmCreateJev,
    handleRemovePO,
    handleEditAssignee,
    handleDeleteAssignee,
    handleSaveAssignee,
    handleConfirmAction,
    handlePreviewVoucher,
    handlePreviewCheque,
    fetchVoucher,
    jev_types,
    jev_status,
    jevPendingKey,
    canShowPrintButtons,
  };
}
