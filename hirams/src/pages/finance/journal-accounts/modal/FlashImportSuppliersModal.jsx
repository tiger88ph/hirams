import React, { useState, useEffect } from "react";
import ModalContainer from "../../../../layouts/modal/ModalContainer.jsx";
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Typography,
  CircularProgress,
} from "@mui/material";
import JournalAccountAPI from "../../../../api/endpoints/journal-account.api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";

function FlashImportSuppliersModal({ open, onClose, parentAccount, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);

  useEffect(() => {
    if (open && parentAccount?.id) {
      fetchAvailableSuppliers();
    } else {
      setSelectedIds([]);
      setSuppliers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentAccount]);

  const fetchAvailableSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const res = await JournalAccountAPI.getAvailableSuppliersForImport(
        parentAccount.id,
      );
      const list = Array.isArray(res)
        ? res
        : (res?.data ?? res?.suppliers ?? []);
      setSuppliers(list);
    } catch (err) {
      console.error("Failed to fetch available suppliers:", err);
      setSuppliers([]);
    } finally {
      setSuppliersLoading(false);
    }
  };

  if (!open) return null;

  const toggleSupplier = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;

    const entity = `${selectedIds.length} supplier${selectedIds.length === 1 ? "" : "s"}`;
    const action = "imported";

    try {
      setLoading(true);
      onClose();

      await withSpinner(entity, async () => {
        await JournalAccountAPI.flashImportSuppliers(parentAccount.id, {
          supplierIds: selectedIds,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action });
      onSaved?.();
    } catch (err) {
      console.error("❌ Error importing suppliers:", err);
      const serverMessage = err?.response?.data?.message ?? err?.data?.message;
      await showSwal("ERROR", {}, { entity, message: serverMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Flash Import from Supplier"
      subTitle={
        parentAccount?.accountName ? `${parentAccount.accountName}` : ""
      }
      onSave={handleSave}
      saveLabel={
        selectedIds.length > 0 ? `Import (${selectedIds.length})` : "Import"
      }
      loading={loading}
    >
      <Box sx={{ mt: 1 }}>
        {suppliersLoading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={22} />
          </Box>
        ) : suppliers.length === 0 ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <Typography sx={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
              All suppliers already have a Purchases account.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
            {suppliers.map((supplier) => {
              const nickname =
                supplier.strSupplierNickName || supplier.strSupplierName;
              const id = supplier.nSupplierId;
              const checked = selectedIds.includes(id);
              return (
                <ListItem key={id} disablePadding>
                  <ListItemButton
                    onClick={() => toggleSupplier(id)}
                    sx={{ borderRadius: "6px" }}
                  >
                    <ListItemIcon sx={{ minWidth: 34 }}>
                      <Checkbox
                        edge="start"
                        checked={checked}
                        tabIndex={-1}
                        disableRipple
                        size="small"
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={supplier.strSupplierName}
                      secondary={`Receivables from ${nickname}`}
                      primaryTypographyProps={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                      secondaryTypographyProps={{ fontSize: "0.7rem" }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </ModalContainer>
  );
}

export default FlashImportSuppliersModal;
