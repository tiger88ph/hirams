import React, { useState, useCallback } from "react";
import { Paper, Popper } from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountProfileModal from "../../pages/common/modal/AccountProfileModal";
import { useLogout } from "../../utils/auth/logout";

function ProfileMenu({ anchorEl, open, onClose, placement = "bottom-end" }) {
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const logout = useLogout();

  const handleModalClose = useCallback(() => {
    setProfileModalOpen(false);
  }, []);

  const isBottom = placement.startsWith("bottom");
  const isTop    = placement.startsWith("top");
  const isRight  = placement.startsWith("right");

  return (
    <>
      <Popper
        open={open}
        anchorEl={anchorEl}
        placement={placement}
        style={{ zIndex: 1300 }}
      >
        <div style={{
          position: "relative",
          marginTop:    isBottom ? 8 : 0,
          marginBottom: isTop    ? 8 : 0,
          marginLeft:   isRight  ? 8 : 0,
        }}>

          {/* ▲ points UP — for header (bottom-end) */}
          {isBottom && (
            <div style={{
              position: "absolute",
              top: -7,
              right: 14,
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "7px solid #fff",
              zIndex: 1,
            }} />
          )}

          {/* ▼ points DOWN — for top placements */}
          {isTop && (
            <div style={{
              position: "absolute",
              bottom: -7,
              right: 14,
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "7px solid #fff",
              zIndex: 1,
            }} />
          )}

          {/* ◀ points LEFT toward the avatar — for sidebar (right-start) */}
          {isRight && (
            <div style={{
              position: "absolute",
              left: -7,
              /* anchor at the vertical center of the 32px avatar.
                 Paper has 8px top padding, avatar center is at 16px → 8+16=24 */
              bottom: 14,
              width: 0,
              height: 0,
              borderTop: "7px solid transparent",
              borderBottom: "7px solid transparent",
              borderRight: "7px solid #fff",
              zIndex: 1,
            }} />
          )}

          <Paper elevation={3} style={{ padding: 8, minWidth: 190 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 6px",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
                className="hover:text-blue-600 hover:bg-blue-50 transition-colors"
                onClick={() => {
                  setProfileModalOpen(true);
                  onClose();
                }}
              >
                <AccountCircleIcon fontSize="small" />
                <span style={{ fontSize: 14 }}>Account Profile</span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 6px",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
                className="hover:text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  onClose();
                  logout();
                }}
              >
                <LogoutIcon fontSize="small" />
                <span style={{ fontSize: 14 }}>Logout</span>
              </div>

            </div>
          </Paper>
        </div>
      </Popper>

      <AccountProfileModal open={profileModalOpen} onClose={handleModalClose} />
    </>
  );
}

export default ProfileMenu;