import React from "react";
import { Box, Typography } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import FormGrid from "./FormGrid";

function VerificationModalCard({
  entityName,
  verificationInput,
  setVerificationInput,
  verificationError,
  onBack,
  onConfirm,
  actionWord = "Delete",
  instructionLabel = `Enter the first character of "${entityName}" to confirm the ${actionWord.toLowerCase()}.`,
  confirmButtonColor = "error",
  confirmButtonText,
  helperText = ``,
}) {
  const capitalizedAction =
    actionWord.charAt(0).toUpperCase() + actionWord.slice(1).toLowerCase();

  // FormGrid configuration
  const fields = [
    {
      name: "verification",
      label: instructionLabel,
      xs: 12,
      multiline: false,
      maxLength: 1,
    },
  ];

  const formData = { verification: verificationInput };
  const errors = { verification: verificationError };
  const handleChange = (e) => setVerificationInput(e.target.value);

  // Handle when Enter is pressed on the last (and only) field
  const handleLastFieldTab = () => {
    onConfirm?.();
  };

  // Icon configuration for delete action
  const IconComponent = DeleteForeverIcon;
  const gradient = "linear-gradient(135deg, #FFEBEE 0%, #FFCDD2 100%)";
  const iconColor = "#C62828";

  return (
    <Box>
      {/* Professional Card Container */}
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Professional Header with Gradient Background and Faded Icon */}
        <Box
          sx={{
            position: "relative",
            background: gradient,
            overflow: "hidden",
            px: 2.5,
            py: 2.5,
          }}
        >
          {/* Large Faded Icon in Background */}
          <Box
            sx={{
              position: "absolute",
              right: -20,
              top: "50%",
              transform: "translateY(-50%)",
              color: iconColor,
              opacity: 0.12,
              pointerEvents: "none",
            }}
          >
            <IconComponent sx={{ fontSize: { xs: 90, sm: 110, md: 125 } }} />
          </Box>

          {/* Content */}
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* Entity Name */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.813rem" },
                color: "text.secondary",
                
                lineHeight: 1,
              }}
            >
              {entityName}
            </Typography>

          </Box>
        </Box>

        {/* Divider with subtle shadow */}
        <Box
          sx={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
          }}
        />

        {/* FormGrid Input - Connected to header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            backgroundColor: "background.paper",
          }}
        >
          <FormGrid
            fields={fields.map((f) => ({
              ...f,
              helperText: helperText || f.helperText,
            }))}
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            onLastFieldTab={handleLastFieldTab}
            autoFocus
          />
        </Box>
      </Box>
    </Box>
  );
}

export default VerificationModalCard;