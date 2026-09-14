import React, { useState, useEffect, useMemo } from "react";
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
  Divider,
  useTheme,
} from "@mui/material";
import { GroupOutlined, SearchOutlined } from "@mui/icons-material";
import JournalAccountAPI from "../../../../api/endpoints/journal-account.api.js";
import { showSwal, withSpinner } from "../../../../utils/helpers/swal.jsx";
import getThemeColors from "../../../../utils/style/getThemeColors.js";

const useColors = (c) => ({
  border: c.slate.border,
  headerBg: c.slate.itemHeaderBg ?? c.slate.mutedBg,
  hoverBg: c.slate.hover,
  chipBg: c.blue.bg,
  chipText: c.blue.text,
  chipBorder: c.blue.border,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  inputBg: c.gray.inputBg,
});

function FlashImportClientsModal({ open, onClose, parentAccount, onSaved }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  const [clients, setClients] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && parentAccount?.id) {
      fetchAvailableClients();
    } else {
      setSelectedIds([]);
      setClients([]);
      setSearch("");
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

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const nickname = (c.strClientNickName || "").toLowerCase();
      const name = (c.strClientName || "").toLowerCase();
      return nickname.includes(q) || name.includes(q);
    });
  }, [clients, search]);

  if (!open) return null;
  const toggleClient = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const allFilteredSelected =
    filteredClients.length > 0 &&
    filteredClients.every((c) => selectedIds.includes(c.nClientId));
  const someFilteredSelected = filteredClients.some((c) =>
    selectedIds.includes(c.nClientId),
  );

  const toggleSelectAll = () => {
    const filteredIds = filteredClients.map((c) => c.nClientId);
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
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
          <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={22} />
          </Box>
        ) : clients.length === 0 ? (
          <Box sx={{ py: 5, display: "flex", justifyContent: "center" }}>
            <Typography sx={{ fontSize: "0.8rem", color: colors.textMuted }}>
              All clients already have a
              {parentAccount?.accountName
                ? ` ${parentAccount.accountName}`
                : ""}{" "}
              account.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            {/* ── Header: search + select all + count ───────────────── */}
            <Box
              sx={{
                px: 1.25,
                py: 1,
                bgcolor: colors.headerBg,
                borderBottom: `1px solid ${colors.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  bgcolor: colors.inputBg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: "7px",
                  px: 1,
                  height: 32,
                }}
              >
                <SearchOutlined
                  sx={{ fontSize: "0.85rem", color: colors.textMuted }}
                />
                <Box
                  component="input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search clients…"
                  sx={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "0.75rem",
                    color: colors.textPrimary,
                    "::placeholder": { color: colors.textMuted },
                  }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box
                  onClick={toggleSelectAll}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.4,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={allFilteredSelected}
                    indeterminate={someFilteredSelected && !allFilteredSelected}
                    sx={{ p: 0.4 }}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.68rem",
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    Select all
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <GroupOutlined
                    sx={{ fontSize: "0.75rem", color: colors.textMuted }}
                  />
                  <Typography
                    sx={{ fontSize: "0.65rem", color: colors.textMuted }}
                  >
                    {filteredClients.length} available
                  </Typography>
                  {selectedIds.length > 0 && (
                    <Box
                      sx={{
                        ml: 0.5,
                        px: 0.75,
                        py: 0.15,
                        borderRadius: "999px",
                        bgcolor: colors.chipBg,
                        border: `1px solid ${colors.chipBorder}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.6rem",
                          fontWeight: 700,
                          color: colors.chipText,
                        }}
                      >
                        {selectedIds.length} selected
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            {/* ── List ──────────────────────────────────────────────── */}
            {filteredClients.length === 0 ? (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography
                  sx={{ fontSize: "0.72rem", color: colors.textMuted }}
                >
                  No clients match "{search}"
                </Typography>
              </Box>
            ) : (
              <List
                dense
                disablePadding
                sx={{ maxHeight: 340, overflowY: "auto" }}
              >
                {filteredClients.map((client, idx) => {
                  const nickname =
                    client.strClientNickName || client.strClientName;
                  const id = client.nClientId;
                  const checked = selectedIds.includes(id);
                  return (
                    <React.Fragment key={id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => toggleClient(id)}
                          selected={checked}
                          sx={{
                            px: 1.25,
                            py: 0.75,
                            "&.Mui-selected": {
                              bgcolor: colors.chipBg,
                            },
                            "&.Mui-selected:hover": {
                              bgcolor: colors.chipBg,
                            },
                            "&:hover": { bgcolor: colors.hoverBg },
                          }}
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
                              fontSize: "0.78rem",
                              fontWeight: 600,
                              color: colors.textPrimary,
                            }}
                            secondaryTypographyProps={{
                              fontSize: "0.66rem",
                              color: colors.textMuted,
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                      {idx < filteredClients.length - 1 && (
                        <Divider sx={{ borderColor: colors.border }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </List>
            )}
          </Box>
        )}
      </Box>
    </ModalContainer>
  );
}

export default FlashImportClientsModal;
