import React, { useState } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import RemarksModalCard from "../../../../../components/common/RemarksModalCard.jsx";
import api from "../../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Grid,
  Collapse,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import SentimentVeryDissatisfiedIcon from "@mui/icons-material/SentimentVeryDissatisfied";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

/**
 * StatusModal — Win or Lost decision for a price-approved transaction.
 *
 * View 1: Win/Lost cards + delivery fields expand inline when Win is clicked
 *         Footer: Cancel | Next (Next only appears when a choice is made)
 *
 * View 2: Remarks only
 *         Footer: Back | Confirm Win / Confirm Lost
 *
 * Win  → advances to next status + updates dtDelivery & strDeliveryPlace
 * Lost → archives to archiveStatus index 1
 */
function StatusModal({
  open,
  onClose,
  transaction,
  transacstatus,
  archiveStatus,
  onSuccess,
}) {
  const [choice, setChoice] = useState(null); // "win" | "lost"
  const [step, setStep] = useState(1); // 1 = cards, 2 = remarks
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");
  const [dtDelivery, setDtDelivery] = useState("");
  const [strDeliveryPlace, setStrDeliveryPlace] = useState("");
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
    return keys[1] ?? null;
  };

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleChoiceSelect = (type) => {
    setChoice(type);
    if (type !== "win") {
      setDtDelivery("");
      setStrDeliveryPlace("");
    }
  };

  const handleNext = () => {
    if (!choice) return;
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setRemarks("");
    setRemarksError("");
  };

  const handleClose = () => {
    setChoice(null);
    setStep(1);
    setRemarks("");
    setRemarksError("");
    setDtDelivery("");
    setStrDeliveryPlace("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!choice) return;

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.nUserId;
    if (!userId) {
      await showSwal("ERROR", {}, { entity: "User ID missing." });
      return;
    }

    const isWin = choice === "win";
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
        await withSpinner(entity, () =>
          api.put(
            `transactions/${transaction.nTransactionId}/approve-pricing`,
            {
              userId,
              remarks: remarks.trim() || "Transaction won.",
              next_status: nextStatus,
              dtDelivery: dtDelivery || null,
              strDeliveryPlace: strDeliveryPlace.trim() || null,
            },
          ),
        );
      } else {
        await withSpinner(entity, () =>
          api.post(`transactions/${transaction.nTransactionId}/archive`, {
            user_id: userId,
            remarks: remarks.trim() || "Transaction lost.",
            status_code: nextStatus,
          }),
        );
      }

      await showSwal(
        "SUCCESS",
        {},
        { entity, action: isWin ? "marked as Won" : "marked as Lost" },
      );

      setChoice(null);
      setStep(1);
      setRemarks("");
      setRemarksError("");
      setDtDelivery("");
      setStrDeliveryPlace("");

      if (typeof onSuccess === "function") onSuccess(nextStatus);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  // ── Choice card ──────────────────────────────────────────────────────────
  const ChoiceCard = ({ type, icon, label, sublabel, color, bg, border }) => {
    const selected = choice === type;
    return (
      <Paper
        elevation={0}
        onClick={() => handleChoiceSelect(type)}
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

  const isWin = choice === "win";

  // ── View 1: cards + optional delivery fields ─────────────────────────────
  if (step === 1) {
    return (
      <ModalContainer
        open={open}
        handleClose={handleClose}
        title="Update Transaction Status"
        subTitle={transaction.strCode ? `/ ${transaction.strCode}` : ""}
        onSave={handleNext}
        saveLabel="Next"
        showSave={!!choice}
        showCancel
        cancelLabel="Cancel"
        onCancel={handleClose}
        loading={loading}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
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

        {/* Delivery fields slide down when Win is selected */}
        <Collapse in={isWin} unmountOnExit>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: "10px",
              border: "1px solid #d1fae5",
              background: "#f0fdf4",
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <LocalShippingOutlinedIcon
                    sx={{ fontSize: 15, color: "#15803d" }}
                  />
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="#15803d"
                  >
                    Delivery Details (optional)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Delivery Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={dtDelivery}
                  onChange={(e) => setDtDelivery(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Delivery Place"
                  size="small"
                  fullWidth
                  value={strDeliveryPlace}
                  onChange={(e) => setStrDeliveryPlace(e.target.value)}
                  inputProps={{ maxLength: 70 }}
                  multiline
                  minRows={2}
                  sx={{ "& textarea": { resize: "vertical" } }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </ModalContainer>
    );
  }

  // ── View 2: remarks only ─────────────────────────────────────────────────
  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Update Transaction Status"
      subTitle={transaction.strCode ? `/ ${transaction.strCode}` : ""}
      onSave={handleConfirm}
      saveLabel={isWin ? "Confirm Win" : "Confirm Lost"}
      saveButtonColor={isWin ? "success" : "error"}
      showSave
      showCancel
      cancelLabel="Back"
      onCancel={handleBack}
      loading={loading}
      customLoading={loading}
    >
      <RemarksModalCard
        remarks={remarks}
        setRemarks={setRemarks}
        remarksError={remarksError}
        onBack={handleBack}
        onSave={handleConfirm}
        actionWord={isWin ? "marking as Won" : "marking as Lost"}
        entityName={transactionName}
        saveButtonColor={isWin ? "success" : "error"}
        saveButtonText={isWin ? "Confirm Win" : "Confirm Lost"}
      />
    </ModalContainer>
  );
}

export default StatusModal;
