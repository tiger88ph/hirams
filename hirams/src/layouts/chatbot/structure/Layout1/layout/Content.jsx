import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import getThemeColors from "../../../../../utils/style/getThemeColors";

const EMPTY_STATE_TEXT =
  "Ask me anything about this transaction — I can summarize, explain, or help you find what you need.";

// --- lightweight markdown-ish renderer -------------------------------

function renderInline(text, keyPrefix) {
  // splits on **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).filter(Boolean);

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Typography key={key} component="strong" sx={{ fontWeight: 700, fontSize: "inherit" }}>
          {part.slice(2, -2)}
        </Typography>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Box
          key={key}
          component="code"
          sx={{
            fontFamily: "monospace",
            fontSize: "0.85em",
            background: "rgba(127,127,127,0.15)",
            borderRadius: "4px",
            px: 0.5,
            py: 0.1,
          }}
        >
          {part.slice(1, -1)}
        </Box>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Typography key={key} component="em" sx={{ fontStyle: "italic", fontSize: "inherit" }}>
          {part.slice(1, -1)}
        </Typography>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function renderFormattedText(text, colors) {
  const lines = text.split("\n");
  const blocks = [];
  let listBuffer = [];
  let codeBuffer = [];
  let inCodeBlock = false;

  const flushList = (key) => {
    if (listBuffer.length) {
      blocks.push(
        <Box key={`list-${key}`} component="ul" sx={{ m: 0, pl: 2.5, mb: 0.5 }}>
          {listBuffer.map((item, idx) => (
            <Box key={idx} component="li" sx={{ mb: 0.25 }}>
              {renderInline(item, `li-${key}-${idx}`)}
            </Box>
          ))}
        </Box>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, idx) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(
          <Box
            key={`code-${idx}`}
            component="pre"
            sx={{
              fontFamily: "monospace",
              fontSize: "0.8em",
              background: "rgba(127,127,127,0.15)",
              borderRadius: "6px",
              p: 1,
              overflowX: "auto",
              mb: 0.5,
              whiteSpace: "pre-wrap",
            }}
          >
            {codeBuffer.join("\n")}
          </Box>
        );
        codeBuffer = [];
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    const listMatch = line.match(/^\s*[-*]\s+(.*)/);
    if (listMatch) {
      listBuffer.push(listMatch[1]);
      return;
    }

    flushList(idx);

    if (line.trim() === "") {
      blocks.push(<Box key={`sp-${idx}`} sx={{ height: 4 }} />);
    } else {
      blocks.push(
        <Typography key={`p-${idx}`} sx={{ fontSize: "inherit", lineHeight: 1.5, m: 0 }}>
          {renderInline(line, `p-${idx}`)}
        </Typography>
      );
    }
  });

  flushList("end");

  return blocks;
}

// ----------------------------------------------------------------------

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
              "& > *:last-child": { mb: 0 },
            }}
          >
            {m.role === "assistant" ? renderFormattedText(m.text, colors) : m.text}
          </Box>
        ))
      )}
    </Box>
  );
}

export default Content;