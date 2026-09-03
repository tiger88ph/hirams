import React, { useMemo } from "react";
import { Box, Typography, IconButton, Collapse } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Edit,
  Delete,
  Add,
  AccountBalanceOutlined,
  FlashOnOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from "@mui/icons-material";
import PageLayout from "../../../layouts/page/content-page";
import CustomSearchField from "../../../components/form/SearchField";
import BaseButton from "../../../components/form/BaseButton";
import SyncMenu from "../../../components/form/SyncMenu";
import JournalAccountAEModal from "./modal/JournalAccountAEModal";
import DeleteVerificationModal from "../../common/transaction/transactions/modal/DeleteVerificationModal";
import FlashImportClientsModal from "./modal/FlashImportClientsModal";
import FlashImportSuppliersModal from "./modal/FlashImportSuppliersModal";
import getThemeColors from "../../../utils/style/getThemeColors";

const useColors = (c) => ({
  slate: {
    divider: c.slate.divider,
    mutedBg: c.slate.mutedBg,
    itemHover: c.slate.itemHover,
    hover: c.slate.hover,
    outerBg: c.slate.outerBg,
    border: c.slate.border,
  },
  violet: { bg: c.violet.bg, border: c.violet.border, text: c.violet.text },
  blue: { bg: c.blue.bg, border: c.blue.border, text: c.blue.text },
  gray: {
    pri: c.gray.textPrimary,
    sec: c.gray.textSecondary,
    muted: c.gray.textMuted,
  },
  amber: { text: c.amber.text, bg: c.amber.bg },
  teal: { text: c.teal.text, bg: c.teal.bg },
  green: { text: c.green.text, bg: c.green.bg },
  red: { text: c.red.text, bg: c.red.bg },
});

const AccountTreeNode = ({
  node,
  depth,
  expandedIds,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  isLast,
  onFlashImport,
  onFlashImportSupplier,
  colors,
}) => {
  const isExpanded = expandedIds.has(node.id),
    hasChildren = node.children.length > 0;
  return (
    <Box
      sx={{
        borderBottom:
          depth === 0 && !isLast ? `1px solid ${colors.slate.divider}` : "none",
      }}
    >
      <Box
        onClick={() => onToggle(node.id)}
        sx={{
          px: 1.5,
          py: depth === 0 ? 1 : 0.75,
          pl: 1.5 + depth * 2.75,
          display: "flex",
          alignItems: "center",
          gap: 1,
          cursor: "pointer",
          background: depth === 0 ? "transparent" : colors.slate.mutedBg,
          borderBottom:
            depth > 0 ? `1px solid ${colors.slate.divider}` : "none",
          "&:hover": {
            background:
              depth === 0 ? colors.slate.itemHover : colors.slate.hover,
          },
          transition: "background .15s",
        }}
      >
        <Box
          sx={{
            width: depth === 0 ? 30 : 26,
            height: depth === 0 ? 30 : 26,
            borderRadius: depth === 0 ? "7px" : "6px",
            background: depth === 0 ? colors.violet.bg : colors.blue.bg,
            border: `1px solid ${depth === 0 ? colors.violet.border : colors.blue.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <AccountBalanceOutlined
            sx={{
              fontSize: depth === 0 ? "0.85rem" : "0.75rem",
              color: depth === 0 ? colors.violet.text : colors.blue.text,
            }}
          />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: depth === 0 ? "0.75rem" : "0.7rem",
              fontWeight: depth === 0 ? 700 : 600,
              color: colors.gray.pri,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {node.accountName}
          </Typography>
          {hasChildren && (
            <Typography
              sx={{ fontSize: "0.58rem", color: colors.gray.sec, mt: 0.2 }}
            >
              {node.children.length} linked account
              {node.children.length === 1 ? "" : "s"}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
          {node.accountName === "Collection" && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFlashImport(node);
              }}
              sx={{
                width: 26,
                height: 26,
                color: colors.amber.text,
                "&:hover": { bgcolor: colors.amber.bg },
              }}
            >
              <FlashOnOutlined sx={{ fontSize: "0.8rem" }} />
            </IconButton>
          )}
          {node.accountName === "Purchases" && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onFlashImportSupplier(node);
              }}
              sx={{
                width: 26,
                height: 26,
                color: colors.teal.text,
                "&:hover": { bgcolor: colors.teal.bg },
              }}
            >
              <FlashOnOutlined sx={{ fontSize: "0.8rem" }} />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(node);
            }}
            sx={{
              width: 26,
              height: 26,
              color: colors.green.text,
              "&:hover": { bgcolor: colors.green.bg },
            }}
          >
            <Add sx={{ fontSize: "0.8rem" }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            sx={{
              width: 26,
              height: 26,
              color: colors.blue.text,
              "&:hover": { bgcolor: colors.blue.bg },
            }}
          >
            <Edit sx={{ fontSize: "0.8rem" }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id, node.accountName);
            }}
            sx={{
              width: 26,
              height: 26,
              color: colors.red.text,
              "&:hover": { bgcolor: colors.red.bg },
            }}
          >
            <Delete sx={{ fontSize: "0.8rem" }} />
          </IconButton>
        </Box>
        <IconButton
          size="small"
          sx={{
            width: 22,
            height: 22,
            color: colors.gray.muted,
            border: `1px solid ${colors.slate.border}`,
            borderRadius: "50%",
            p: 0,
            ml: 0.5,
            visibility: hasChildren ? "visible" : "hidden",
          }}
        >
          {isExpanded ? (
            <KeyboardArrowUp sx={{ fontSize: "0.85rem" }} />
          ) : (
            <KeyboardArrowDown sx={{ fontSize: "0.85rem" }} />
          )}
        </IconButton>
      </Box>
      <Collapse in={isExpanded && hasChildren}>
        <Box sx={{ background: colors.slate.mutedBg }}>
          {node.children.map((child, idx) => (
            <AccountTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onAdd={onAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              onFlashImport={onFlashImport}
              onFlashImportSupplier={onFlashImportSupplier}
              isLast={idx === node.children.length - 1}
              colors={colors}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
};

export default function JournalAccountsView({
  search,
  setSearch,
  loading,
  accountTree,
  expandedAccountIds,
  toggleExpanded,
  handleAdd,
  handleAddChild,
  handleEdit,
  handleDelete,
  handleFlashImport,
  handleFlashImportSupplier,
  fetchJournalAccounts,
  isModalOpen,
  selectedAccount,
  modalMode,
  handleModalClose,
  handleSaveSuccess,
  openDeleteModal,
  entityToDelete,
  setOpenDeleteModal,
  setEntityToDelete,
  handleDeleteSuccess,
  flashImportOpen,
  flashImportTarget,
  setFlashImportOpen,
  setFlashImportTarget,
  flashImportSupplierOpen,
  flashImportSupplierTarget,
  setFlashImportSupplierOpen,
  setFlashImportSupplierTarget,
}) {
  const theme = useTheme(),
    isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);
  return (
    <PageLayout title="Journal Accounts" subtitle="Chart of journal accounts">
      <section className="flex items-center gap-2 mb-3">
        <div className="flex-grow">
          <CustomSearchField
            label="Search Journal Account"
            value={search}
            onChange={setSearch}
          />
        </div>
        <SyncMenu onSync={fetchJournalAccounts} />
        <BaseButton
          label="Journal Account"
          tooltip="Add Journal Account"
          icon={<Add />}
          onClick={handleAdd}
          actionColor="approve"
          variant="contained"
        />
      </section>
      <section>
        <Box
          sx={{
            background: colors.slate.outerBg,
            boxShadow: isDark ? "none" : theme.shadows[1],
            border: `1px solid ${colors.slate.border}`,
            borderRadius: "8px",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <Typography sx={{ fontSize: "0.7rem", color: colors.gray.muted }}>
                Loading accounts…
              </Typography>
            </Box>
          ) : accountTree.length === 0 ? (
            <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
              <Typography sx={{ fontSize: "0.7rem", color: colors.gray.muted }}>
                No journal accounts found.
              </Typography>
            </Box>
          ) : (
            accountTree.map((node, idx) => (
              <AccountTreeNode
                key={node.id}
                node={node}
                depth={0}
                expandedIds={expandedAccountIds}
                onToggle={toggleExpanded}
                onAdd={handleAddChild}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onFlashImport={handleFlashImport}
                onFlashImportSupplier={handleFlashImportSupplier}
                isLast={idx === accountTree.length - 1}
                colors={colors}
              />
            ))
          )}
        </Box>
      </section>
      <JournalAccountAEModal
        open={isModalOpen}
        onClose={handleModalClose}
        initialData={selectedAccount}
        onSaved={handleSaveSuccess}
      />
      <DeleteVerificationModal
        open={openDeleteModal}
        onClose={() => {
          setOpenDeleteModal(false);
          setEntityToDelete(null);
        }}
        entityToDelete={entityToDelete}
        onSuccess={handleDeleteSuccess}
      />
      <FlashImportClientsModal
        open={flashImportOpen}
        onClose={() => {
          setFlashImportOpen(false);
          setFlashImportTarget(null);
        }}
        parentAccount={flashImportTarget}
        onSaved={fetchJournalAccounts}
      />
      <FlashImportSuppliersModal
        open={flashImportSupplierOpen}
        onClose={() => {
          setFlashImportSupplierOpen(false);
          setFlashImportSupplierTarget(null);
        }}
        parentAccount={flashImportSupplierTarget}
        onSaved={fetchJournalAccounts}
      />
    </PageLayout>
  );
}
