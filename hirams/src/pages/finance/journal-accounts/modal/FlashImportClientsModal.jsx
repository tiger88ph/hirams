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
import getThemeColor from "../../../../utils/style/getThemeColors.js";

function FlashImportClientsModal({ open, onClose, parentAccount, onSaved }) {
  const [clients, setClients] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);

  useEffect(() => {
    if (open && parentAccount?.id) {
      fetchAvailableClients();
    } else {
      setSelectedIds([]);
      setClients([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentAccount]);

 const fetchAvailableClients = async () => {
    setClientsLoading(true);
    try {
      const res = await JournalAccountAPI.getAvailableClientsForImport(
        parentAccount.id,
      );
      const list = Array.isArray(res) ? res : (res?.data ?? res?.clients ?? []);
      setClients(list);
    } catch (err) {
      console.error("Failed to fetch available clients:", err);
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  if (!open) return null;

  const toggleClient = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;

    const entity = `${selectedIds.length} client${selectedIds.length === 1 ? "" : "s"}`;
    const action = "imported";

    try {
      setLoading(true);
      onClose();

    await withSpinner(entity, async () => {
        await JournalAccountAPI.flashImportClients(parentAccount.id, {
          clientIds: selectedIds,
        });
      });

      await showSwal("SUCCESS", {}, { entity, action });
      onSaved?.();
    } catch (err) {
      console.error("❌ Error importing clients:", err);
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
      title="Flash Import from Client"
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
        {clientsLoading ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={22} />
          </Box>
        ) : clients.length === 0 ? (
          <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
            <Typography sx={{ fontSize: "0.8rem", color: "#9CA3AF" }}>
              All clients already have a Collectibles account.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 360, overflowY: "auto" }}>
            {clients.map((client) => {
              const nickname = client.strClientNickName || client.strClientName;
              const id = client.nClientId;
              const checked = selectedIds.includes(id);
              return (
                <ListItem key={id} disablePadding>
                  <ListItemButton
                    onClick={() => toggleClient(id)}
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
                      primary={client.strClientName}
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

export default FlashImportClientsModal;
