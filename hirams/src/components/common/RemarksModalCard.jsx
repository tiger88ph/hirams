import React from "react";
import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import RestoreIcon from "@mui/icons-material/Restore";
import VerifiedIcon from "@mui/icons-material/Verified";
import CancelIcon from "@mui/icons-material/Cancel";
import BlockIcon from "@mui/icons-material/Block";
import FormGrid from "./FormGrid";

export default function RemarksModalCard({
  remarks,
  setRemarks,
  remarksError,
  onBack,
  onSave,
  /** Optional customization */
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

  // Choose icon, color, and description based on action
  const getIconConfig = () => {
    const action = actionWord.toLowerCase();

    if (action.includes("revert")) {
      return {
        icon: RestoreIcon,
        gradient: "linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)",
        iconColor: "#FF6F00",
        title: "Revert",
        description: "Restore this item to its previous state",
        description2: "Add revert notes or comments (optional)",
      };
    }

    if (action.includes("verif") || action.includes("approve")) {
      return {
        icon: VerifiedIcon,
        gradient: "linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)",
        iconColor: "#2E7D32",
        title: "Verify",
        description: "Mark this item as verified and approved",
        description2: "Add verification notes or comments (optional)",
      };
    }

    if (action.includes("final")) {
      return {
        icon: CheckCircleIcon,
        gradient: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
        iconColor: "#00695C",
        title: "Finalize",
        description: "Complete and finalize this transaction",
        description2: "Add finalization notes or comments (optional)",
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
        description: "Modify and save changes to this item",
        description2: "Add notes about what was changed (optional)",
      };
    }

    if (action.includes("complete") || action.includes("finish")) {
      return {
        icon: CheckCircleIcon,
        gradient: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)",
        iconColor: "#00695C",
        title: "Complete",
        description: "Finalize and mark this item as complete",
        description2: "Add completion notes or comments (optional)",
      };
    }

    // Default
    return {
      icon: EditIcon,
      gradient: "linear-gradient(135deg, #F3E5F5 0%, #E1BEE7 100%)",
      iconColor: "#7B1FA2",
      title: "Provide Remarks",
      description: "Add notes or comments for this action",
      description2: "Enter your remarks below",
    };
  };

  const {
    icon: IconComponent,
    gradient,
    iconColor,
    title,
    description,
    description2,
  } = getIconConfig();

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
          <Box
            sx={{
              position: "relative",
              zIndex: 1,
            }}
          >

            {/* Entity Name (e.g., "DepEd - OrMin : Purchase of Assorted Candies") */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.813rem" },
                color: "text.secondary",
                mb: 1.5,
                lineHeight: 1,
              }}
            >
              {entityName}
            </Typography>

            {/* Target Info (if available) */}
            {selectedAOName && selectedAOName.trim() !== "" && (
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontSize: { xs: "0.75rem", sm: "0.813rem" },
                  fontWeight: 500,
                  mb: 1.5,
                }}
              >
                Target: <strong>{selectedAOName}</strong>
              </Typography>
            )}

            {/* Main Description */}
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.75rem", sm: "0.813rem" },
                mb: 0.75,
                opacity: 0.9,
                lineHeight: 1.5,
              }}
            >
              {description}
            </Typography>

            {/* Second Description - Instructions for remarks */}
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                opacity: 0.75,
                fontStyle: "italic",
                lineHeight: 1.4,
              }}
            >
              {description2}
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

        {/* FormGrid - Connected to header */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            backgroundColor: "background.paper",
          }}
        >
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
