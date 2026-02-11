import React, { useState, useEffect } from "react";
import ModalContainer from "../../../common/ModalContainer";
import { Box, TextField } from "@mui/material";
import BaseButton from "../../../common/BaseButton";
import api from "../../../../utils/api/api";
import { showSwal, withSpinner } from "../../../../utils/swal";

function SetAEModal({
  open,
  onClose,
  initialData = null,
  onSaved,
  transactionId,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
    } else {
      setName("");
    }
    setError("");
  }, [initialData, open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    onClose();
    try {
      setLoading(true);
      if (initialData?.id) {
        // EDIT
        await withSpinner("Saving changes", async () => {
          await api.patch(`pricing-sets/${initialData.id}`, { strName: name });
        });
        await showSwal(
          "SUCCESS",
          {},
          { entity: "Pricing Set", action: "updated" }
        );
      } else {
        // ADD - include transactionId
        if (!transactionId)
          throw new Error("Transaction ID missing for new set.");
        await withSpinner("Adding", async () => {
          await api.post("pricing-sets", {
            strName: name,
            nTransactionId: transactionId, // 🔑 required
          });
        });
        await showSwal(
          "SUCCESS",
          {},
          { entity: "Pricing Set", action: "added" }
        );
      }
      onSaved?.(); // refresh parent table
      setName("");
      setError("");
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity: "Pricing Set" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title={initialData?.id ? "Edit Pricing Set" : "Add Pricing Set"}
      subTitle={name?.trim() ? `/ ${name.trim()}` : ""}
      onSave={handleSave}
      saveLabel={initialData?.id ? "Save Changes" : "Add"}
      loading={loading}
    >
      <Box sx={{ mt: 1 }}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          error={!!error}
          helperText={error}
        />
      </Box>
    </ModalContainer>
  );
}

export default SetAEModal;