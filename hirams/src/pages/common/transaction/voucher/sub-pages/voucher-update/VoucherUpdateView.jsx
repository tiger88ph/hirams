import { Box, Typography, Tooltip, useTheme } from "@mui/material";
import {
  StoreOutlined,
  ReceiptLongOutlined,
  RemoveCircleOutline,
  AddOutlined,
  CheckCircleOutline,
} from "@mui/icons-material";
import { useMemo } from "react";
import PageLayout from "../../../../../../layouts/page/content-page";
import JevViewPanel from "../../../jev/components/JevViewPanel.jsx";
import BaseButton from "../../../../../../components/form/BaseButton.jsx";
import ContentHeaderStructure from "../../../../../../components/structure/ContentHeaderStructure.jsx";
import CardStructure from "../../../../../../components/structure/CardStructure.jsx";
import { VoucherUpdateSkeleton } from "../../components/Skeleton.jsx";
import ParticularsAEModal from "../../modal/ParticularsAEModal.jsx";
import VoucherUpdateModal from "../../modal/VoucherUpdateModal.jsx";
import POListPanel from "../../components/POListPanel.jsx";
import AssigneeListPanel from "../../components/AssigneeListPanel.jsx";
import { fmtDate, fmtPHP } from "../../../../../../utils/formatters/formatter";
import useVoucherUpdate from "./useVoucherUpdate";
import getThemeColors from "../../../../../../utils/style/getThemeColors.js";
import icons from "../../../../../../utils/style/iconFormatStyles.jsx";

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
      {showJevPanel && (
        <BaseButton
          label="Close JEV"
          icon={icons.close}
          onClick={() => setShowJevPanel(false)}
          actionColor="cancel"
          disabled={confirmLoading || saving}
        />
      )}
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
      {(String(voucher.cStatus) === String(voucherClosedKey) ||
        String(voucher.cStatus) === String(voucherPaidKey)) && (
        <>
          {!showJevPanel && (
            <>
              {String(voucher.cStatus) === String(voucherClosedKey) && (
                <BaseButton
                  label="Cancel"
                  icon={icons.cancel}
                  onClick={() => setConfirmAction("cancel")}
                  actionColor="delete"
                  disabled={confirmLoading || saving}
                />
              )}
              {!isMarkedPaid &&
                !hasJev &&
                String(voucher.cStatus) === String(voucherClosedKey) && (
                  <BaseButton
                    label="Reopen"
                    icon={icons.open}
                    onClick={() => setConfirmAction("reopen")}
                    actionColor="default"
                    disabled={confirmLoading || saving}
                  />
                )}
            </>
          )}
          {!hasJev ? (
            <BaseButton
              label="Add JEV"
              icon={icons.add}
              onClick={handleAddJev}
              actionColor="approve"
              disabled={confirmLoading || saving}
            />
          ) : !showJevPanel ? (
            <BaseButton
              label="View JEV"
              icon={icons.view}
              onClick={handleViewJev}
              actionColor="approve"
              disabled={confirmLoading || saving}
            />
          ) : (
            " "
          )}
          {(isManagement || isFinanceOfficer) &&
            showJevPanel &&
            voucher.jev && (
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
              {hasJev && !jevBalanceLoading && jevBalanceMessage && (
                <Typography
                  sx={{
                    fontSize: { xs: "0.5rem", sm: "0.55rem" },
                    fontStyle: "italic",
                    color: c.red.text,
                    mt: 0.3,
                  }}
                >
                  {jevBalanceMessage}
                </Typography>
              )}
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

          {canShowPrintButtons &&
            hasJev &&
            String(voucher.jev?.cStatus) !== String(jevPendingKey) &&
            (() => {
              const showPrintCheque =
                (isManagement || isFinanceOfficer) &&
                String(cPaymentTerms) === String(chequeKey);
              const printCount = showPrintCheque ? 2 : 1;
              const showMarkPaid =
                isEligibleForPaid &&
                !isMarkedPaid &&
                (isFinanceOfficer || isManagement);
              const showMarkUnpaid = isEligibleForUnpaid;
              const showPaidSection = showMarkPaid || showMarkUnpaid;
              const paidCount = showPaidSection ? 1 : 0;
              const shouldMerge = printCount === 1 && paidCount === 1;
              const printVoucherBtn = (
                <Box
                  component="button"
                  onClick={handlePreviewVoucher} // ✅ direct call, no confirmation modal
                  disabled={confirmLoading || saving}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.4,
                    px: 1,
                    py: 0.4,
                    borderRadius: "6px",
                    border: `1px solid ${c.border}`,
                    background: isDark ? "rgba(30,41,59,0.8)" : "#FFFFFF",
                    color: c.gray.label,
                    fontSize: { xs: "0.65rem", sm: "0.7rem" },
                    fontWeight: 600,
                    cursor: "pointer",
                    ...(printCount === 1 && { flex: 1 }),
                    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
                    "&:hover:not(:disabled)": {
                      background: isDark ? "rgba(30,41,59,0.95)" : "#F9FAFB",
                    },
                  }}
                >
                  <ReceiptLongOutlined
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                  />
                  Preview Voucher {/* ✅ renamed label */}
                </Box>
              );
              const printChequeBtn = showPrintCheque && (
                <Box
                  component="button"
                  onClick={handlePreviewCheque}
                  disabled={confirmLoading || saving}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.4,
                    px: 1,
                    py: 0.4,
                    borderRadius: "6px",
                    border: `1px solid ${c.border}`,
                    background: isDark ? "rgba(30,41,59,0.8)" : "#FFFFFF",
                    color: c.gray.label,
                    fontSize: { xs: "0.65rem", sm: "0.7rem" },
                    fontWeight: 600,
                    cursor: "pointer",
                    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
                    "&:hover:not(:disabled)": {
                      background: isDark ? "rgba(30,41,59,0.95)" : "#F9FAFB",
                    },
                  }}
                >
                  <StoreOutlined
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                  />
                  Preview Cheque
                </Box>
              );
              const paidBtn = showMarkPaid && (
                <Box
                  component="button"
                  onClick={() => setConfirmAction("paid")}
                  disabled={confirmLoading || saving}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.4,
                    px: 1,
                    py: 0.4,
                    borderRadius: "6px",
                    border: `1px solid ${c.green.border}`,
                    background: c.green.bg,
                    color: c.green.text,
                    fontSize: { xs: "0.65rem", sm: "0.7rem" },
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
                    "&:hover:not(:disabled)": {
                      background: isDark ? "rgba(22,163,74,0.25)" : "#DCFCE7",
                    },
                  }}
                >
                  <CheckCircleOutline
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                  />
                  Mark as Paid
                </Box>
              );
              const unpaidBtn = showMarkUnpaid && (
                <Box
                  component="button"
                  onClick={() => setConfirmAction("unpaid")}
                  disabled={confirmLoading || saving}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.4,
                    px: 1,
                    py: 0.4,
                    borderRadius: "6px",
                    border: `1px solid ${c.amber.border}`,
                    background: c.amber.bg,
                    color: c.amber.text,
                    fontSize: { xs: "0.65rem", sm: "0.7rem" },
                    fontWeight: 600,
                    cursor: "pointer",
                    flex: 1,
                    "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
                    "&:hover:not(:disabled)": {
                      background: isDark ? "rgba(245,158,11,0.2)" : "#FEF3C7",
                    },
                  }}
                >
                  <RemoveCircleOutline
                    sx={{ fontSize: { xs: "0.7rem", sm: "0.8rem" } }}
                  />
                  Mark as Unpaid
                </Box>
              );
              const containerSx = {
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0.5,
                px: 1,
                py: 0.75,
                borderRadius: "8px",
                background: isDark ? "rgba(15,23,42,0.4)" : "#F3F4F6",
                border: `0.5px solid ${c.border}`,
                minWidth: { xs: "100%", sm: "140px" },
              };
              if (shouldMerge)
                return (
                  <Box sx={containerSx}>
                    {printVoucherBtn}
                    {paidBtn}
                    {unpaidBtn}
                  </Box>
                );
              return (
                <>
                  <Box sx={containerSx}>
                    {printVoucherBtn}
                    {printChequeBtn}
                  </Box>
                  {showPaidSection && (
                    <Box sx={containerSx}>
                      {paidBtn}
                      {unpaidBtn}
                    </Box>
                  )}
                </>
              );
            })()}
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
          <AssigneeListPanel
            assigneeLinks={assigneeLinks}
            onEdit={
              String(voucher.cStatus) === String(voucherActiveKey)
                ? handleEditAssignee
                : undefined
            }
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
      {showJevPanel && (
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
            onClose={() => setShowJevPanel(false)}
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
            companyName={
              company?.strCompanyNickName ?? null
            }
            flowType="voucher"
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
