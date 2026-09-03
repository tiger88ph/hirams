import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const EMPTY_STATE_TEXT =
  "Ask me anything about this transaction — I can summarize, explain, or help you find what you need.";

function Content({
  messages = [],
  listRef,
  emptyStateIconSize = 28,
  emptyStateTextSize = "0.72rem",
  messageFontSize = "0.75rem",
  messageBorderRadius = "10px",
  gap = 1,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);

  return (
    <Box
      ref={listRef}
      sx={{
        flex: 1,
        overflowY: "auto",
        px: 1.5,
        py: 1.5,
        display: "flex",
        flexDirection: "column",
        gap,
      }}
    >
      {messages.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            color: colors.gray.textDisabled,
            textAlign: "center",
            px: 2,
          }}
        >
          <AutoAwesome sx={{ fontSize: emptyStateIconSize, opacity: 0.5 }} />
          <Typography sx={{ fontSize: emptyStateTextSize }}>{EMPTY_STATE_TEXT}</Typography>
        </Box>
      ) : (
        messages.map((m) => (
          <Box
            key={m.id}
            sx={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: m.role === "user" ? colors.blue.bg : colors.slate.innerBg,
              color: m.role === "user" ? colors.blue.textStrong : colors.gray.textPrimary,
              borderRadius: messageBorderRadius,
              px: 1.25,
              py: 0.75,
              fontSize: messageFontSize,
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {m.text}
          </Box>
        ))
      )}
    </Box>
  );
}

export default Content;