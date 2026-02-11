import React from "react";
import { Box, Typography, Paper, Divider } from "@mui/material";
import ModalContainer from "../../../common/ModalContainer";

/** -----------------------------
 * Account Profile Modal
 --------------------------------*/
function AccountProfileModal({ open, onClose, user }) {
  if (!open || !user) return null;

  // Compute full name
  const fullName =
    [user?.strFName, user?.strMName, user?.strLName]
      .filter(Boolean)
      .join(" ") || "No Name";

  // BASE_URL-safe profile image
  const profileImage = user?.strProfileImage
    ? `${import.meta.env.BASE_URL}profile/${user.strProfileImage}`
    : user?.cSex === "M"
      ? `${import.meta.env.BASE_URL}profile/profile-male.png`
      : user?.cSex === "F"
        ? `${import.meta.env.BASE_URL}profile/profile-female.png`
        : `${import.meta.env.BASE_URL}profile/index.png`;

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Account Profile"
      subTitle={fullName ? `/ ${fullName.trim()}` : ""}
      showSave={false}
      width={850}
    >
      <Paper elevation={0} sx={{ backgroundColor: "transparent" }}>
        {/* Profile Info */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              overflow: "hidden",
              mb: 1,
              border: "2px solid #0d47a1",
            }}
          >
            <img
              src={profileImage}
              alt="Profile"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </Box>

          <Typography variant="h6" fontWeight={600}>
            {fullName}
          </Typography>

          {user?.strPosition && (
            <Typography variant="body2" color="text.secondary">
              {user.strPosition}
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />
      </Paper>
    </ModalContainer>
  );
}

export default AccountProfileModal;
