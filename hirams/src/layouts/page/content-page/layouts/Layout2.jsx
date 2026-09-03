import React, { useState, useEffect, useCallback, useMemo } from "react";

import {
  ClickAwayListener,
  Paper,
  Popper,
  IconButton,
  Tooltip,
  Box,
  Skeleton,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import AccountProfileModal from "../../../../pages/common/user/modal/AccountProfileModal";
import { resolveProfileImage } from "../../../../utils/helpers/profileImage";
import NotificationMenu from "../../../../components/menu/NotificationMenu";
import { getItem } from "../../../../utils/storage/localStorage";
import { useLogout } from "../../../../utils/auth/logout";
import useMapping from "../../../../utils/mappings/useMapping";
import { useThemeMode } from "../../../../hooks/useThemeMode";
import getThemeColors from "../../../../utils/style/getThemeColors";
import BaseButton from "../../../../components/form/BaseButton";
import AIChatbotWidget from "../../../../components/widget/AIChatBotWidget";

// ── Helpers ──────────────────────────────────────────────────────────
const readUserFromStorage = () => getItem("user", {});

const extractBgColor = (node) => {
  if (!React.isValidElement(node)) return null;
  const sx = node.props?.sx;
  if (sx && typeof sx === "object") {
    return sx.background || sx.backgroundColor || null;
  }
  return null;
};

const extractLabelText = (node) => {
  if (node == null || typeof node === "boolean") return null;
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = extractLabelText(child);
      if (found) return found;
    }
    return null;
  }
  if (React.isValidElement(node)) {
    if (typeof node.props?.label === "string") return node.props.label;
    return extractLabelText(node.props?.children);
  }
  return null;
};

const isIconElement = (node) => {
  if (!React.isValidElement(node)) return false;
  const t = node.type;
  return t?.muiName === "SvgIcon" || t?.render?.muiName === "SvgIcon";
};

const extractIcon = (node) => {
  if (node == null || typeof node === "boolean") return null;
  if (typeof node === "string" || typeof node === "number") return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = extractIcon(child);
      if (found) return found;
    }
    return null;
  }
  if (React.isValidElement(node)) {
    if (isIconElement(node)) return node;
    return extractIcon(node.props?.children);
  }
  return null;
};

const collectActionItems = (node, results = []) => {
  if (node == null || typeof node === "boolean") return results;
  if (Array.isArray(node)) {
    node.forEach((child) => collectActionItems(child, results));
    return results;
  }
  if (React.isValidElement(node)) {
    if (typeof node.props?.onClick === "function") {
      results.push({
        label: extractLabelText(node) || "Action",
        icon: extractIcon(node),
        bgColor: extractBgColor(node),
        onClick: node.props.onClick,
        disabled: Boolean(node.props?.disabled),
      });
      return results;
    }
    collectActionItems(node.props?.children, results);
    return results;
  }
  return results;
};

const useColors = (c) => ({
  surfaceBg: c.slate.outerBg,
  borderColor: c.slate.border,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,
  blueBg: c.blue.bg,
  blueText: c.blue.text,
  blueRing: c.blue.ring,
  redBg: c.red.bg,
  redText: c.red.text,
  overlayBg: c.slate.overlay,
  mutedBg: c.slate.mutedBg,
  hoverSubtle: c.slate.hover,
});

const Layout2 = ({
  title,
  subtitle,
  children,
  footer,
  footerLActions,
  footerRActions,
  loading = false,
  scrollRef,
  actions,
  onArchive,
  headerRight,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [user, setUser] = useState(readUserFromStorage);
  const logout = useLogout();
  const { userTypes, defaultUserType } = useMapping();
  const { mode, toggleMode } = useThemeMode();

  useEffect(() => {
    const handleStorageChange = () => setUser(readUserFromStorage());
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const profileImage = resolveProfileImage(user);
  const nickName = user?.strFName || user?.strNickName || "User";
  const role =
    userTypes[user?.cUserType] ?? defaultUserType?.[user?.cUserType] ?? "";
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [actionsAnchorEl, setActionsAnchorEl] = useState(null);

  const handleActionsClick = (event) => {
    setActionsAnchorEl(event.currentTarget);
    setActionsMenuOpen((prev) => !prev);
  };

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
    setProfileOpen((prev) => !prev);
  };

  const handleModalClose = useCallback(() => {
    setProfileModalOpen(false);
  }, []);

  return (
    <div
      className="flex flex-col max-h-[calc(100vh-1rem)] min-h-[calc(100vh-1rem)] rounded-tl-xl rounded-bl-xl overflow-hidden relative ml-0 border"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        backgroundColor: colors.surfaceBg,
        borderColor: colors.borderColor,
      }}
    >
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {/* HEADER */}
      <header
        className="sticky top-0 z-20 px-0 py-2 pt-2 pb-2 mx-1 mt-1 rounded-t-lg border-b"
        style={{ borderColor: colors.borderColor }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 pl-1 sm:pl-2.5 min-w-0 flex-1">
            <div
              className="w-1 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: colors.blueText }}
            />
            <div className="flex flex-col justify-center min-w-0">
              <h1
                className="text-xs sm:text-sm font-bold leading-tight truncate"
                style={{ color: colors.textPrimary }}
              >
                {title}
              </h1>
              {subtitle && (
                <span
                  className="leading-tight italic truncate block"
                  style={{
                    fontSize: "0.68em",
                    fontWeight: 400,
                    color: colors.textSecondary,
                  }}
                >
                  {subtitle}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {headerRight && (
              <>
                <div>{headerRight}</div>
                <div
                  className="w-px h-6 mx-1 sm:mx-2 flex-shrink-0"
                  style={{ backgroundColor: colors.borderColor }}
                />
              </>
            )}

            <NotificationMenu />

            <Tooltip
              title={
                mode === "dark" ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              <IconButton
                onClick={toggleMode}
                size="small"
                sx={{
                  border: `1px solid ${colors.borderColor}`,
                  borderRadius: "30px",
                }}
              >
                {mode === "dark" ? (
                  <Brightness7Icon fontSize="small" />
                ) : (
                  <Brightness4Icon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>

            <div
              className="w-px h-6 mx-1 sm:mx-2 flex-shrink-0"
              style={{ backgroundColor: colors.borderColor }}
            />

            <ClickAwayListener onClickAway={() => setProfileOpen(false)}>
              <div
                className="relative flex items-center gap-2 cursor-pointer"
                onClick={handleProfileClick}
              >
                <div
                  className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent transition-all duration-200 flex-shrink-0"
                  style={{ "&:hover": { outlineColor: colors.blueRing } }}
                >
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden sm:flex flex-col leading-tight mr-3 min-w-0">
                  <span
                    className="text-xs font-semibold truncate"
                    style={{ color: colors.textPrimary }}
                  >
                    {nickName}
                  </span>
                  {role && (
                    <span
                      className="text-[0.7em] font-normal truncate"
                      style={{ color: colors.textSecondary }}
                    >
                      {role}
                    </span>
                  )}
                </div>

                <Popper
                  open={profileOpen}
                  anchorEl={anchorEl}
                  placement="bottom-end"
                  style={{ zIndex: 1300 }}
                >
                  <div
                    style={{
                      position: "relative",
                      marginTop: 8,
                      marginRight: 4,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: -7,
                        right: 14,
                        width: 0,
                        height: 0,
                        borderLeft: "7px solid transparent",
                        borderRight: "7px solid transparent",
                        borderBottom: `7px solid ${colors.surfaceBg}`,
                        zIndex: 1,
                      }}
                    />
                    <Paper elevation={3} sx={{ p: 1, minWidth: 190 }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 0.75,
                            py: 0.5,
                            borderRadius: 1,
                            color: colors.textPrimary,
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: colors.blueBg,
                              color: colors.blueText,
                            },
                          }}
                          onClick={() => {
                            setProfileModalOpen(true);
                            setProfileOpen(false);
                          }}
                        >
                          <AccountCircleIcon fontSize="small" />
                          <span style={{ fontSize: 14 }}>Account Profile</span>
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            px: 0.75,
                            py: 0.5,
                            borderRadius: 1,
                            color: colors.textPrimary,
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: colors.redBg,
                              color: colors.redText,
                            },
                          }}
                          onClick={() => {
                            setProfileOpen(false);
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
              </div>
            </ClickAwayListener>

            <AccountProfileModal
              open={profileModalOpen}
              onClose={handleModalClose}
            />
          </div>
        </div>
      </header>

      <div
        className="flex-1 relative overflow-hidden mx-1 flex min-h-0"
        style={{ alignItems: "stretch" }}
      >
        <div
          ref={scrollRef}
          className="flex-1 p-3 space-y-0 overflow-auto min-h-0"
          style={loading ? { pointerEvents: "none" } : undefined}
        >
          {children}
        </div>
        
        {/* <AIChatbotWidget accentColor={colors.blueText} /> */}

        {/* TEMPORARY HIDE THE AI CHAT BOT */}
      </div>

      {/* FOOTER */}
      {(footer || footerLActions || footerRActions) && (
        <footer
          className="sticky bottom-0 z-20 px-3 py-2 mx-1 mb-1 rounded-b-lg border-t"
          style={{ borderColor: colors.borderColor }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Skeleton
                variant="rounded"
                width={90}
                height={28}
                sx={{ borderRadius: "999px" }}
              />
              <Box sx={{ display: "flex", gap: 0.75 }}>
                <Skeleton
                  variant="rounded"
                  width={70}
                  height={28}
                  sx={{ borderRadius: "999px" }}
                />
                <Skeleton
                  variant="rounded"
                  width={70}
                  height={28}
                  sx={{ borderRadius: "999px" }}
                />
              </Box>
            </Box>
          ) : footer ? (
            footer
          ) : (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {footerLActions}

              {footerRActions && (
                <>
                  <Box
                    sx={{
                      display: { xs: "none", sm: "flex" },
                      gap: 0.75,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {footerRActions}
                  </Box>

                  <Box sx={{ display: { xs: "block", sm: "none" } }}>
                    <ClickAwayListener
                      onClickAway={() => setActionsMenuOpen(false)}
                    >
                      <div>
                        <BaseButton
                          label="Menu"
                          icon={<MenuIcon fontSize="small" />}
                          onClick={handleActionsClick}
                          actionColor="back"
                        />
                        <Popper
                          open={actionsMenuOpen}
                          anchorEl={actionsAnchorEl}
                          placement="top-end"
                          style={{ zIndex: 1300 }}
                        >
                          <Paper
                            elevation={4}
                            sx={{
                              p: 0.5,
                              mb: 1,
                              minWidth: 160,
                              maxWidth: 150,
                              borderRadius: "10px",
                              border: `1px solid ${colors.borderColor}`,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                              }}
                            >
                              {collectActionItems(footerRActions).map(
                                (item, i) => (
                                  <Box
                                    key={i}
                                    onClick={() => {
                                      if (!item.disabled) {
                                        item.onClick();
                                        setActionsMenuOpen(false);
                                      }
                                    }}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.75,
                                      px: 1,
                                      py: 0.6,
                                      borderRadius: "6px",
                                      fontSize: "0.72rem",
                                      fontWeight: 600,
                                      color: item.disabled
                                        ? colors.textDisabled
                                        : item.bgColor || colors.textPrimary,
                                      bgcolor: item.disabled
                                        ? colors.mutedBg
                                        : "transparent",
                                      cursor: item.disabled
                                        ? "not-allowed"
                                        : "pointer",
                                      transition: "filter .15s ease",
                                      opacity: item.disabled ? 0.5 : 1,
                                      "&:hover": !item.disabled
                                        ? {
                                            filter: item.bgColor
                                              ? "brightness(0.95)"
                                              : "none",
                                            bgcolor: item.bgColor
                                              ? undefined
                                              : colors.hoverSubtle,
                                          }
                                        : undefined,
                                    }}
                                  >
                                    {item.icon && (
                                      <Box
                                        sx={{
                                          display: "inline-flex",
                                          flexShrink: 0,
                                          "& svg": { fontSize: "0.85rem" },
                                        }}
                                      >
                                        {item.icon}
                                      </Box>
                                    )}
                                    <span style={{ whiteSpace: "nowrap" }}>
                                      {item.label}
                                    </span>
                                  </Box>
                                ),
                              )}
                            </Box>
                          </Paper>
                        </Popper>
                      </div>
                    </ClickAwayListener>
                  </Box>
                </>
              )}
            </Box>
          )}
        </footer>
      )}
    </div>
  );
};

export default Layout2;
