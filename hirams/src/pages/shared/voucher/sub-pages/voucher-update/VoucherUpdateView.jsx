import { Box, Typography, Tooltip, useTheme } from "@mui/material";
import {
  StoreOutlined,
  ReceiptLongOutlined,
  RemoveCircleOutline,
  AddOutlined,
  CheckCircleOutline,
  WarningAmberOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { useMemo, useState } from "react";
import PageLayout from "../../../../../components/layouts/page/content-page/index.jsx";
import JevViewPanel from "../../../jev/components/JevViewPanel.jsx";
import BaseButton from "../../../../../components/ui/form/BaseButton.jsx";
import ContentHeaderStructure from "../../../../../components/ui/structure/ContentHeaderStructure.jsx";
import CardStructure from "../../../../../components/ui/structure/CardStructure.jsx";
import { VoucherUpdateSkeleton } from "../../components/Skeleton.jsx";
import ParticularsAEModal from "../../modal/ParticularsAEModal.jsx";
import VoucherUpdateModal from "../../modal/VoucherUpdateModal.jsx";
import POListPanel from "../../components/POListPanel.jsx";
import AssigneeListPanel from "../../components/AssigneeListPanel.jsx";
import { fmtDate, fmtPHP } from "../../../../../utils/formatters/formatter";
import useVoucherUpdate from "./useVoucherUpdate";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
import icons from "../../../../../utils/style/iconFormatStyles.jsx";

// ── Local Color Map — only tokens verified in getThemeColors ──────────
const useColors = (c) => ({
  border: c.slate.border,
  borderLight: c.slate.borderLight,
  violet: { bg: c.violet.bg, text: c.violet.text },
  blue: { bg: c.blue.bg, text: c.blue.text, textStrong: c.blue.textStrong },
  green: {
    bg: c.green.bg,
    text: c.green.text,
    border: c.green.border,
    hover: c.green.hover,
    active: c.green.active,
  },
  amber: {
    bg: c.amber.bg,
    text: c.amber.text,
    border: c.amber.border,
    hover: c.amber.hover,
    // warning-banner tokens — same ones the print/preview banner uses
    warnBg: c.amber.warnBg,
    warnBorder: c.amber.warnBorder,
    warnText: c.amber.warnText,
  },
  red: { text: c.red.text },
  slate: { border: c.slate.border, borderLight: c.slate.borderLight },
  gray: {
    textPrimary: c.gray.textPrimary,
    textSecondary: c.gray.textSecondary,
    textMuted: c.gray.textMuted,
    label: c.gray.label,
  },
});

export function SectionLabel({
  children,
  onAddItem,
  addLabel = "Add Item",
  badge,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const c = useMemo(() => useColors(base), [base]);

  return (
    <Box sx={{ pb: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
      <Typography
        sx={{
          fontSize: "0.58rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "text.disabled",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </Typography>
      <Box sx={{ flex: 1, height: "0.5px", background: c.borderLight }} />
      {badge}
      {onAddItem && (
        <Box
          onClick={onAddItem}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.35,
            px: 0.75,
            py: 0.3,
            borderRadius: "5px",
            background: c.green.bg,
            border: `0.5px solid ${c.green.border}`,
            cursor: "pointer",
            flexShrink: 0,
            transition: "all 0.15s",
            "&:hover": { background: c.green.hover, borderColor: c.green.text },
            "&:active": { background: c.green.active },
          }}
        >
          <AddOutlined sx={{ fontSize: "0.6rem", color: c.green.text }} />
          <Typography
            sx={{
              fontSize: "0.55rem",
              fontWeight: 700,
              color: c.green.text,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {addLabel}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
export default function VoucherUpdateView() {
  const vu = useVoucherUpdate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const c = useMemo(() => useColors(base), [base]);
  // Dismiss is remembered per message: a new balance figure re-shows it.
  const [dismissedBalanceMsg, setDismissedBalanceMsg] = useState(null);

  const { voucher, loading, handleBack, confirmLoading, saving } = vu;
  const goBack = handleBack;

  // ⬅ Back button doesn't depend on voucher data — build it before the guard
  // so it's visible during the initial fetch too, not just after.
  const footerLActions = (
    <BaseButton
      label="Back"
      icon={icons.back}
      onClick={goBack}
      actionColor="cancel"
      disabled={confirmLoading || saving}
    />
  );

  if (loading || !voucher) {
    return (
      <PageLayout
        title="Disbursement Voucher"
        footerLActions={footerLActions}
        loading={loading}
      >
        <VoucherUpdateSkeleton />
      </PageLayout>
    );
  }

  const {
    voucherActiveKey,
    voucherClosedKey,
    voucherPaidKey,
    voucherCancelledKey,
    isManagement,
    isFinanceOfficer,
    chequeKey,
    jevDisbursementVoucherKey,
    isAssigneeType,
    assigneeLinks,
    supplierLinks,
    hasJev,
    hasActiveJev,
    particularsCount,
    payeeNickName,
    supplierTIN,
    supplierAddress,
    cPaymentTerms,
    isEligibleForPaid,
    isEligibleForUnpaid,
    isMarkedPaid,
    ewtAmount,
    ewtLoading,
    showAddItem,
    setShowAddItem,
    editingAssignee,
    setEditingAssignee,
    formData,
    setFormData,
    formErrors,
    confirmAction,
    setConfirmAction,
    showJevConfirm,
    setShowJevConfirm,
    showJevPanel,
    isJevBalanced,
    jevBalanceLoading,
    jevBalanceMessage,
    setShowJevPanel,
    handleAddJev,
    handleViewJev,
    confirmCreateJev,
    handleRemovePO,
    handleEditAssignee,
    handleDeleteAssignee,
    handleSaveAssignee,
    handleConfirmAction,
    handlePreviewVoucher, // ✅ add this
    handlePreviewCheque,
    fetchVoucher,
    particularsGrandTotal,
    jev_types,
    jev_status,
    jevPendingKey,
    canShowPrintButtons,
    getAnyOptionArrived,
    payeeName,
    company,
  } = vu;
  const showFooterPrint =
    canShowPrintButtons &&
    hasJev &&
    String(voucher.jev?.cStatus) !== String(jevPendingKey);
  const showPrintCheque =
    showFooterPrint &&
    (isManagement || isFinanceOfficer) &&
    String(cPaymentTerms) === String(chequeKey);
  const showMarkPaid =
    showFooterPrint &&
    isEligibleForPaid &&
    !isMarkedPaid &&
    (isFinanceOfficer || isManagement);
  const showMarkUnpaid = showFooterPrint && isEligibleForUnpaid;
  const isClosedOrPaid =
    String(voucher.cStatus) === String(voucherClosedKey) ||
    String(voucher.cStatus) === String(voucherPaidKey);
  // Particulars stay editable while the voucher is ACTIVE, and also while it
  // is CLOSED — so a JEV that has not been finalized yet can still be squared
  // against the particulars. Add / Delete remain active-only.
  const canEditParticulars =
    String(voucher.cStatus) === String(voucherActiveKey) ||
    String(voucher.cStatus) === String(voucherClosedKey);
  const showNoJev = isClosedOrPaid && !hasJev;
  // ── JEV balance banner — sits under the "Particulars (n)" label ───────
  // Same look as the banner in the print/preview voucher: amber wash, dashed
  // rule, warning icon, message + dismiss. Shown only while the JEV still
  // needs fixing (particulars total ≠ From total ≠ To total, or no entries).
  const showBalanceBanner =
    hasJev &&
    !jevBalanceLoading &&
    !!jevBalanceMessage &&
    dismissedBalanceMsg !== jevBalanceMessage;
  const jevBalanceBanner = showBalanceBanner ? (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 1,
        // mt:0 keeps the label's own pb:1 as the single gap (same 8px the
        // list panels get); mb:1 stops the border crowding the panel below.
        mt: 0,
        mb: 1,
        px: 2,
        py: 0.75,
        borderRadius: "8px",
        bgcolor: c.amber.warnBg,
        border: `1px dashed ${c.amber.warnBorder}`,
      }}
    >
      <WarningAmberOutlined
        sx={{ fontSize: "1rem", color: c.amber.warnText, flexShrink: 0 }}
      />
      <Box
        sx={{
          fontSize: "0.72rem",
          color: c.amber.warnText,
          lineHeight: 1.4,
          pr: 3,
        }}
      >
        <strong>{jevBalanceMessage}</strong>
      </Box>
      <Box
        component="button"
        onClick={() => setDismissedBalanceMsg(jevBalanceMessage)}
        aria-label="Dismiss banner"
        sx={{
          position: "absolute",
          right: 8,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          p: 0.4,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: c.amber.warnText,
        }}
      >
        <CloseOutlined sx={{ fontSize: "0.9rem" }} />
      </Box>
    </Box>
  ) : null;
  const activeConfirm = confirmAction
    ? {
        action: confirmAction,
        loading: confirmLoading,
        onConfirm: handleConfirmAction,
        onClose: () => setConfirmAction(null),
      }
    : showJevConfirm
      ? {
          action: "add_jev",
          loading: false,
          onConfirm: confirmCreateJev,
          onClose: () => setShowJevConfirm(false),
        }
      : null;

  const footerRActions = (
    <Box
      sx={{
        display: "flex",
        gap: 0.75,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {String(voucher.cStatus) === String(voucherActiveKey) && (
        <>
          <BaseButton
            label="Cancel"
            icon={icons.cancel}
            onClick={() => setConfirmAction("cancel")}
            actionColor="delete"
            disabled={confirmLoading || saving}
          />
          <BaseButton
            label="Close"
            icon={icons.close}
            onClick={() => setConfirmAction("close")}
            actionColor="approve"
            disabled={confirmLoading || saving}
          />
        </>
      )}
      {isClosedOrPaid && (
        <>
          <BaseButton
            label="Cancel"
            icon={icons.cancel}
            onClick={() => setConfirmAction("cancel")}
            actionColor="delete"
            disabled={confirmLoading || saving}
          />

          {!isMarkedPaid &&
            String(voucher.cStatus) === String(voucherClosedKey) &&
            (!hasJev ||
              String(voucher.jev?.cStatus) === String(jevPendingKey)) && (
              <BaseButton
                label="Reopen"
                icon={icons.open}
                onClick={() => setConfirmAction("reopen")}
                actionColor="default"
                disabled={confirmLoading || saving}
              />
            )}
          {!hasJev && (
            <BaseButton
              label="Create JEV"
              icon={icons.add}
              onClick={handleAddJev}
              actionColor="approve"
              disabled={confirmLoading || saving}
            />
          )}
          {(isManagement || isFinanceOfficer) &&
            hasJev &&
            voucher.jev &&
            !isMarkedPaid && (
              <Tooltip
                title={
                  jevBalanceLoading
                    ? "Checking JEV balance…"
                    : String(voucher.jev?.cStatus) === String(jevPendingKey) &&
                        !isJevBalanced
                      ? jevBalanceMessage ||
                        "JEV totals must be equal before finalizing"
                      : String(voucher.jev?.cStatus) === String(jevPendingKey)
                        ? "Finalize this JEV"
                        : isMarkedPaid
                          ? "Voucher has been already paid."
                          : "Undo Finalize this JEV"
                }
                arrow
              >
                <span>
                  <BaseButton
                    label={
                      String(voucher.jev?.cStatus) === String(jevPendingKey)
                        ? "Finalize"
                        : "Undo Finalize"
                    }
                    icon={
                      String(voucher.jev?.cStatus) === String(jevPendingKey)
                        ? icons.finalize
                        : icons.revert
                    }
                    onClick={() =>
                      setConfirmAction(
                        String(voucher.jev?.cStatus) === String(jevPendingKey)
                          ? "finalize_jev"
                          : "undo_finalize_jev",
                      )
                    }
                    actionColor={
                      String(voucher.jev?.cStatus) === String(jevPendingKey)
                        ? "approve"
                        : "delete"
                    }
                    disabled={
                      isMarkedPaid ||
                      confirmLoading ||
                      saving ||
                      jevBalanceLoading ||
                      (String(voucher.jev?.cStatus) === String(jevPendingKey) &&
                        !isJevBalanced)
                    }
                  />
                </span>
              </Tooltip>
            )}
        </>
      )}
      {showFooterPrint && (
        <>
          <BaseButton
            label="Preview Voucher"
            icon={<ReceiptLongOutlined sx={{ fontSize: "1rem" }} />}
            onClick={handlePreviewVoucher}
            actionColor="default"
            disabled={confirmLoading || saving}
          />
          {/* Preview Cheque moved out of the footer — it now sits on the Fund
              account line inside the JEV panel (see JevViewPanel). */}
          {showMarkUnpaid && (
            <BaseButton
              label="Mark as Unpaid"
              icon={<RemoveCircleOutline sx={{ fontSize: "1rem" }} />}
              onClick={() => setConfirmAction("unpaid")}
              actionColor="cancel"
              disabled={confirmLoading || saving}
            />
          )}
          {showMarkPaid && (
            <BaseButton
              label="Mark as Paid"
              icon={<CheckCircleOutline sx={{ fontSize: "1rem" }} />}
              onClick={() => setConfirmAction("paid")}
              actionColor="approve"
              disabled={confirmLoading || saving}
            />
          )}
        </>
      )}
      {String(voucher.cStatus) === String(voucherCancelledKey) && (
        <Typography
          sx={{ color: c.red.text, fontWeight: 600, fontSize: "0.85rem" }}
        >
          ✅ Cancelled
        </Typography>
      )}
    </Box>
  );

  const VoucherHeader = (
    <Box sx={{ position: "relative", overflow: "hidden", mb: 0 }}>
      <ContentHeaderStructure textAlign="left">
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 0.75, sm: 1 },
            alignItems: "stretch",
          }}
        >
          {/* ── Supplier / Assignee card ─────────────────────────── */}
          <CardStructure
            icon={<StoreOutlined />}
            label={isAssigneeType ? "Assignee" : "Supplier"}
            variant="info"
            flex={1}
            dense
          >
            <Typography
              sx={{
                fontSize: { xs: "0.65rem", sm: "0.7rem" },
                fontWeight: 700,
                color: c.gray.textPrimary,
                mb: 0.2,
              }}
            >
              {payeeNickName}
            </Typography>
            {supplierAddress && (
              <Typography
                sx={{
                  fontSize: { xs: "0.5rem", sm: "0.55rem" },
                  color: c.gray.textSecondary,
                }}
              >
                {supplierAddress}
              </Typography>
            )}
            {supplierTIN && (
              <Typography
                sx={{
                  fontSize: { xs: "0.5rem", sm: "0.55rem" },
                  color: c.gray.textMuted,
                  mt: 0.2,
                }}
              >
                TIN: {supplierTIN}
              </Typography>
            )}
          </CardStructure>

          {/* ── No. HDV card ─────────────────────────────────────── */}
          <Box sx={{ position: "relative", flex: 1 }}>
            <CardStructure
              icon={<ReceiptLongOutlined />}
              label="DV No."
              variant="info"
              flex={1}
              dense
            >
              <Typography
                sx={{
                  fontSize: { xs: "0.65rem", sm: "0.7rem" },
                  fontWeight: 700,
                  color: c.gray.textPrimary,
                  mb: 0.2,
                }}
              >
                {voucher.strNumber ?? "—"}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "0.5rem", sm: "0.55rem" },
                  color: c.gray.textSecondary,
                }}
              >
                Created {fmtDate(voucher.dtCreated)}
              </Typography>
            </CardStructure>

            {(String(voucher.cStatus) === String(voucherClosedKey) ||
              String(voucher.cStatus) === String(voucherPaidKey)) &&
              isMarkedPaid && (
                <Box
                  sx={{
                    position: "absolute",
                    top: { xs: 6, sm: "50%" },
                    right: 8,
                    transform: { xs: "none", sm: "translateY(-50%)" },
                    width: { xs: 24, sm: 28 },
                    height: { xs: 24, sm: 28 },
                    borderRadius: "50%",
                    border: `2px solid ${c.green.border}`,
                    outline: `1px solid ${c.green.border}`,
                    outlineOffset: "2px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: "0.35rem", sm: "0.42rem" },
                      fontWeight: 900,
                      color: c.green.text,
                      border: `1px solid ${c.green.text}`,
                      borderRadius: "4px",
                      px: 0.4,
                      py: 0.2,
                      transform: "rotate(-15deg)",
                      textTransform: "uppercase",
                      userSelect: "none",
                    }}
                  >
                    PAID
                  </Typography>
                </Box>
              )}
          </Box>
        </Box>
      </ContentHeaderStructure>
    </Box>
  );

  return (
    <PageLayout
      title="Disbursement Voucher"
      subtitle={`${vu.voucherStatus?.[voucher.cStatus] || ""} / ${voucher.strNumber || ""}`}
      footerLActions={footerLActions}
      footerRActions={footerRActions}
      loading={confirmLoading || saving}
    >
      {VoucherHeader}
      {isAssigneeType ? (
        <>
          <SectionLabel
            onAddItem={
              String(voucher.cStatus) === String(voucherActiveKey)
                ? () => setShowAddItem(true)
                : undefined
            }
          >
            Particulars ({particularsCount})
          </SectionLabel>
          {jevBalanceBanner}
          <AssigneeListPanel
            assigneeLinks={assigneeLinks}
            onEdit={canEditParticulars ? handleEditAssignee : undefined}
            onDelete={
              String(voucher.cStatus) === String(voucherActiveKey)
                ? handleDeleteAssignee
                : undefined
            }
            voucherActiveKey={voucherActiveKey}
            voucher={voucher}
          />
        </>
      ) : (
        <>
          <SectionLabel
            onAddItem={
              String(voucher.cStatus) === String(voucherActiveKey)
                ? () => setShowAddItem(true)
                : undefined
            }
          >
            Particulars ({particularsCount})
          </SectionLabel>
          {jevBalanceBanner}
          <POListPanel
            supplierLinks={supplierLinks}
            onRemovePO={
              String(voucher.cStatus) === String(voucherActiveKey)
                ? handleRemovePO
                : undefined
            }
          />
        </>
      )}
      {showNoJev && (
        <Box>
          <SectionLabel>Journal Entry Voucher</SectionLabel>
          <Box
            sx={{
              py: 3,
              textAlign: "center",
              fontSize: "0.75rem",
              fontStyle: "italic",
              color: c.gray.textSecondary,
              border: `1px dashed ${c.border}`,
              borderRadius: "10px",
            }}
          >
            No JEV added yet.
          </Box>
        </Box>
      )}
      {isClosedOrPaid && hasJev && (
        <Box>
          <SectionLabel>Journal Entry Voucher</SectionLabel>
          <JevViewPanel
            jev={
              voucher.jev || {
                nJEVId: voucher.nJEVId,
                cJEVLinkType: jevDisbursementVoucherKey,
              }
            }
            voucherNumber={voucher.strNumber}
            particularsGrandTotal={particularsGrandTotal}
            onClose={() => {}}
            jev_types={jev_types}
            jev_status={jev_status}
            jevPendingKey={jevPendingKey}
            isJevBalanced={isJevBalanced}
            jevBalanceLoading={jevBalanceLoading}
            isAssigneeType={isAssigneeType}
            assigneeLinks={assigneeLinks}
            supplierLinks={supplierLinks}
            isFinanceOfficer={isFinanceOfficer}
            isManagement={isManagement}
            supplierInfo={{
              strSupplierName: payeeName,
              strSupplierNickName: payeeNickName,
              strAddress: supplierAddress,
              strTIN: supplierTIN,
            }}
            supplierLabel={isAssigneeType ? "Assignee" : "Supplier"}
            companyName={company?.strCompanyNickName ?? null}
            flowType="voucher"
            // Print Cheque lives on the Fund account line now — same gates as
            // before (role + cheque payment terms + finalized JEV), but the
            // button renders on the account that actually holds the money.
            // isClosedOrPaidVoucher keeps it exclusive to this view: any other
            // JEV panel usage (purchase, item purchasing) stays hidden.
            isClosedOrPaidVoucher={isClosedOrPaid}
            showPrintCheque={showPrintCheque}
            onPrintCheque={handlePreviewCheque}
          />
        </Box>
      )}
      <ParticularsAEModal
        open={showAddItem}
        onClose={() => {
          setShowAddItem(false);
          setEditingAssignee(null);
        }}
        isAssigneeType={isAssigneeType}
        voucher={voucher}
        editingAssignee={editingAssignee}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        saving={saving}
        onSave={handleSaveAssignee}
        onSuccess={fetchVoucher}
        voucherActiveKey={voucherActiveKey}
        voucherClosedKey={voucherClosedKey}
      />
      <VoucherUpdateModal
        open={!!activeConfirm}
        action={activeConfirm?.action}
        voucherNumber={voucher.strNumber}
        loading={activeConfirm?.loading}
        onConfirm={activeConfirm?.onConfirm}
        onClose={activeConfirm?.onClose}
      />
    </PageLayout>
  );
}
