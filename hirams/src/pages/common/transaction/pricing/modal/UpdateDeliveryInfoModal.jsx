import React, { useState, useMemo } from "react";
import ModalContainer from "../../../../../layouts/modal/ModalContainer.jsx";
import TransactionAPI from "../../../../../api/endpoints/transaction.api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
import { getItem } from "../../../../../utils/storage/localStorage.js";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  TextField,
  Grid,
  Collapse,
  Divider,
} from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BaseButton from "../../../../../components/form/BaseButton.jsx";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  border: c.slate.border,
  mutedBg: c.slate.mutedBg,
  mutedBorder: c.slate.mutedBorder,
  blue: {
    bg: c.blue.bg,
    bgSoft: c.blue.bgSoft,
    border: c.blue.border,
    borderStrong: c.blue.borderStrong,
    text: c.blue.text,
    textStrong: c.blue.textStrong,
  },
  slate: { hover: c.slate.hover },
  gray: { pri: c.gray.textPrimary, sec: c.gray.textSecondary },
});

function UpdateDeliveryInfoModal({
  open,
  onClose,
  transaction,
  isProcurement,
  isManagement,
  onSuccess,
}) {
  const theme = useTheme(),
    isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
  const [isEditing, setIsEditing] = useState(false),
    [dtDelivery, setDtDelivery] = useState(""),
    [strDeliveryPlace, setStrDeliveryPlace] = useState("");
  const [savedDate, setSavedDate] = useState(null),
    [savedPlace, setSavedPlace] = useState(null),
    [dateError, setDateError] = useState(""),
    [placeError, setPlaceError] = useState("");
  if (!open || !transaction) return null;
  const entity = transaction.strCode || "Transaction";
  const currentDeliveryDate =
    savedDate !== null ? savedDate : (transaction.dtDelivery ?? null);
  const currentDeliveryPlace =
    savedPlace !== null ? savedPlace : (transaction.strDeliveryPlace ?? null);
  const fmtDate = (d) =>
    !d
      ? "—"
      : new Date(d).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        });
  const handleStartEdit = () => {
    setDtDelivery(
      currentDeliveryDate
        ? new Date(currentDeliveryDate).toISOString().split("T")[0]
        : "",
    );
    setStrDeliveryPlace(currentDeliveryPlace ?? "");
    setDateError("");
    setPlaceError("");
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setDtDelivery("");
    setStrDeliveryPlace("");
    setDateError("");
    setPlaceError("");
  };
  const handleClose = () => {
    setIsEditing(false);
    setDtDelivery("");
    setStrDeliveryPlace("");
    setSavedDate(null);
    setSavedPlace(null);
    setDateError("");
    setPlaceError("");
    onClose();
  };
  const handleDateChange = (e) => {
    setDtDelivery(e.target.value);
    dateError && setDateError("");
  };
  const handlePlaceChange = (e) => {
    setStrDeliveryPlace(e.target.value);
    placeError && setPlaceError("");
  };
  const handleSave = async () => {
    const trimmedPlace = strDeliveryPlace.trim();
    let hasError = false;
    if (!dtDelivery) {
      setDateError("Delivery date is required.");
      hasError = true;
    }
    if (!trimmedPlace) {
      setPlaceError("Delivery place is required.");
      hasError = true;
    }
    if (hasError) return;
    const userId = getItem("user", {})?.nUserId;
    if (!userId)
      return void (await showSwal("ERROR", {}, { entity: "User ID missing." }));
    const transactionId = transaction.nTransactionId,
      nextStatus =
        transaction.current_status ?? transaction.latest_history?.nStatus;
    handleClose();
    try {
      await withSpinner(entity, () =>
        TransactionAPI.approvePricing(transactionId, {
          userId,
          next_status: nextStatus,
          dtDelivery,
          strDeliveryPlace: trimmedPlace,
          remarks: "Delivery info updated.",
        }),
      );
      setSavedDate(dtDelivery);
      setSavedPlace(trimmedPlace);
      await showSwal(
        "SUCCESS",
        {},
        { entity, action: "delivery info updated" },
      );
      typeof onSuccess === "function" && onSuccess();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity });
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Delivery Information"
      subTitle={transaction.strCode || ""}
      showSave={false}
      showCancel={false}
      extraActions={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {(isManagement || isProcurement) && !isEditing && (
            <BaseButton
              label="Edit Delivery"
              icon={<EditOutlinedIcon />}
              onClick={handleStartEdit}
              actionColor="edit"
            />
          )}
          {isEditing && (
            <BaseButton
              label="Cancel Edit"
              onClick={handleCancelEdit}
              actionColor="cancel"
            />
          )}
          {isEditing ? (
            <BaseButton
              label="Save Changes"
              icon={<LocalShippingOutlinedIcon />}
              onClick={handleSave}
              actionColor="approve"
            />
          ) : (
            <BaseButton
              label="Close"
              onClick={handleClose}
              actionColor="cancel"
            />
          )}
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: "10px",
            border: `1px solid ${colors.mutedBorder || colors.border}`,
            bgcolor: colors.mutedBg,
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}
          >
            <LocalShippingOutlinedIcon
              sx={{ fontSize: 15, color: colors.blue.textStrong }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              sx={{
                color: colors.blue.textStrong,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Current Delivery Details
            </Typography>
          </Box>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={4}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Delivery Date
              </Typography>
              <Typography variant="body2" fontWeight={500} sx={{ mt: 0.25 }}>
                {fmtDate(currentDeliveryDate)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                Delivery Place
              </Typography>
              <Typography
                variant="body2"
                fontWeight={500}
                sx={{
                  mt: 0.25,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {currentDeliveryPlace || "—"}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        <Collapse in={isEditing} unmountOnExit>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              border: `1px solid ${colors.blue.borderStrong}`,
              bgcolor: colors.blue.bgSoft,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}
            >
              <EditOutlinedIcon
                sx={{ fontSize: 15, color: colors.blue.textStrong }}
              />
              <Typography
                variant="caption"
                fontWeight={700}
                sx={{
                  color: colors.blue.textStrong,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Edit Delivery Details
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Delivery Date"
                  type="date"
                  size="small"
                  fullWidth
                  value={dtDelivery}
                  onChange={handleDateChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!dateError}
                  helperText={dateError}
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Delivery Place"
                  size="small"
                  fullWidth
                  value={strDeliveryPlace}
                  onChange={handlePlaceChange}
                  inputProps={{ maxLength: 70 }}
                  multiline
                  minRows={2}
                  sx={{ "& textarea": { resize: "vertical" } }}
                  error={!!placeError}
                  helperText={placeError}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Box>
    </ModalContainer>
  );
}

export default UpdateDeliveryInfoModal;
