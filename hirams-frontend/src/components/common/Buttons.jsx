import React from "react";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContactsIcon from "@mui/icons-material/Contacts";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import InfoIcon from "@mui/icons-material/Info";

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
// 🟦 General Action Icons
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
export const ClientIcons = ({ onEdit, onDelete }) => (
  <div className="flex justify-center space-x-3 text-gray-600">
    <EditButton onClick={onEdit} />
    <InfoButton />
    <DeleteButton onClick={onDelete} />
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

export const SupplierIcons = ({ onContact, onBank }) => (
  <div className="flex justify-center space-x-3 text-gray-600">
    {onContact && <ContactButton onClick={onContact} />}
    {onBank && <BankButton onClick={onBank} />}
  </div>
);
