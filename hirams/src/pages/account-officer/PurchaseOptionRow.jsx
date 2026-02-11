import React from "react";
import { Box, Paper, Typography, Checkbox} from "@mui/material";
import { Edit, Delete, ExpandLess, CompareArrows } from "@mui/icons-material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import BaseButton from "../../components/common/BaseButton";

const PurchaseOptionRow = ({
  option,
  index,
  isLastOption,
  itemId,
  checkboxOptionsEnabled,
  expandedOptions,
  optionErrors,
  onToggleInclude,
  onToggleOptionSpecs,
  onEditOption,
  onDeleteOption,
  onCompareClick,
  item,
  isManagement,
  isFirstAddOn, // New prop to identify the first add-on
  hasNoRegularOptions, // New prop to check if there are no regular options
  displayIndex
}) => {
  
  return (
    <React.Fragment>
      {/* NO OPTIONS MESSAGE - Show before add-ons header if no regular options */}
      {isFirstAddOn && Number(option.bAddOn) === 1 && hasNoRegularOptions && (
        <Box
          sx={{
            py: 1,
            mt: 2,
            textAlign: "center",
            fontSize: "0.75rem",
            color: "text.secondary",
            fontStyle: "italic",
          }}
        >
          No options available.
        </Box>
      )}

      {/* ADD-ONS HEADER - Show before first add-on */}
      {isFirstAddOn && Number(option.bAddOn) === 1 && (
        <Box
          sx={{
            mt: 2,
            mb: 1,
            px: 2,
            py: 0.7,
            backgroundColor: "#e8f5e9",
            borderTop: "1px solid #c8e6c9",
            borderBottom: "1px solid #c8e6c9",
            borderRadius: 1,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "#2E7D32",
          }}
        >
          Add-ons
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          position: "relative",
          px: 1.2,
          py: 0.7,
          display: "flex",
          flexDirection: "column",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          transition: "background 0.2s",
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.85)",
          },
        }}
      >
        {/* Row content */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* DESCRIPTION + EXPAND ICON */}
          <Box
            sx={{
              flex: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Checkbox
                  checked={!!option.bIncluded}
                  disabled={!checkboxOptionsEnabled}
                  onChange={(e) =>
                    onToggleInclude(itemId, option.id, e.target.checked)
                  }
                  sx={{
                    p: 0.5,
                    color:
                      Number(option.bAddOn) === 1
                        ? "#2E7D32"
                        : optionErrors[option.id]
                          ? "error.main"
                          : "text.secondary",
                    "&.Mui-checked": {
                      color:
                        Number(option.bAddOn) === 1 ? "#2E7D32" : undefined,
                    },
                    transition: "color 0.2s ease",
                  }}
                />

                {optionErrors[option.id] && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: "calc(100% + 6px)",
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 10,
                      backgroundColor: "rgba(255,255,255,0.94)",
                      color: "error.main",
                      fontSize: "0.65rem",
                      lineHeight: 1.2,
                      px: 0.75,
                      py: 0.3,
                      borderRadius: 1,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      animation: "optionErrorFade 0.18s ease-out",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        left: -4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        borderWidth: 4,
                        borderStyle: "solid",
                        borderColor:
                          "transparent rgba(255,255,255,0.94) transparent transparent",
                      },
                      "@keyframes optionErrorFade": {
                        from: {
                          opacity: 0,
                          transform: "translateY(-50%) scale(0.95)",
                        },
                        to: {
                          opacity: 1,
                          transform: "translateY(-50%) scale(1)",
                        },
                      },
                    }}
                  >
                    {optionErrors[option.id]}
                  </Box>
                )}
              </Box>

              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                {displayIndex}.{" "}
                {option.supplierNickName || option.strSupplierNickName}
              </Typography>
            </Box>

            <ArrowDropDownIcon
              sx={{
                fontSize: 22,
                transform: expandedOptions[option.id]
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
                transition: "0.25s",
                cursor: "pointer",
                mr: { xs: 0, lg: 4 },
              }}
              onClick={() => onToggleOptionSpecs(option.id)}
            />
          </Box>
          <Box
            sx={{
              flex: 2,
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
              }}
            >
              {option.strBrand} | {option.strModel}
            </Typography>
          </Box>

          {/* QUANTITY */}
          <Box
            sx={{
              flex: 1,
              textAlign: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: optionErrors[option.id] ? "red" : "text.primary",
                fontWeight: 400,
              }}
            >
              {option.nQuantity}
              <br />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: optionErrors[option.id] ? "red" : "#666",
                }}
              >
                {option.strUOM}
              </span>
            </Typography>
          </Box>

          {/* UNIT PRICE */}
          <Box
            sx={{
              flex: 1.5,
              textAlign: "right",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
              }}
            >
              ₱{" "}
              {Number(option.dUnitPrice).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Typography>
          </Box>

          {/* EWT */}
          <Box
            sx={{
              flex: 1.5,
              textAlign: "right",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
              }}
            >
              ₱{" "}
              {Number(option.dEWT).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Typography>
          </Box>

          {/* TOTAL */}
          <Box
            sx={{
              flex: 1.5,
              textAlign: "right",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: "text.primary",
                fontWeight: 400,
              }}
            >
              ₱{" "}
              {(option.nQuantity * option.dUnitPrice).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                },
              )}
            </Typography>
          </Box>

          {/* ACTION ICONS */}
          {checkboxOptionsEnabled && !isManagement && (
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 0,
              }}
            >
              <BaseButton
                icon={<Edit sx={{ fontSize: "0.9rem" }} />}
                tooltip="Edit"
                onClick={() => onEditOption(option)}
                disabled={option.bIncluded}
                size="small"
              />

              <BaseButton
                icon={<Delete sx={{ fontSize: "0.9rem" }} />}
                tooltip="Delete"
                onClick={() => onDeleteOption(itemId, option)}
                disabled={option.bIncluded}
                size="small"
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* SPECS DROPDOWN */}
      {expandedOptions[option.id] && (
        <Paper
          elevation={1}
          sx={{
            mt: 0,
            mb: isLastOption ? 0 : 1.5,
            background: "#f9f9f9",
            overflow: "hidden",
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          {/* SPECS HEADER + BODY */}
          <Box
            sx={{
              px: 2,
              py: 0.5,
              backgroundColor: "#e3f2fd",
              borderBottom: "1px solid #cfd8dc",
              fontWeight: 400,
              color: "#1976d2",
              fontSize: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "relative",
              pl: 5,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                left: 8,
                top: 0,
                bottom: 0,
                width: 16,
                display: "flex",
                alignItems: "center",
              }}
            >
              {/* vertical line */}
              <Box
                sx={{
                  width: 1,
                  height: "100%",
                  backgroundColor: "#90caf9",
                }}
              />
              {/* horizontal line */}
              <Box
                sx={{
                  width: 16,
                  height: 1,
                  backgroundColor: "#90caf9",
                  ml: 0.5,
                }}
              />
            </Box>

            <span>Specifications:</span>

            <Box sx={{ display: "flex", gap: 1 }}>
              {/* Compare Button */}
              <button
                style={{
                  fontSize: "0.6rem",
                  background: "#fff",
                  border: "1px solid #cfd8dc",
                  cursor: "pointer",
                  color: "#1976d2",
                  fontWeight: 500,
                  borderRadius: "6px",
                  padding: "1px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onClick={() => onCompareClick(item, option)}
              >
                Compare
                <CompareArrows fontSize="small" />
              </button>

              {/* Hide Button */}
              <button
                style={{
                  fontSize: "0.6rem",
                  background: "#fff",
                  border: "1px solid #cfd8dc",
                  cursor: "pointer",
                  color: "#1976d2",
                  fontWeight: 500,
                  borderRadius: "6px",
                  padding: "1px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
                onClick={() => onToggleOptionSpecs(option.id)}
              >
                Hide
                <ExpandLess fontSize="small" />
              </button>
            </Box>
          </Box>

          <Box
            sx={{
              px: 2,
              pl: 7,
              py: 1,
              minHeight: 100,
              maxHeight: 100,
              overflowY: "auto",
              backgroundColor: "#f4faff",
              color: "text.secondary",
              fontSize: "0.8rem",
              "& *": {
                backgroundColor: "transparent !important",
              },
              "& ul": {
                paddingLeft: 2,
                margin: 0,
                listStyleType: "disc",
              },
              "& ol": {
                paddingLeft: 2,
                margin: 0,
                listStyleType: "decimal",
              },
              "& li": {
                marginBottom: 0.25,
              },
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{
              __html: option.strSpecs || "No specifications available.",
            }}
          />
        </Paper>
      )}
    </React.Fragment>
  );
};

export default PurchaseOptionRow;