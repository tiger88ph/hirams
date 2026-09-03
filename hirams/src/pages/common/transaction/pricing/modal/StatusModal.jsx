import React, { useState, useMemo } from "react";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import TransacRemarksModalContent from "../../../../../components/content/TransacRemarksModalContent.jsx";
import { getItem } from "../../../../../utils/storage/localStorage.js";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
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

const useColors = (c) => ({
  border: c.slate.border,
  bgSoft: c.slate.mutedBg,
  green: {
    solid: c.green.text,
    soft: c.green.bgSoft,
    bg: c.green.bg,
    border: c.green.borderStrong,
    hover: c.green.hover,
    text: c.green.textStrong,
  },
  red: {
    solid: c.red.text,
    soft: c.red.bgSoft,
    bg: c.red.bg,
    border: c.red.borderStrong,
    hover: c.red.hover,
    text: c.red.textStrong,
  },
  text: { pri: c.gray.textPrimary, sec: c.gray.textSecondary },
});

function StatusModal({
  open,
  onClose,
  transaction,
  transacstatus,
  archiveStatus,
  onSuccess,
}) {
  const theme = useTheme(),
    isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
  const [choice, setChoice] = useState(null),
    [step, setStep] = useState(1);
  const [remarks, setRemarks] = useState(""),
    [remarksError, setRemarksError] = useState("");
  const [dtDelivery, setDtDelivery] = useState(""),
    [strDeliveryPlace, setStrDeliveryPlace] = useState("");
  const [loading, setLoading] = useState(false);
  if (!open || !transaction) return null;
  const entity = transaction.strCode || "Transaction";
  const transactionName = `${transaction.clientName || "—"} : ${transaction.strTitle || transaction.transactionName || "—"}`;
  const getNextStatus = () => {
    const keys = Object.keys(transacstatus || {});
    const idx = keys.indexOf(
      String(
        transaction.current_status ?? transaction.latest_history?.nStatus ?? "",
      ),
    );
    return idx === -1 || idx + 1 >= keys.length ? null : keys[idx + 1];
  };
  const getLostStatusCode = () => Object.keys(archiveStatus || {})[1] ?? null;
  const handleChoiceSelect = (t) => {
    setChoice(t);
    if (t !== "win") {
      setDtDelivery("");
      setStrDeliveryPlace("");
    }
  };
  const handleNext = () => choice && setStep(2);
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
    const userId = getItem("user", {})?.nUserId;
    if (!userId)
      return void (await showSwal("ERROR", {}, { entity: "User ID missing." }));
    const isWin = choice === "win",
      nextStatus = isWin ? getNextStatus() : getLostStatusCode();
    if (!nextStatus)
      return void (await showSwal(
        "ERROR",
        {},
        {
          entity: isWin
            ? "No next status available."
            : "Lost status code not configured.",
        },
      ));
    setLoading(true);
    try {
      if (isWin)
        await withSpinner(entity, () =>
          TransactionAPI.approvePricing(transaction.nTransactionId, {
            userId,
            remarks: remarks.trim() || "Transaction won.",
            next_status: nextStatus,
            dtDelivery: dtDelivery || null,
            strDeliveryPlace: strDeliveryPlace.trim() || null,
          }),
        );
      else
        await withSpinner(entity, () =>
          TransactionAPI.archiveTransaction(transaction.nTransactionId, {
            user_id: userId,
            remarks: remarks.trim() || "Transaction lost.",
            status_code: nextStatus,
          }),
        );
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
      typeof onSuccess === "function" && onSuccess(nextStatus);
      handleClose();
    } catch (e) {
      console.error(e);
      await showSwal("ERROR", {}, { entity: transactionName });
    } finally {
      setLoading(false);
    }
  };

  const ChoiceCard = ({ type, icon, label, sublabel, p }) => {
    const sel = choice === type;
    return (
      <Paper
        elevation={sel ? 4 : 0}
        onClick={() => handleChoiceSelect(type)}
        sx={{
          flex: 1,
          cursor: "pointer",
          borderRadius: 3,
          p: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.8,
          border: sel ? `2px solid ${p.border}` : `1px solid ${colors.border}`,
          bgcolor: sel ? p.soft : colors.bgSoft,
          transition: "all .18s ease",
          transform: sel ? "scale(1.015)" : "none",
          "&:hover": {
            borderColor: p.border,
            bgcolor: p.bg,
            transform: "translateY(-2px)",
            boxShadow: `0 6px 14px ${p.solid}1a`,
          },
        }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            bgcolor: sel ? p.solid : p.soft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {React.cloneElement(icon, {
            sx: { fontSize: 26, color: sel ? "#fff" : p.text },
          })}
        </Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: ".95rem",
            color: sel ? p.text : colors.text.pri,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: ".75rem",
            color: colors.text.sec,
            textAlign: "center",
            lineHeight: 1.3,
          }}
        >
          {sublabel}
        </Typography>
      </Paper>
    );
  };

  const isWin = choice === "win";
  if (step === 1)
    return (
      <ModalContainer
        open={open}
        handleClose={handleClose}
        title="Update Transaction Status"
        subTitle={transaction.strCode}
        onSave={handleNext}
        saveLabel="Save"
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
            sublabel="Awarded"
            p={colors.green}
          />
          <ChoiceCard
            type="lost"
            icon={<SentimentVeryDissatisfiedIcon />}
            label="Lost"
            sublabel="Not awarded"
            p={colors.red}
          />
        </Box>
        <Collapse in={isWin} unmountOnExit>
          <Box
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 2,
              border: `1px solid ${colors.green.border}`,
              bgcolor: `${colors.green.soft}80`,
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <LocalShippingOutlinedIcon
                    sx={{ fontSize: 16, color: colors.green.text }}
                  />
                  <Typography
                    fontWeight={600}
                    sx={{ color: colors.green.text, fontSize: ".85rem" }}
                  >
                    Delivery Details (optional)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={dtDelivery}
                  onChange={(e) => setDtDelivery(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Place"
                  size="small"
                  fullWidth
                  value={strDeliveryPlace}
                  onChange={(e) => setStrDeliveryPlace(e.target.value)}
                  inputProps={{ maxLength: 70 }}
                  multiline
                  minRows={2}
                  sx={{
                    "& textarea": { resize: "vertical" },
                    "& .MuiOutlinedInput-root": { borderRadius: 2 },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </ModalContainer>
    );

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Update Transaction Status"
      subTitle={transaction.strCode}
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
      <TransacRemarksModalContent
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
