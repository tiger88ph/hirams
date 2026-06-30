import React, { useState } from "react";
import ModalContainer from "../../../../../components/common/ModalContainer.jsx";
import api from "../../../../../utils/api/api.js";
import { showSwal, withSpinner } from "../../../../../utils/helpers/swal.jsx";
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
import BaseButton from "../../../../../components/common/BaseButton.jsx";

/**
 * UpdateDeliveryInfoModal — view and optionally edit delivery details.
 *
 * - Always shows current delivery date & place (read-only).
 * - Procurement users see an "Edit Delivery" button in the footer.
 *   Clicking it reveals inline edit fields pre-populated with current values.
 *   Saving calls PUT /transactions/{id}/approve-pricing (reuses the existing
 *   endpoint that persists dtDelivery + strDeliveryPlace without changing status).
 */
function UpdateDeliveryInfoModal({
  open,
  onClose,
  transaction,
  isProcurement,
  isManagement,
  onSuccess,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [dtDelivery, setDtDelivery] = useState("");
  const [strDeliveryPlace, setStrDeliveryPlace] = useState("");
  const [loading, setLoading] = useState(false);
  // ── Local copies so the read-only view updates after a successful save ──
  const [savedDate, setSavedDate] = useState(null);
  const [savedPlace, setSavedPlace] = useState(null);

  if (!open || !transaction) return null;

  const entity = transaction.strCode || "Transaction";

  // Prefer locally-saved values over the (frozen) route-state snapshot
  const currentDeliveryDate =
    savedDate !== null ? savedDate : (transaction.dtDelivery ?? null);
  const currentDeliveryPlace =
    savedPlace !== null ? savedPlace : (transaction.strDeliveryPlace ?? null);

  const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStartEdit = () => {
    // Pre-populate with existing values
    setDtDelivery(
      currentDeliveryDate
        ? new Date(currentDeliveryDate).toISOString().split("T")[0]
        : "",
    );
    setStrDeliveryPlace(currentDeliveryPlace ?? "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDtDelivery("");
    setStrDeliveryPlace("");
  };

  const handleClose = () => {
    setIsEditing(false);
    setDtDelivery("");
    setStrDeliveryPlace("");
    setSavedDate(null);
    setSavedPlace(null);
    onClose();
  };

  const handleSave = async () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.nUserId;
    if (!userId) {
      await showSwal("ERROR", {}, { entity: "User ID missing." });
      return;
    }
    handleClose();
    setLoading(true);

    try {
      await withSpinner(entity, () =>
        api.put(`transactions/${transaction.nTransactionId}/approve-pricing`, {
          userId,
          next_status:
            transaction.current_status ?? transaction.latest_history?.nStatus,
          dtDelivery: dtDelivery || null,
          strDeliveryPlace: strDeliveryPlace.trim() || null,
          remarks: "Delivery info updated.",
        }),
      );

      // Update the local read-only view with the just-saved values
      setSavedDate(dtDelivery || null);
      setSavedPlace(strDeliveryPlace.trim() || null);

      setIsEditing(false);
      setDtDelivery("");
      setStrDeliveryPlace("");

      await showSwal(
        "SUCCESS",
        {},
        { entity, action: "delivery info updated" },
      );

      if (typeof onSuccess === "function") onSuccess();
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Delivery Information"
      subTitle={transaction.strCode ? `/ ${transaction.strCode}` : ""}
      loading={loading}
      // Hide the default Save/Cancel — we drive everything via extraActions
      showSave={false}
      showCancel={false}
      extraActions={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Edit Delivery — procurement only, hidden while editing */}
          {(isManagement || isProcurement ) && !isEditing && (
            <BaseButton
              label="Edit Delivery"
              icon={<EditOutlinedIcon />}
              onClick={handleStartEdit}
              actionColor="edit"
              disabled={loading}
            />
          )}
          {isEditing && (
            <BaseButton
              label="Cancel Edit"
              onClick={handleCancelEdit}
              actionColor="cancel"
              disabled={loading}
            />
          )}
          {isEditing ? (
            <BaseButton
              label="Save Changes"
              icon={<LocalShippingOutlinedIcon />}
              onClick={handleSave}
              actionColor="approve"
              disabled={loading}
            />
          ) : (
            <BaseButton
              label="Close"
              onClick={handleClose}
              actionColor="cancel"
              disabled={loading}
            />
          )}
        </Box>
      }
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* ── Current delivery info (read-only) ─────────────────────────── */}
        <Box
          sx={{
            p: 2,
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}
          >
            <LocalShippingOutlinedIcon
              sx={{ fontSize: 15, color: "#1565c0" }}
            />
            <Typography
              variant="caption"
              fontWeight={700}
              color="#1565c0"
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
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

        {/* ── Inline edit fields (procurement only, toggled) ────────────── */}
        <Collapse in={isEditing} unmountOnExit>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}
            >
              <EditOutlinedIcon sx={{ fontSize: 15, color: "#1565c0" }} />
              <Typography
                variant="caption"
                fontWeight={700}
                color="#1565c0"
                sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
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
                  onChange={(e) => setDtDelivery(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={7}>
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
      </Box>
    </ModalContainer>
  );
}

export default UpdateDeliveryInfoModal;
