import React, { useState } from "react";
import { Box, Typography, Divider } from "@mui/material";
import {
  Inventory2Outlined,
  WarningAmberOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import {
  fmtDate,
  fmtPHP,
} from "../../../../../../utils/formatters/formatter.js";
import JevViewPanel from "../../../../jev/components/JevViewPanel.jsx";
import BatchHistoryTable from "./BatchHistoryTable.jsx";

import { JevSelector, SupplierCompanyBreadcrumb } from "./ArriveCommon.jsx";

export default function JevView({
  c,
  p,
  jevId,
  qty,
  eqValue,
  equivalentValue = 0,
  logs = [],
  jev,
  loading,
  error,
  jevPendingKey,
  isFinanceOfficer,
  isManagement,
  balance,
  flowType = "received",
  jevIds = [],
  onSelectJev,
  showJevSelector = false,
}) {
  const isPending = String(jev?.cStatus) === String(jevPendingKey);
  const [dismissedMsg, setDismissedMsg] = useState(null);
  const showBanner =
    jev &&
    isPending &&
    !balance.loading &&
    !!balance.message &&
    dismissedMsg !== balance.message;
  return (
    <Box>
      {/* BANNER */}
      {showBanner && (
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "left",
            gap: 1,
            px: 4,
            py: 0.75,
            mx: -1.5,
            mt: -1.5,
            mb: 1.5,
            bgcolor: c.pendingBg,
            borderBottom: `1px dashed ${c.pendingBorder}`,
          }}
        >
          <WarningAmberOutlined
            sx={{ fontSize: "1rem", color: c.pendingText, flexShrink: 0 }}
          />
          <Box
            sx={{
              fontSize: "0.72rem",
              color: c.pendingText,
              lineHeight: 1.4,
            }}
          >
            <strong>{balance.message}</strong>
          </Box>
          <Box
            component="button"
            onClick={() => setDismissedMsg(balance.message)}
            aria-label="Dismiss banner"
            sx={{
              position: "absolute",
              right: 8,
              top: "50%",
              transform: "translateY(-50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 0.4,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: c.pendingText,
            }}
          >
            <CloseOutlined sx={{ fontSize: "0.9rem" }} />
          </Box>
        </Box>
      )}

      {/* ITEM INFO (same info as the item row) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: "6px",
            background: c.btnBgDisabled,
            border: `0.5px solid ${c.inputBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Inventory2Outlined
            sx={{ fontSize: "0.75rem", color: c.iconMuted }}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.4,
              mb: 0.2,
              flexWrap: "wrap",
            }}
          >
            {(p?.strBrand || p?.strModel) && (
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: c.textPrimary,
                }}
              >
                {[p?.strBrand, p?.strModel].filter(Boolean).join(" · ")}
              </Typography>
            )}
            <Box
              sx={{
                display: "inline-flex",
                px: 0.35,
                py: 0.08,
                borderRadius: "50px",
                background: c.blueBg,
                border: `0.5px solid ${c.blueBorder}`,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.45rem",
                  fontWeight: 500,
                  color: c.blueTextAlt,
                  lineHeight: 1,
                }}
              >
                {p?.transaction_item?.transaction?.strCode ?? "—"}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: "0.58rem", color: c.textSecondary }}>
            {p?.transaction_item?.strName ?? "—"}
          </Typography>
          <Typography
            sx={{ fontSize: "0.48rem", color: c.iconMuted, mt: 0.15 }}
          >
            Delivery:{" "}
            {fmtDate(p?.transaction_item?.transaction?.dtDelivery) || "—"}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0.5,
            }}
          >
            <Box
              component="span"
              sx={{
                px: 0.6,
                py: 0.18,
                borderRadius: "6px",
                fontSize: "0.45rem",
                fontWeight: 600,
                color: c.blueText,
                background: c.blueBgSoft,
                border: `1px solid ${c.blueBorder}`,
                whiteSpace: "nowrap",
              }}
            >
              ₱ {fmtPHP(eqValue)}
            </Box>
            <Typography
              sx={{ fontSize: "0.8rem", fontWeight: 800, color: c.blueText }}
            >
              {qty}
            </Typography>
          </Box>
          <Typography
            sx={{
              fontSize: "0.4rem",
              color: c.textMuted,
              textTransform: "uppercase",
            }}
          >
            {p?.strUOM ?? ""}
          </Typography>
        </Box>
      </Box>
      {/* Supplier → Company breadcrumb */}
      {(p?.supplier?.strSupplierName ||
        p?.transaction_item?.transaction?.company?.strCompanyName) && (
        <SupplierCompanyBreadcrumb
          flowType={flowType}
          supplierName={
            p?.supplier?.strSupplierNickName ?? p?.supplier?.strSupplierName
          }
          companyName={
            p?.transaction_item?.transaction?.company?.strCompanyNickName ??
            p?.transaction_item?.transaction?.company?.strCompanyName
          }
          clientName={
            p?.transaction_item?.transaction?.client?.strClientNickName ??
            p?.transaction_item?.transaction?.client?.strClientName
          }
          c={c}
        />
      )}
      {/* JEV selector (Received / Delivered tabs only) */}
      {showJevSelector && (
        <JevSelector
          jevIds={jevIds}
          activeId={jevId}
          onSelect={onSelectJev}
          c={c}
        />
      )}
      <Divider sx={{ borderColor: c.divider, mb: 1.25 }} />
      {/* LOGS */}
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 700,
          color: c.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          mb: 0.75,
        }}
      >
        Logs
      </Typography>
      <Box sx={{ mb: 1.5 }}>
        <BatchHistoryTable
          batches={logs}
          uom={p?.strUOM ?? ""}
          c={c}
          allowActions={false}
          unitPrice={p?.dUnitPrice}
          sellingPrice={p?.dUnitSellingPrice}
        />
      </Box>
      {/* JEV CONTENT */}
      {loading ? (
        <Typography sx={{ fontSize: "0.65rem", color: c.textFaint }}>
          Loading JEV...
        </Typography>
      ) : error ? (
        <Typography sx={{ fontSize: "0.65rem", color: c.errorText }}>
          {error}
        </Typography>
      ) : !jev ? (
        <Typography sx={{ fontSize: "0.65rem", color: c.textFaint }}>
          No JEV data available.
        </Typography>
      ) : (
        <JevViewPanel
          key={jevId}
          equivalentValue={equivalentValue}
          jev={(() => {
            // eslint-disable-next-line no-unused-vars
            const { entries, ...jevWithoutEntries } = jev;
            return { ...jevWithoutEntries, nJEVId: jev?.nJEVId ?? jevId };
          })()}
          particularsGrandTotal={eqValue}
          jevPendingKey={jevPendingKey}
          isFinanceOfficer={isFinanceOfficer}
          isManagement={isManagement}
          isJevBalanced={balance.balanced}
          jevBalanceLoading={balance.loading}
          isAssigneeType={false}
          assigneeLinks={[]}
          supplierLinks={[]}
          logsPanel={
            <BatchHistoryTable
              batches={logs}
              uom={p?.strUOM ?? ""}
              c={c}
              allowActions={false}
              unitPrice={p?.dUnitPrice}
              sellingPrice={p?.dUnitSellingPrice}
            />
          }
          supplierInfo={p?.supplier}
          companyName={
            p?.transaction_item?.transaction?.company?.strCompanyNickName ??
            p?.transaction_item?.transaction?.company?.strCompanyName
          }
          clientName={
            p?.transaction_item?.transaction?.client?.strClientNickName ??
            p?.transaction_item?.transaction?.client?.strClientName
          }
          flowType={flowType}
        />
      )}
    </Box>
  );
}
