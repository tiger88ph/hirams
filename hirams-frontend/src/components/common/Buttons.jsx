import React from "react";
import { Button, Badge, IconButton, Tooltip, Box } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ContactsIcon from "@mui/icons-material/Contacts"; // ✅ Add this import
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd"; // ✅ Icon for Assign AO
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import UndoIcon from "@mui/icons-material/Undo";
import ContentPasteIcon from "@mui/icons-material/ContentPaste"; // Canvassing / Info
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
const ResponsiveLabel = ({ children }) => (
  <Box
    component="span"
    sx={{
      display: { xs: "none", sm: "inline" },
    }}
  >
    {children}
  </Box>
);

// 🟧 Add Button (for top header)
export const AddButton = ({ onClick, label = "Add User" }) => (
  <Button
    variant="contained"
    onClick={onClick}
    sx={{
      textTransform: "none",
      bgcolor: "#6b7280",
      "&:hover": { bgcolor: "#80868F" },
      borderRadius: "9999px",
      fontSize: "0.7rem",
      px: { xs: 1.5, sm: 2 },
      py: 0.5,
      whiteSpace: "nowrap",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "fit-content",
      height: 32,
    }}
  >
    <span className="hidden sm:flex items-center gap-1">
      <AddIcon fontSize="small" />
      {label}
    </span>
    <span className="flex sm:hidden">
      <AddIcon fontSize="small" />
    </span>
  </Button>
);

// 🟦 General Action Icons
export const InfoButton = ({ onClick }) => (
  <InfoIcon
    className="cursor-pointer hover:text-blue-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);
export const HistoryButton = ({ onClick }) => (
  <HistoryIcon
    className="cursor-pointer hover:text-blue-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);
export const ExportButton = ({ onClick }) => (
  <FileDownloadIcon
    className="cursor-pointer hover:text-blue-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);
export const PasteButton = ({ onClick }) => (
  <ContentPasteIcon
    className="cursor-pointer hover:text-blue-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);
export const EditButton = ({ onClick }) => (
  <EditIcon
    className="cursor-pointer hover:text-blue-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);
export const DeleteButton = ({ onClick }) => (
  <DeleteIcon
    className="cursor-pointer hover:text-red-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);

export const ActionIcons = ({ onEdit, onDelete }) => (
  <div className="flex justify-center space-x-3 text-gray-600">
    <EditButton onClick={onEdit} />
    {onDelete && <DeleteButton onClick={onDelete} />}
  </div>
);

export const ClientIcons = ({ onEdit, onDelete, onInfo }) => (
  <div className="flex justify-center space-x-3 text-gray-600">
    {onEdit && <EditButton onClick={onEdit} />}
    {onDelete && <DeleteButton onClick={onDelete} />}
    {onInfo && <InfoButton onClick={onInfo} />}
  </div>
);

export const PClientIcons = ({ onEdit }) => (
  <div className="flex justify-center space-x-3 text-gray-600">
    <EditButton onClick={onEdit} />
  </div>
);
// 🟢 New Revert Button (Undo)
export const RevertButton = ({ onClick }) => (
  <UndoIcon
    className="cursor-pointer hover:text-blue-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);
// 💰 New Pricing Butto
export const PricingButton = ({ onClick }) => (
  <AttachMoneyIcon
    className="cursor-pointer hover:text-green-600 transition-colors"
    fontSize="small"
    onClick={onClick}
  />
);
export const TransactionIcons = ({ onEdit, onDelete, onRevert, onPricing }) => (
  <div className="flex justify-center space-x-1 text-gray-600">
    {onEdit && <EditButton onClick={onEdit} />}
    {onPricing && <PricingButton onClick={onPricing} />}
    {onRevert && <RevertButton onClick={onRevert} />}
    {onDelete && <DeleteButton onClick={onDelete} />}
  </div>
);

export const AccountOfficerIcons = ({ onInfo, onRevert, onExport }) => (
  <div className="flex justify-center space-x-1 text-gray-600">
    {/* 📝 Canvassing / Info Icon */}
    {onInfo && <PasteButton onClick={onInfo} />}
    {onRevert && <RevertButton onClick={onRevert} />}
    {onExport && <ExportButton onClick={onExport} />}
  </div>
);

// 🟩 Supplier-specific Action Icons
export const ContactButton = ({ onClick }) => (
  <ContactsIcon
    className="cursor-pointer text-gray-600 hover:text-blue-600 transition"
    fontSize="small"
    onClick={onClick}
  />
);
export const BankButton = ({ onClick }) => (
  <AccountBalanceIcon
    className="cursor-pointer hover:text-cyan-600 transition"
    fontSize="small"
    onClick={onClick}
  />
);

export const SupplierIcons = ({ onEdit, onContact, onBank }) => (
  <div className="flex justify-center space-x-1 text-gray-600">
    {onEdit && <EditButton onClick={onEdit} />}
    {onContact && <ContactButton onClick={onContact} />}
    {onBank && <BankButton onClick={onBank} />}
  </div>
);

// 🟢 New Buttons
export const ApproveButton = ({ onClick, label = "Approve" }) => (
  <Button
    variant="contained"
    color="primary"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2,
      borderRadius: "9999px", // fully rounded
    }}
  >
    {label}
  </Button>
);

export const ActiveButton = ({ onClick, label = "Activate" }) => (
  <Button
    variant="contained"
    color="success"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2,
      borderRadius: "9999px", // fully rounded
    }}
  >
    {label}
  </Button>
);

export const InactiveButton = ({ onClick, label = "Deactivate" }) => (
  <Button
    variant="contained"
    color="error"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2,
      borderRadius: "9999px", // fully rounded
    }}
  >
    {label}
  </Button>
);
// Sort Buttons (compact for toolbar)
export const SortActiveButton = ({ onClick, active, label = "Active" }) => (
  <Button
    variant={active ? "contained" : "outlined"}
    color="success"
    onClick={onClick}
    size="small"
    sx={{
      textTransform: "none",
      fontSize: "0.75rem",
      px: 1.5,
      borderRadius: 2,
      borderWidth: 1,
    }}
  >
    {label}
  </Button>
);

export const SortInactiveButton = ({ onClick, active, label = "Inactive" }) => (
  <Button
    variant={active ? "contained" : "outlined"}
    color="error"
    onClick={onClick}
    size="small"
    sx={{
      textTransform: "none",
      fontSize: "0.75rem",
      px: 1.5,
      borderRadius: 2,
      borderWidth: 1,
    }}
  >
    {label}
  </Button>
);

export const SortPendingButton = ({
  onClick,
  active,
  pendingCount = 0,
  label = "Pending",
}) => (
  <Badge
    badgeContent={pendingCount}
    color="warning"
    overlap="rectangular" // use rectangular for buttons
    anchorOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    sx={{
      "& .MuiBadge-badge": {
        transform: "scale(0.8) translate(50%, -50%)", // fine-tune position
        transformOrigin: "top right",
      },
    }}
  >
    <Button
      variant={active ? "contained" : "outlined"}
      color="warning"
      onClick={onClick}
      size="small"
      sx={{
        textTransform: "none",
        fontSize: "0.75rem",
        px: 1.5,
        borderRadius: 2,
        borderWidth: 1,
      }}
    >
      {label}
    </Button>
  </Badge>
);

// Toolbar container
export const SortClientToolbar = ({
  statusFilter,
  setStatusFilter,
  clients,
}) => {
  const pendingCount = clients.filter(
    (c) => c.status.toLowerCase() === "pending"
  ).length;

  return (
    <div className="flex justify-start space-x-2 gap-1">
      <SortActiveButton
        active={statusFilter === "Active"}
        onClick={() => setStatusFilter("Active")}
      />
      <SortInactiveButton
        active={statusFilter === "Inactive"}
        onClick={() => setStatusFilter("Inactive")}
      />
      <SortPendingButton
        active={statusFilter === "Pending"}
        onClick={() => setStatusFilter("Pending")}
        pendingCount={pendingCount}
      />
    </div>
  );
};

export const AssignAccountOfficerButton = ({ onClick, label = "Assign" }) => (
  <Tooltip title={label}>
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        px: { xs: 1.5, sm: 2.5 },
        borderRadius: "9999px",
        bgcolor: "#2563eb",
        "&:hover": { bgcolor: "#1d4ed8" },
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto",
      }}
    >
      <AssignmentIndIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);

export const ReassignAccountOfficerButton = ({
  onClick,
  label = "Reassign",
}) => (
  <Tooltip title={label}>
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        px: { xs: 1.5, sm: 2.5 },
        borderRadius: "9999px",
        bgcolor: "#2563eb",
        "&:hover": { bgcolor: "#1d4ed8" },
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto",
      }}
    >
      <AssignmentIndIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);


export const VerifyButton = ({ onClick, label = "Verify" }) => (
  <Tooltip title={label}>
    <Button
      variant="contained"
      color="success"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        px: { xs: 1.5, sm: 4.5 }, // smaller padding on mobile
        borderRadius: "9999px",
        bgcolor: "#16a34a",
        "&:hover": { bgcolor: "#15803d" },
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto",
      }}
    >
      <CheckCircleOutlineIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);

export const SetPriceButton = ({ onClick, label = "Set Price" }) => (
  <Tooltip title={label}>
    <Button
      variant="contained"
      color="primary"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        px: { xs: 1.5, sm: 2.5 },
        borderRadius: "9999px",
        bgcolor: "#2563eb",
        "&:hover": { bgcolor: "#1d4ed8" },
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto",
      }}
    >
      <AttachMoneyIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);
export const FinalizeButton = ({
  onClick,
  label = "Finalize",
  disabled = false, // <-- add disabled prop
}) => (
  <Tooltip title={label}>
    <Button
      variant="contained"
      color="success"
      onClick={onClick}
      disabled={disabled} // <-- pass disabled to MUI button
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        px: { xs: 1.5, sm: 4.5 },
        borderRadius: "9999px",
        bgcolor: "#16a34a",
        "&:hover": { bgcolor: disabled ? "#16a34a" : "#15803d" }, // hover effect when disabled
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto",
        opacity: disabled ? 0.5 : 1, // show visually disabled
      }}
    >
      <CheckCircleOutlineIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);

export const RevertButton1 = ({ onClick, label = "Revert" }) => (
  <Tooltip title={label}>
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        px: { xs: 1.5, sm: 2.5 },
        borderRadius: "9999px",
        bgcolor: "#3b82f6",
        "&:hover": { bgcolor: "#2563eb" },
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto",
      }}
    >
      <UndoIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);

export const SaveButton = ({ onClick, label = "Save" }) => (
  <Tooltip title={label}>
    <Button
      variant="contained"
      onClick={onClick}
      sx={{
        textTransform: "none",
        fontSize: "0.8rem",
        px: { xs: 1.5, sm: 2.5 },
        borderRadius: "9999px",
        bgcolor: "#16a34a",
        color: "white",
        "&:hover": { bgcolor: "#15803d" },
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto", // shrink to icon only on small screens
      }}
    >
      <SaveIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);

export const BackButton = ({ onClick, label = "Back" }) => (
  <Tooltip title={label}>
    <Button
      variant="outlined"
      onClick={onClick}
      sx={{
        textTransform: "none",
        borderRadius: "9999px",
        fontSize: "0.85rem",
        px: { xs: 1.5, sm: 2.5 },
        color: "#555",
        borderColor: "#bfc4c9",
        "&:hover": { borderColor: "#9ca3af", bgcolor: "#f3f4f6" },
        display: "flex",
        alignItems: "center",
        gap: 1,
        minWidth: "auto",
      }}
    >
      <ArrowBackIosNewIcon fontSize="small" />
      <ResponsiveLabel>{label}</ResponsiveLabel>
    </Button>
  </Tooltip>
);