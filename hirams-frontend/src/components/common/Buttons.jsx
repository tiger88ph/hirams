import React from "react";
import { Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

// 🟧 Add Button (for top header)
export const AddButton = ({ onClick, label = "Add User" }) => (
  <Button
    variant="contained"
    onClick={onClick}
    sx={{
      textTransform: "none",
      bgcolor: "#fb8c00",
      "&:hover": { bgcolor: "#f57c00" },
      borderRadius: "9999px",
      fontSize: "0.7rem",
      px: { xs: 1.5, sm: 2 },
      py: 0.5,
      whiteSpace: "nowrap",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "fit-content",
      height: 32, // smaller height
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

// 🟦 Individual Action Icons
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

// 🟩 Wrapper for multiple icons (for convenience)
export const ActionIcons = ({ onEdit, onDelete }) => (
  <div className="flex justify-center space-x-3 text-gray-600">
    <EditButton onClick={onEdit} />
    <DeleteButton onClick={onDelete} />
  </div>
);
