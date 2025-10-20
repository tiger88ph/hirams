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
    <div className="flex items-center gap-1 flex-grow">
      <SearchIcon sx={{ color: "#6b7280", fontSize: 18 }} />
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
            height: 32, // reduce overall height
            fontSize: "0.8rem",
            borderRadius: "9999px",
            "& fieldset": { borderRadius: "9999px" },
            "&:hover fieldset": { borderColor: "#6b7280" },
            "&.Mui-focused fieldset": {
              borderColor: "#4b5563",
              borderWidth: 2,
            },
            "& input": {
              padding: "4px 12px", // smaller padding
            },
          },
          "& .MuiInputLabel-root": {
            fontSize: "0.75rem",
            color: "#6b7280",
            transform: "translate(12px, 6px) scale(1)",
          },
          "& .MuiInputLabel-shrink": {
            transform: "translate(12px, -6px) scale(0.7)",
            backgroundColor: "white",
            padding: "0 3px",
          },
        }}
      />
    </div>
  );
};

export default CustomSearchField;
