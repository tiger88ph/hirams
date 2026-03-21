import React from "react";
import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import VerifiedIcon from "@mui/icons-material/Verified";
import FormGrid from "./FormGrid";

export default function RemarksModalCard({
  remarks,
  setRemarks,
  remarksError,
  onBack,
  onSave,
  actionWord = "updating",
  entityName = "this item",
  selectedAOName = null,
  saveButtonColor = "primary",
  saveButtonText = "Save Remarks",
}) {
  const fields = [
    {
      name: "remarks",
      label: "Remarks",
      type: "text",
      xs: 12,
    },
  ];

  const formData = { remarks };
  const errors = { remarks: remarksError };

  const handleChange = ({ target: { name, value } }) => {
    if (name === "remarks") setRemarks(value);
  };

  const getIconConfig = () => {
    const action = actionWord.toLowerCase();

    if (action.includes("revert")) {
      return {
        icon: RestoreIcon,
        gradient: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
        iconColor: "#FF6F00",
        title: "Revert",
      };
    }
    if (action.includes("verif") || action.includes("approve")) {
      return {
        icon: VerifiedIcon,
        gradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
        iconColor: "#2E7D32",
        title: "Verify",
      };
    }
    if (action.includes("final")) {
      return {
        icon: CheckCircleIcon,
        gradient: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
        iconColor: "#00695C",
        title: "Finalize",
      };
    }
    if (
      action.includes("edit") ||
      action.includes("update") ||
      action.includes("modify")
    ) {
      return {
        icon: EditIcon,
        gradient: "linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)",
        iconColor: "#1976D2",
        title: "Update",
      };
    }
    if (action.includes("complete") || action.includes("finish")) {
      return {
        icon: CheckCircleIcon,
        gradient: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
        iconColor: "#00695C",
        title: "Complete",
      };
    }
    return {
      icon: EditIcon,
      gradient: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
      iconColor: "#7B1FA2",
      title: "Provide Remarks",
    };
  };

  const { icon: IconComponent, gradient, iconColor, title } = getIconConfig();

  return (
    <Box>
      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            position: "relative",
            background: gradient,
            overflow: "hidden",
            px: 2.5,
            py: 2.5,
          }}
        >
          {/* Faded watermark icon */}
          <Box
            sx={{
              position: "absolute",
              right: -25,
              top: "50%",
              transform: "translateY(-50%)",
              color: iconColor,
              opacity: 0.12,
              pointerEvents: "none",
            }}
          >
            <IconComponent sx={{ fontSize: { xs: 100, sm: 120, md: 140 } }} />
          </Box>

          {/* Content */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.813rem" },
                color: "text.secondary",
                mb: selectedAOName ? 1.5 : 0,
                lineHeight: 1,
              }}
            >
              {entityName}
            </Typography>

            {selectedAOName && selectedAOName.trim() !== "" && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.75rem", sm: "0.813rem" },
                  fontWeight: 500,
                }}
              >
                Target: <strong>{selectedAOName}</strong>
              </Typography>
            )}
          </Box>
        </Box>

        {/* Divider */}
        <Box
          sx={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)",
          }}
        />

        {/* Form */}
        <Box sx={{ px: 2.5, py: 2, backgroundColor: "background.paper" }}>
          <FormGrid
            fields={fields}
            formData={formData}
            errors={errors}
            handleChange={handleChange}
            onLastFieldTab={onSave}
            autoFocus={true}
          />
        </Box>
      </Box>
    </Box>
  );
}