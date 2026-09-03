import React, { useMemo } from "react";
import { Box, IconButton, useTheme } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import getThemeColors from "../../../../../utils/style/getThemeColors";

function Footer({
  draft,
  setDraft,
  onSend,
  placeholder = "Ask AI...",
  inputFontSize = "0.75rem",
  inputBorderRadius = "8px",
  sendIconSize = 16,
  sx,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.75,
        px: 1.25,
        py: 1,
        borderTop: `1px solid ${colors.slate.border}`,
        flexShrink: 0,
        ...sx,
      }}
    >
      <Box
        component="input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSend();
        }}
        placeholder={placeholder}
        sx={{
          flex: 1,
          border: `1px solid ${colors.slate.border}`,
          backgroundColor: colors.gray.inputBg,
          borderRadius: inputBorderRadius,
          px: 1.25,
          py: 0.85,
          fontSize: inputFontSize,
          color: colors.gray.textPrimary,
          outline: "none",
          "&::placeholder": { color: colors.gray.textDisabled },
        }}
      />
      <IconButton
        size="small"
        onClick={onSend}
        disabled={!draft.trim()}
        sx={{
          backgroundColor: colors.blue.text,
          color: "#fff",
          "&:hover": { backgroundColor: colors.blue.text, filter: "brightness(0.92)" },
          "&.Mui-disabled": { backgroundColor: colors.slate.innerBg, color: colors.gray.textDisabled },
        }}
      >
        <SendIcon sx={{ fontSize: sendIconSize }} />
      </IconButton>
    </Box>
  );
}

export default Footer;