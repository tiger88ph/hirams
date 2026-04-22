import React, { useState } from "react";
import ModalContainer from "../../../components/common/ModalContainer.jsx";
import RemarksModalCard from "../../../components/common/RemarksModalCard.jsx";
import api from "../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../utils/helpers/swal.jsx";
import { Box, Typography, Paper } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";

/**
 * StatusModal — Win or Lost decision for a price-approved transaction.
 *
 * Win  → advances to next status (transacstatus offset +1 from current)
 * Lost → archives to archiveStatus[lostKey] (index 1 of archive_status map)
 */
function StatusModal({
  open,
  onClose,
  transaction,
  transacstatus, // full management status map { [code]: label }
  archiveStatus, // archive status map { [code]: label }
  onSuccess, // (newStatusCode) => void
}) {
  const [choice, setChoice] = useState(null); // "win" | "lost"
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open || !transaction) return null;

  const entity = transaction.strCode || "Transaction";
  const transactionName = `${transaction.clientName || "—"} : ${
    transaction.strTitle || transaction.transactionName || "—"
  }`;

  // ── Derive status codes ──────────────────────────────────────────────────
  const getNextStatus = () => {
    const currentStatus = String(
      transaction.current_status ?? transaction.latest_history?.nStatus ?? "",
    );
    const keys = Object.keys(transacstatus || {});
    const idx = keys.indexOf(currentStatus);
    if (idx === -1 || idx + 1 >= keys.length) return null;
    return keys[idx + 1];
  };

  const getLostStatusCode = () => {
    const keys = Object.keys(archiveStatus || {});
    return keys[1] ?? null; // index 1 = "Lost"
  };

  // ── Confirm handler ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!choice) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.nUserId;
    if (!userId) {
      await showSwal("ERROR", {}, { entity: "User ID missing." });
      return;
    }

    const isWin = choice === "win";

    // Validate targets before closing
    const nextStatus = isWin ? getNextStatus() : getLostStatusCode();
    if (!nextStatus) {
      await showSwal(
        "ERROR",
        {},
        {
          entity: isWin
            ? "No next status available."
            : "Lost status code not configured.",
        },
      );
      return;
    }

    setLoading(true);
    onClose();

    try {
      if (isWin) {
        // Advance to next status — mirrors Role M "verified" / "approved"
        await withSpinner(entity, () =>
          api.put(
            `transactions/${transaction.nTransactionId}/approve-pricing`,
            {
              userId,
              remarks: remarks.trim() || "Transaction won.",
              next_status: nextStatus,
            },
          ),
        );
      } else {
        // Mark as Lost — archive with lostKey (index 1)
        await withSpinner(entity, () =>
          api.post(`transactions/${transaction.nTransactionId}/archive`, {
            user_id: userId,
            remarks: remarks.trim() || "Transaction lost.",
            status_code: nextStatus, // pass explicit code so backend uses it
          }),
        );
      }

      await showSwal(
        "SUCCESS",
        {},
        { entity, action: isWin ? "marked as Won" : "marked as Lost" },
      );

      setChoice(null);
      setRemarks("");
      setRemarksError("");

      if (typeof onSuccess === "function") onSuccess(nextStatus);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setChoice(null);
    setRemarks("");
    setRemarksError("");
    onClose();
  };

  // ── Choice cards ─────────────────────────────────────────────────────────
  const ChoiceCard = ({ type, icon, label, sublabel, color, bg, border }) => {
    const selected = choice === type;
    return (
      <Paper
        elevation={0}
        onClick={() => setChoice(type)}
        sx={{
          flex: 1,
          cursor: "pointer",
          border: `2px solid ${selected ? color : border}`,
          borderRadius: "12px",
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          background: selected ? bg : "background.paper",
          transition: "all 0.18s ease",
          "&:hover": {
            borderColor: color,
            background: bg,
            transform: "translateY(-2px)",
            boxShadow: `0 4px 16px ${color}30`,
          },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: selected ? color : `${color}18`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.18s ease",
          }}
        >
          {React.cloneElement(icon, {
            sx: {
              fontSize: 28,
              color: selected ? "#fff" : color,
              transition: "color 0.18s ease",
            },
          })}
        </Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "0.95rem",
            color: selected ? color : "text.primary",
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.72rem",
            color: "text.secondary",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          {sublabel}
        </Typography>
      </Paper>
    );
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Update Transaction Status"
      subTitle={transaction.strCode ? `/ ${transaction.strCode}` : ""}
      onSave={handleConfirm}
      saveLabel={
        choice === "win"
          ? "Confirm Win"
          : choice === "lost"
            ? "Confirm Lost"
            : "Select Outcome"
      }
      customLoading={loading}
      loading={loading}
      showSave={!!choice}
      showCancel
      cancelLabel="Cancel"
      onCancel={handleClose}
      saveButtonColor={choice === "lost" ? "error" : "success"}
    >
      {/* ── Choice row ── */}
      <Box sx={{ display: "flex", gap: 2, mb: 2.5 }}>
        <ChoiceCard
          type="win"
          icon={<EmojiEventsIcon />}
          label="Won"
          sublabel="Transaction awarded."
          color="#15803d"
          bg="#f0fdf4"
          border="#d1fae5"
        />
        <ChoiceCard
          type="lost"
          icon={<SentimentVeryDissatisfiedIcon />}
          label="Lost"
          sublabel="Transaction not awarded."
          color="#dc2626"
          bg="#fef2f2"
          border="#fecaca"
        />
      </Box>

      {/* ── Remarks always visible ── */}
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={handleClose}
        onSave={handleConfirm}
        actionWord={choice === "win" ? "marking as Won" : "marking as Lost"}
        entityName={transactionName}
        saveButtonColor={choice === "lost" ? "error" : "success"}
        saveButtonText={choice === "win" ? "Confirm Win" : "Confirm Lost"}
      />
    </ModalContainer>
  );
}

export default StatusModal;
