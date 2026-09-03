import React, { useState, useRef, useEffect, useMemo } from "react";
import { Box, useTheme } from "@mui/material";
import Header from "./Header";
import Content from "./Content";
import Footer from "./Footer";
import getThemeColors from "../../../../../utils/style/getThemeColors";

function AIChatbotLayout({
  onClose,
  messages = [],
  onSend,
  title = "AI Assistant",
  placeholder = "Ask AI...",
  headerIconBoxSize = 26,
  headerIconFontSize = 14,
  headerTitleFontSize = "0.8rem",
  emptyStateIconSize = 28,
  emptyStateTextSize = "0.72rem",
  messageFontSize = "0.75rem",
  messageBorderRadius = "10px",
  inputFontSize = "0.75rem",
  inputBorderRadius = "8px",
  sendIconSize = 16,
  footerSx,
  sx,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  const [draft, setDraft] = useState("");
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    onSend?.(text);
    setDraft("");
  };

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.slate.outerBg,
        ...sx,
      }}
    >
      <Header
        onClose={onClose}
        title={title}
        iconBoxSize={headerIconBoxSize}
        iconFontSize={headerIconFontSize}
        titleFontSize={headerTitleFontSize}
      />
      <Content
        messages={messages}
        listRef={listRef}
        emptyStateIconSize={emptyStateIconSize}
        emptyStateTextSize={emptyStateTextSize}
        messageFontSize={messageFontSize}
        messageBorderRadius={messageBorderRadius}
      />
      <Footer
        draft={draft}
        setDraft={setDraft}
        onSend={handleSend}
        placeholder={placeholder}
        inputFontSize={inputFontSize}
        inputBorderRadius={inputBorderRadius}
        sendIconSize={sendIconSize}
        sx={footerSx}
      />
    </Box>
  );
}

export default AIChatbotLayout;