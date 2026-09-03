import React, { useState, useCallback, useMemo } from "react";
import { Paper, Popper, Box, alpha } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountProfileModal from "../../pages/common/user/modal/AccountProfileModal";
import { useLogout } from "../../utils/auth/logout";
import getThemeColors from "../../utils/style/getThemeColors";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  textPrimary: c.gray.textPrimary,
  primary: c.blue.text,
  danger: c.red.text,
  paperBg: c.slate.hoverBg || c.slate.hover,
});

function ProfileMenu({ anchorEl, open, onClose, placement = "bottom-end" }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const logout = useLogout();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const handleModalClose = useCallback(() => {
    setProfileModalOpen(false);
  }, []);

  const isBottom = placement.startsWith("bottom");
  const isTop = placement.startsWith("top");
  const isRight = placement.startsWith("right");

  // Arrow matches Paper background — uses MUI surface color
  const arrowColor = theme.palette.background.paper;

  const rowSx = (hoverColor) => ({
    display: "flex",
    alignItems: "center",
    gap: 1,
    px: 0.75,
    py: 0.5,
    cursor: "pointer",
    borderRadius: "4px",
    color: colors.textPrimary,
    transition: "color 0.15s, background-color 0.15s",
    "&:hover": {
      color: hoverColor,
      backgroundColor: alpha(hoverColor, isDark ? 0.16 : 0.08),
    },
  });

  return (
    <>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement={placement}
        style={{ zIndex: 1300 }}
      >
        <div
          style={{
            position: "relative",
            marginTop: isBottom ? 8 : 0,
            marginBottom: isTop ? 8 : 0,
            marginLeft: isRight ? 8 : 0,
          }}
        >
          {/* ▲ points UP — for header (bottom-end) */}
          {isBottom && (
            <div
              style={{
                position: "absolute",
                top: -7,
                right: 14,
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderBottom: `7px solid ${arrowColor}`,
                zIndex: 1,
              }}
            />
          )}

          {/* ▼ points DOWN — for top placements */}
          {isTop && (
            <div
              style={{
                position: "absolute",
                bottom: -7,
                right: 14,
                width: 0,
                height: 0,
                borderLeft: "7px solid transparent",
                borderRight: "7px solid transparent",
                borderTop: `7px solid ${arrowColor}`,
                zIndex: 1,
              }}
            />
          )}

          {/* ◀ points LEFT toward the avatar — for sidebar (right-start) */}
          {isRight && (
            <div
              style={{
                position: "absolute",
                left: -7,
                bottom: 14,
                width: 0,
                height: 0,
                borderTop: "7px solid transparent",
                borderBottom: "7px solid transparent",
                borderRight: `7px solid ${arrowColor}`,
                zIndex: 1,
              }}
            />
          )}

          <Paper elevation={3} style={{ padding: 8, minWidth: 190 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Box
                sx={rowSx(colors.primary)}
                onClick={() => {
                  setProfileModalOpen(true);
                  onClose();
                }}
              >
                <AccountCircleIcon fontSize="small" />
                <span style={{ fontSize: 14 }}>Account Profile</span>
              </Box>

              <Box
                sx={rowSx(colors.danger)}
                onClick={() => {
                  onClose();
                  logout();
                }}
              >
                <LogoutIcon fontSize="small" />
                <span style={{ fontSize: 14 }}>Logout</span>
              </Box>
            </div>
          </Paper>
        </div>
      </Popper>

      <AccountProfileModal open={profileModalOpen} onClose={handleModalClose} />
    </>
  );
}

export default ProfileMenu;