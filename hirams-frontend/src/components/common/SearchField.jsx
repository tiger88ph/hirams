import React from "react";
import { TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const CustomSearchField = ({
  label = "Search",
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div className="flex items-center gap-2 flex-grow">
      <SearchIcon sx={{ color: "#6b7280" }} />
      <TextField
        label={label}
        placeholder={placeholder}
        variant="outlined"
        size="small"
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        sx={{
          flexGrow: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: "9999px", // pill shape
            "& fieldset": { borderRadius: "9999px" },
            "&:hover fieldset": { borderColor: "#6b7280" },
            "&.Mui-focused fieldset": {
              borderColor: "#4b5563",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#6b7280",
            transform: "translate(14px, 10px) scale(1)",
          },
          "& .MuiInputLabel-shrink": {
            transform: "translate(14px, -6px) scale(0.75)",
            backgroundColor: "white",
            padding: "0 4px",
          },
        }}
      />
    </div>
  );
};

export default CustomSearchField;
