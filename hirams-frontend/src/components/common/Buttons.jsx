import React from "react";
import { Button, Badge, IconButton, Tooltip } from "@mui/material";
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
    <DeleteButton onClick={onDelete} />
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
  <div className="flex justify-center space-x-3 text-gray-600">
    {onEdit && <EditButton onClick={onEdit} />}
    {onPricing && <PricingButton onClick={onPricing} />}
    {onRevert && <RevertButton onClick={onRevert} />}
    {onDelete && <DeleteButton onClick={onDelete} />}
  </div>
);

export const AccountOfficerIcons = ({ onInfo, onRevert, onPricing }) => (
  <div className="flex justify-center space-x-1">
    {/* 📝 Canvassing / Info Icon */}
    {onInfo && (
      <IconButton
        onClick={onInfo}
        color="primary"
        size="small"
        title="View Canvassing Info"
      >
        <ContentPasteIcon fontSize="small" />
      </IconButton>
    )}

    {/* 💰 Show Pricing only if handler is provided */}
    {onPricing && <PricingButton onClick={onPricing} />}

    {/* 🔄 Show Revert only if handler is provided */}
    {onRevert && <RevertButton onClick={onRevert} />}
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

export const SupplierIcons = ({ onEdit, onDelete, onContact, onBank }) => (
  <div className="flex justify-center space-x-3 text-gray-600">
    {onEdit && <EditButton onClick={onEdit} />}
    {onContact && <ContactButton onClick={onContact} />}
    {onBank && <BankButton onClick={onBank} />}
    {onDelete && <DeleteButton onClick={onDelete} />}
  </div>
);

// 🟢 New Buttons
export const ApproveButton = ({ onClick, label = "Approve Client" }) => (
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

export const ActiveButton = ({ onClick, label = "Activate Client" }) => (
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

export const InactiveButton = ({ onClick, label = "Deactivate Client" }) => (
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

// 🟣 NEW — Assign Account Officer Button
export const AssignAccountOfficerButton = ({ onClick, label = "Assign" }) => (
  <Button
    variant="contained"
    color="secondary"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      bgcolor: "#6b21a8",
      "&:hover": { bgcolor: "#7e22ce" },
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <AssignmentIndIcon fontSize="small" />
    {label}
  </Button>
);

// 🟣 NEW — Assign Account Officer Button
export const ReassignAccountOfficerButton = ({
  onClick,
  label = "Reassign",
}) => (
  <Button
    variant="contained"
    color="secondary"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      bgcolor: "#6b21a8",
      "&:hover": { bgcolor: "#7e22ce" },
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <AssignmentIndIcon fontSize="small" />
    {label}
  </Button>
);
export const VerifyButton = ({ onClick, label = "Verify" }) => (
  <Button
    variant="contained"
    color="success"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      bgcolor: "#16a34a", // Tailwind 'green-600'
      "&:hover": { bgcolor: "#15803d" }, // Tailwind 'green-700'
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <CheckCircleOutlineIcon fontSize="small" />
    {label}
  </Button>
);
export const SetPriceButton = ({ onClick, label = "Set Price" }) => (
  <Button
    variant="contained"
    color="primary"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      bgcolor: "#2563eb", // Tailwind 'blue-600'
      "&:hover": { bgcolor: "#1d4ed8" }, // Tailwind 'blue-700'
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <AttachMoneyIcon fontSize="small" />
    {label}
  </Button>
);
export const FinalizeButton = ({ onClick, label = "Finalize" }) => (
  <Button
    variant="contained"
    color="success"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      bgcolor: "#16a34a", // ✅ Green theme
      "&:hover": { bgcolor: "#15803d" },
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <CheckCircleOutlineIcon fontSize="small" />
    {label}
  </Button>
);
export const RevertButton1 = ({ onClick, label = "Revert" }) => (
  <Button
    variant="contained"
    color="success"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      bgcolor: "#A9A9A9", // ✅ Green theme
      "&:hover": { bgcolor: "#D3D3D3" },
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <UndoIcon fontSize="small" />
    {label}
  </Button>
);
// ✅ Save (Text Only)
export const SaveButton = ({ onClick, label = "Save" }) => (
  <Button
    variant="contained"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      bgcolor: "#16a34a",
      color: "white",
      "&:hover": { bgcolor: "#15803d" },
    }}
  >
    {label}
  </Button>
);

// 🔙 Back (Text Only)
export const BackButton = ({ onClick, label = "Back" }) => (
  <Button
    variant="outlined"
    onClick={onClick}
    sx={{
      textTransform: "none",
      fontSize: "0.8rem",
      px: 2.5,
      borderRadius: "9999px",
      borderColor: "#6b7280",
      color: "#374151",
      "&:hover": {
        borderColor: "#4b5563",
        backgroundColor: "#f3f4f6",
      },
    }}
  >
    {label}
  </Button>
);
