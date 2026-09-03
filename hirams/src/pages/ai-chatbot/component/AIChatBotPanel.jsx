import React, { useMemo } from "react";
import { Box, useTheme } from "@mui/material";
import getThemeColors from "../../../utils/style/getThemeColors";
import AIChatbotLayout from "../../../layouts/chatbot/structure";

const useColors = (c) => ({
  surfaceBg: c.slate.outerBg,
  innerBg: c.slate.innerBg,
  borderColor: c.slate.border,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,
  blueBg: c.blue.bg,
  blueBgSoft: c.blue.bgSoft,
  blueText: c.blue.text,
  blueTextStrong: c.blue.textStrong,
  blueBorder: c.blue.border,
  inputBg: c.gray.inputBg,
});

/**
 * AIChatbotPanel
 *
 * Desktop, inline sliding panel meant to sit alongside page content
 * (rendered as a flex sibling inside the content area, not an overlay).
 *
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - width: number, panel width in px, defaults to 340
 *  - messages: optional array of { id, role: "user" | "assistant", text }
 *  - onSend: optional (text: string) => void — called when the user submits a message
 */
function AIChatbotPanel({ open, onClose, width = 340, messages = [], onSend }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  return (
    <Box
      sx={{
        mt: 1.5,
        mb: 1.5,
        mr: 0,
        flexShrink: 0,
        alignSelf: "stretch",
        width: open ? width : 0,
        overflow: "hidden",
        transition: "width 0.25s ease",
        borderTop: open ? `1px solid ${colors.borderColor}` : "none",
        borderBottom: open ? `1px solid ${colors.borderColor}` : "none",
        borderLeft: open ? `1px solid ${colors.borderColor}` : "none",
        borderRight: "none",
        borderTopLeftRadius: 8,
        borderBottomLeftRadius: 8,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          width,
          height: "100%",
          minHeight: 0,
          backgroundColor: colors.surfaceBg,
          borderTopLeftRadius: 8,
          borderBottomLeftRadius: 8,
          overflow: "hidden",
        }}
      >
        <AIChatbotLayout colors={colors} onClose={onClose} messages={messages} onSend={onSend} />
      </Box>
    </Box>
  );
}

export default AIChatbotPanel;