import React, { useState, useRef } from "react";
import {
  Paper,
  Popper,
  ClickAwayListener,
  useMediaQuery,
  useTheme,
  Slide,
  Box,
} from "@mui/material";

import NotificationsIcon from "@mui/icons-material/Notifications";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CloseIcon from "@mui/icons-material/Close";

import { useNavigate } from "react-router-dom";

/* ── Mock Data ───────────────────────────────────────────────── */
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: "info",
    title: "New transaction assigned",
    message: "Transaction #TXN-2024-001 has been assigned to you for pricing.",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    link: "/transactions",
  },
  {
    id: 2,
    type: "success",
    title: "Pricing approved",
    message: "Your pricing set for ABC Corp has been approved by management.",
    timestamp: new Date(Date.now() - 1000 * 60 * 32),
    read: false,
    link: "/transactions",
  },
  {
    id: 3,
    type: "warning",
    title: "Document submission due soon",
    message: "Transaction #TXN-2024-003 document is due in 2 days.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: false,
    link: "/transactions",
  },
  {
    id: 4,
    type: "info",
    title: "New pricing set created",
    message: "A new pricing set 'Set A' was created for XYZ Project.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    read: true,
    link: "/transactions",
  },
  {
    id: 5,
    type: "success",
    title: "Transaction finalized",
    message: "Transaction #TXN-2024-005 has been finalized successfully.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    link: "/transactions",
  },
];

/* ── Helpers ─────────────────────────────────────────────────── */
const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const typeConfig = {
  info: {
    icon: <InfoOutlinedIcon sx={{ fontSize: 18 }} />,
    bg: "#EFF6FF",
    color: "#2563EB",
  },
  success: {
    icon: <TaskAltIcon sx={{ fontSize: 18 }} />,
    bg: "#F0FDF4",
    color: "#16A34A",
  },
  warning: {
    icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,
    bg: "#FFFBEB",
    color: "#D97706",
  },
};

/* ═════════════════════════════════════════════════════════════ */
function NotificationMenu() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => setOpen((prev) => !prev);
  const handleClose = () => setOpen(false);

  const markAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const deleteNotification = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAsRead = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleClick = (n) => {
    setNotifications((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
    );
    handleClose();
    if (n.link) navigate(n.link);
  };

  /* ── Shared panel ────────────────────────────────────────────── */
  const PanelContent = (
    <Paper
      elevation={isMobile ? 0 : 4}
      sx={{
        width: isMobile ? "100%" : 360,
        maxHeight: isMobile ? "80vh" : 480,
        borderRadius: isMobile ? "16px 16px 0 0" : "10px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        border: isMobile ? "none" : "1px solid #F1F5F9",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 1.75,
          py: 1.5,
          borderBottom: "1px solid #F1F5F9",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Box sx={{ fontWeight: 700, fontSize: 14, color: "#1E293B" }}>
            Notifications
          </Box>
          {unreadCount > 0 && (
            <Box
              sx={{
                backgroundColor: "#EFF6FF",
                color: "#2563EB",
                fontSize: 11,
                fontWeight: 700,
                borderRadius: 999,
                px: 0.875,
                lineHeight: 1.8,
              }}
            >
              {unreadCount} new
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {unreadCount > 0 && (
            <Box
              onClick={markAllAsRead}
              sx={{
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "#2563EB",
                cursor: "pointer",
                px: 0.75,
                py: 0.375,
                borderRadius: 1,
                "&:hover": { backgroundColor: "#EFF6FF" },
              }}
            >
              <DoneAllIcon sx={{ fontSize: 14 }} />
              Mark all read
            </Box>
          )}
          {isMobile && (
            <Box
              onClick={handleClose}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#94A3B8",
                p: 0.5,
                borderRadius: 1,
                "&:hover": { backgroundColor: "#F1F5F9" },
              }}
            >
              <CloseIcon sx={{ fontSize: 18 }} />
            </Box>
          )}
        </Box>
      </Box>

      {/* List */}
      <Box sx={{ overflowY: "auto", flex: 1 }}>
        {notifications.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              py: 6,
              gap: 1,
              color: "#94A3B8",
            }}
          >
            <NotificationsIcon sx={{ fontSize: 36, color: "#CBD5E1" }} />
            <Box sx={{ fontSize: 13 }}>No notifications</Box>
          </Box>
        ) : (
          notifications.map((n) => {
            const cfg = typeConfig[n.type] || typeConfig.info;
            return (
              <Box
                key={n.id}
                onClick={() => handleClick(n)}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.25,
                  px: 1.75,
                  py: 1.25,
                  cursor: "pointer",
                  borderBottom: "1px solid #F1F5F9",
                  bgcolor: n.read ? "#fff" : "#F8FAFF",
                  position: "relative",
                  transition: "background-color 0.15s",
                  "&:hover": { bgcolor: "#F8FAFC" },
                  "&:last-child": { borderBottom: "none" },
                }}
              >
                {/* Unread dot */}
                {!n.read && (
                  <Box
                    sx={{
                      position: "absolute",
                      left: 6,
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      bgcolor: "#2563EB",
                    }}
                  />
                )}

                {/* Type icon */}
                <Box
                  sx={{
                    flexShrink: 0,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    bgcolor: cfg.bg,
                    color: cfg.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mt: 0.25,
                  }}
                >
                  {cfg.icon}
                </Box>

                {/* Text */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 0.5,
                      mb: 0.25,
                    }}
                  >
                    <Box
                      sx={{
                        fontWeight: n.read ? 500 : 700,
                        fontSize: 13,
                        color: "#1E293B",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {n.title}
                    </Box>
                    <Box sx={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>
                      {timeAgo(n.timestamp)}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      fontSize: 12,
                      color: "#64748B",
                      lineHeight: 1.4,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {n.message}
                  </Box>
                </Box>

                {/* Actions */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.25,
                    flexShrink: 0,
                  }}
                >
                  {!n.read && (
                    <Box
                      onClick={(e) => markAsRead(e, n.id)}
                      title="Mark as read"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#94A3B8",
                        p: 0.25,
                        borderRadius: 0.5,
                        "&:hover": { color: "#2563EB", bgcolor: "#EFF6FF" },
                      }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                    </Box>
                  )}
                  <Box
                    onClick={(e) => deleteNotification(e, n.id)}
                    title="Delete"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#94A3B8",
                      p: 0.25,
                      borderRadius: 0.5,
                      "&:hover": { color: "#EF4444", bgcolor: "#FEF2F2" },
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* Footer */}
      {notifications.length > 0 && (
        <Box
          sx={{
            px: 1.75,
            py: 1,
            borderTop: "1px solid #F1F5F9",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          <Box
            onClick={() => {
              handleClose();
              navigate("/notifications");
            }}
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color: "#2563EB",
              cursor: "pointer",
              display: "inline-block",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            View all notifications
          </Box>
        </Box>
      )}
    </Paper>
  );

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div style={{ position: "relative" }}>
        {/* Bell */}
        <button
          ref={bellRef}
          onClick={handleToggle}
          style={{
            position: "relative",
            padding: 8,
            borderRadius: "50%",
            border: "none",
            background: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F3F4F6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <NotificationsIcon
            sx={{
              fontSize: 22,
              color: open ? "#2563EB" : "#6B7280",
              transition: "color 0.2s",
            }}
          />
          {unreadCount > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                minWidth: 16,
                height: 16,
                borderRadius: 999,
                bgcolor: "#EF4444",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: 0.375,
                lineHeight: 1,
                boxShadow: "0 0 0 2px #fff",
              }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Box>
          )}
        </button>

        {/* Desktop dropdown */}
        {!isMobile && (
          <Popper
            open={open}
            anchorEl={bellRef.current}
            placement="bottom-end"
            disablePortal={false}
            modifiers={[
              { name: "flip", enabled: true },
              {
                name: "preventOverflow",
                enabled: true,
                options: { boundary: "window" },
              },
            ]}
            sx={{ zIndex: 1300 }}
          >
            <Box sx={{ mt: 1, position: "relative" }}>
              {/* Caret arrow */}
              <Box
                sx={{
                  position: "absolute",
                  top: -7,
                  right: 14,
                  width: 0,
                  height: 0,
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderBottom: "7px solid #fff",
                  zIndex: 1,
                }}
              />
              {PanelContent}
            </Box>
          </Popper>
        )}

        {/* Mobile bottom sheet */}
        {isMobile && (
          <>
            {/* Backdrop */}
            <Box
              onClick={handleClose}
              sx={{
                position: "fixed",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.4)",
                zIndex: 1300,
                opacity: open ? 1 : 0,
                pointerEvents: open ? "auto" : "none",
                transition: "opacity 0.25s ease",
              }}
            />
            {/* Sheet with Slide animation */}
            <Slide direction="up" in={open} mountOnEnter unmountOnExit>
              <Box
                sx={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1400,
                }}
              >
                {/* Drag handle */}
                <Box
                  sx={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    bgcolor: "#CBD5E1",
                    mx: "auto",
                    mb: 0.75,
                    mt: 1,
                  }}
                />
                {PanelContent}
              </Box>
            </Slide>
          </>
        )}
      </div>
    </ClickAwayListener>
  );
}

export default NotificationMenu;
