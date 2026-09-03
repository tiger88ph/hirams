import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PurchaseItemHistoriesAPI from "../../../../../../api/endpoints/purchase-item-histories.api.js";
import DirectCostAPI from "../../../../../../api/endpoints/direct-cost.api.js";
import DirectCostOptionAPI from "../../../../../../api/endpoints/direct-cost-option.api.js";
import VoucherAPI from "../../../../../../api/endpoints/voucher.api.js";
import PurchaseOrderAPI from "../../../../../../api/endpoints/purchase-order.api.js";
import JevAPI from "../../../../../../api/endpoints/jev.api.js";
import JevEntriesAPI from "../../../../../../api/endpoints/jev-entries.api.js";
import VoucherSupplierAPI from "../../../../../../api/endpoints/voucher-supplier.api.js";
import VoucherAssigneeAPI from "../../../../../../api/endpoints/voucher-assignee.api.js";
import { getUserRoles } from "../../../../../../utils/helpers/roleHelper.js";
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
    //Mappings
    voucherStatus,
    userTypes,
    jev_types,
    jev_status,
    loading: mappingLoading,
    //Keys
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
    forPurchaseKey,
    paidKey,
    receivedKey,
    chequeKey,
    deliveredKey,
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
  const [ewtAmount, setEwtAmount] = useState(0);
  const [ewtLoading, setEwtLoading] = useState(false);
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

  // ── JEV balance check ────────────────────────────────────────────────
  useEffect(() => {
    const jevId = voucher?.jev?.nJEVId;
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
  }, [
    voucher?.jev?.nJEVId,
    voucher?.jev?.entries,
    particularsGrandTotal,
    balanceRefreshKey, // ✅ re-run when entries change elsewhere
  ]);

  // ── Real-time: JEV entries changed (from JevViewPanel or another tab) ──
  useEffect(() => {
    const jevId = voucher?.jev?.nJEVId;

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
  }, [voucher?.jev?.nJEVId]);
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
  // ── EWT fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!voucher || isAssigneeType) {
      setEwtAmount(0);
      return;
    }

    const transactionIds = Array.from(
      new Set(
        supplierLinks
          .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
          .map(
            (opt) =>
              opt.purchase_option?.transaction_item?.transaction
                ?.nTransactionId,
          )
          .filter(Boolean),
      ),
    );

    if (!transactionIds.length) return;

    let active = true;
    setEwtLoading(true);

    const getCachedOptions = async () => {
      const cached = sessionStorage.getItem("direct_cost_options_cache");
      if (cached) return JSON.parse(cached);
      const res = await DirectCostOptionAPI.getDirectCostOptions();
      const opts = res.data || res || [];
      sessionStorage.setItem("direct-cost-options_cache", JSON.stringify(opts));
      return opts;
    };

    const fetchEwt = async () => {
      try {
        const [options, ...costsResults] = await Promise.all([
          getCachedOptions(),
          ...transactionIds.map((id) =>
            DirectCostAPI.getDirectCosts({
              nTransactionID: id,
              withEWT: 1,
            }).catch(() => null),
          ),
        ]);
        if (!active) return;

        const getOptionName = (optionId) =>
          (
            options.find((o) => (o.nDirectCostOptionID || o.id) === optionId)
              ?.strName || ""
          ).toLowerCase();

        let totalEwt = 0;
        costsResults.forEach((costsRes) => {
          if (!costsRes) return;
          const directCosts = costsRes.directCosts || costsRes.data || [];
          let ewt = 0;
          directCosts.forEach((cost) => {
            if (getOptionName(cost.nDirectCostOptionID).includes("ewt"))
              ewt += Number(cost.dAmount || 0);
          });
          totalEwt += ewt > 0 ? ewt : Number(costsRes.totalEWT || 0);
        });
        setEwtAmount(totalEwt);
      } catch (err) {
        console.error("EWT fetch error:", err);
      } finally {
        if (active) setEwtLoading(false);
      }
    };

    fetchEwt();
    return () => {
      active = false;
    };
  }, [voucher, isAssigneeType, supplierLinks.length]);

  // ── Purchase option histories ────────────────────────────────────────
  useEffect(() => {
    if (!voucher || isAssigneeType || !paidKey) return;

    const ids = (voucher.voucher_suppliers ?? [])
      .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
      .map((o) => o.purchase_option?.nPurchaseOptionId)
      .filter(Boolean);

    if (!ids.length) return;

    setHistoriesLoading(true);
    PurchaseItemHistoriesAPI.getLatest({ nPurchaseOptionId: ids })
      .then((res) => {
        const map = {};
        (res?.histories || []).forEach(
          (h) => (map[Number(h.nPurchaseOptionId)] = h),
        );
        setOptionHistories(map);
      })
      .catch((err) => console.error("History fetch error:", err))
      .finally(() => setHistoriesLoading(false));
  }, [voucher, paidKey, isAssigneeType]);

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

  const allOptionsEligibleForPaid =
    !isAssigneeType &&
    !historiesLoading &&
    supplierLinks.length > 0 &&
    supplierLinks
      .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
      .every((o) => {
        const status = String(
          optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
            ?.nStatus ?? "",
        );
        return ![paidKey, receivedKey, deliveredKey].includes(status);
      });

  const allOptionsPaid =
    !isAssigneeType &&
    !historiesLoading &&
    supplierLinks.length > 0 &&
    supplierLinks
      .flatMap((vs) => vs.purchase_order?.purchase_order_options ?? [])
      .every((o) => {
        const status = String(
          optionHistories[Number(o.purchase_option?.nPurchaseOptionId)]
            ?.nStatus ?? "",
        );
        return [paidKey, receivedKey, deliveredKey].includes(status);
      });
  // ✅ FIXED
  const isClosed = String(voucher?.cStatus) === String(voucherClosedKey);
  const isMarkedPaid = String(voucher?.cStatus) === String(voucherPaidKey);
  const isEligibleForPaid = isClosed; // Mark as Paid → ONLY when Closed
  const isEligibleForUnpaid = isMarkedPaid; // Mark as Unpaid → ONLY when Paid
  const canShowPrintButtons = isClosed || isMarkedPaid;
  const cPaymentTerms =
    voucher?.voucher_suppliers?.[0]?.purchase_order?.cPaymentTerms ?? null;

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
      : supplierLinks.map((vs) => ({
          particular:
            vs.purchase_order?.strPurchaseOrderNo ??
            `PO #${vs.nPurchaseOrderId}`,
          amount: (vs.purchase_order?.purchase_order_options ?? []).reduce(
            (sum, o) =>
              sum +
              (o.purchase_option?.nQuantity || 0) *
                (o.purchase_option?.dUnitPrice || 0),
            0,
          ),
        }));

  const handlePrintVoucher = async () => {
    sessionStorage.setItem(
      "printVoucher_data",
      JSON.stringify({
        voucher,
        isAssigneeType,
        payeeName,
        payeeNickName,
        supplierTIN,
        supplierAddress,
        particulars: buildParticulars(),
        cPaymentTerms,
        ewtAmount: isAssigneeType ? 0 : ewtAmount,
      }),
    );

    if (String(voucher.cStatus) === String(voucherActiveKey)) {
      await VoucherAPI.updateVoucherStatus(
        voucher.nVoucherId,
        voucherClosedKey,
      );
      await fetchVoucher();
      notifyUpdated();
    }

    printRoute("/print-voucher");
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
        await withSpinner(entity, handlePrintVoucher);
        await fetchVoucher();
      } catch (err) {
        console.error("Print voucher error:", err);
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
                    nStatus: paidKey,
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
                    nStatus: forPurchaseKey,
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

      // ✅ ADDED "paid" and "unpaid" to this list
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
    loading: loading || mappingLoading,
    voucherId,
    voucherAssigneeTypeKey,
    voucherActiveKey,
    voucherClosedKey,
    voucherPaidKey,
    voucherCancelledKey,
    voucherStatus,
    paidKey,
    receivedKey,
    deliveredKey,
    currentUserId,
    isManagement,
    isFinanceOfficer,
    chequeKey,
    forPurchaseKey,
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
    fetchVoucher,
    jev_types,
    jev_status,
    jevPendingKey,
    canShowPrintButtons,
  };
}
