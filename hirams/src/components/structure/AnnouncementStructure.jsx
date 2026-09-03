import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import AlertStructure from "./AlertStructure";
import announcementHtml from "../../utils/banners/announcement/example.txt?raw";
import getThemeColors from "../../utils/style/getThemeColors";

const SESSION_FLAG = "announcement_shown";

// ─────────────────────────────────────────────────────────────────
// INLINE COLOR MAP — per-file useColors pattern (PROMPT 1)
// ─────────────────────────────────────────────────────────────────
const useColors = (c, isDark) => ({
  // Scrollbar / border tones
  scrollThumb: isDark ? "#475569" : c.slate.border,
  headingText: isDark ? c.gray.textPrimary : "#0F172A",
  bodyText: c.gray.textSecondary,

  // Chip palettes — from theme colors
  amberBg: isDark ? "rgba(180,83,9,0.25)" : "#FFFBEB",
  amberText: isDark ? "#FCD34D" : c.amber.textDark,
  amberBorder: isDark ? "rgba(253,230,138,0.35)" : c.amber.bg,

  violetBg: isDark ? "rgba(124,58,237,0.25)" : "#F5F3FF",
  violetText: isDark ? "#C4B5FD" : "#7C3AED",
  violetBorder: isDark ? "rgba(221,214,254,0.35)" : "#DDD6FE",

  tealBg: isDark ? "rgba(15,118,110,0.25)" : "#F0FDFA",
  tealText: isDark ? "#5EEAD4" : "#0F766E",
  tealBorder: isDark ? "rgba(153,246,228,0.35)" : "#99F6E4",

  blueBg: isDark ? "rgba(3,105,161,0.25)" : c.blue.bg,
  blueText: isDark ? "#7DD3FC" : c.blue.text,
  blueBorder: isDark ? "rgba(186,230,253,0.35)" : c.blue.bg,

  greenBg: isDark ? "rgba(21,128,61,0.25)" : c.green.bg,
  greenText: isDark ? "#86EFAC" : c.green.text,
  greenBorder: isDark ? "rgba(134,239,172,0.35)" : c.green.bg,

  arrowIcon: isDark ? "#475569" : c.slate.border,
  calloutBg: isDark ? "#1B2330" : c.slate.hoverBg,
  calloutBorder: isDark ? "#2D3748" : c.slate.border,
  calloutAccent: c.blue.text,
  footerNote: isDark ? "#64748B" : c.gray.textSecondary,
});

// Build CSS styles string using theme colors
const getAnnouncementStyles = (colors) => `
  .ann-scroll {
    max-height: 60vh;
    overflow-y: auto;
    padding-right: 6px;
  }
  .ann-scroll::-webkit-scrollbar {
    width: 6px;
  }
  .ann-scroll::-webkit-scrollbar-thumb {
    background: ${colors.scrollThumb};
    border-radius: 999px;
  }
  .ann-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  .ann-body h3 {
    font-size: 0.85rem;
    font-weight: 700;
    color: ${colors.headingText};
    margin: 14px 0 6px;
  }
  .ann-body p {
    font-size: 0.8rem;
    color: ${colors.bodyText};
    line-height: 1.6;
    margin: 0 0 8px;
  }
  .ann-body .status-flow {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0 14px;
  }
  .ann-body .chip {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .ann-body .chip-amber {
    background: ${colors.amberBg};
    color: ${colors.amberText};
    border: 1px solid ${colors.amberBorder};
  }
  .ann-body .chip-violet {
    background: ${colors.violetBg};
    color: ${colors.violetText};
    border: 1px solid ${colors.violetBorder};
  }
  .ann-body .chip-teal {
    background: ${colors.tealBg};
    color: ${colors.tealText};
    border: 1px solid ${colors.tealBorder};
  }
  .ann-body .chip-blue {
    background: ${colors.blueBg};
    color: ${colors.blueText};
    border: 1px solid ${colors.blueBorder};
  }
  .ann-body .chip-green {
    background: ${colors.greenBg};
    color: ${colors.greenText};
    border: 1px solid ${colors.greenBorder};
  }
  .ann-body .arrow {
    font-size: 0.7rem;
    color: ${colors.arrowIcon};
  }
  .ann-body .callout {
    background: ${colors.calloutBg};
    border: 1px solid ${colors.calloutBorder};
    border-left: 3px solid ${colors.calloutAccent};
    border-radius: 6px;
    padding: 10px 12px;
    margin: 6px 0 14px;
  }
  .ann-body .callout p { margin: 0; }
  .ann-body .footer-note {
    font-size: 0.72rem;
    color: ${colors.footerNote};
    margin-top: 4px;
  }
`;

function AnnouncementStructure() {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // Theme resolution — memoized
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base, isDark), [base, isDark]);
  const styles = useMemo(() => getAnnouncementStyles(colors), [colors]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_FLAG)) return;
    if (!announcementHtml?.trim()) return;
    setOpen(true);
  }, []);

  const handleClose = () => {
    sessionStorage.setItem(SESSION_FLAG, "1");
    setOpen(false);
  };

  if (!announcementHtml?.trim()) return null;

  // Extract <h2> as dialog title; strip from body
  const titleMatch = announcementHtml.match(/<h2>(.*?)<\/h2>/i);
  const title = titleMatch
    ? titleMatch[1].replace(/&amp;/g, "&")
    : "Announcement";
  const bodyHtml = announcementHtml.replace(/<h2>.*?<\/h2>/i, "").trim();

  return (
    <AlertStructure
      open={open}
      onClose={handleClose}
      title={title}
      headerTitle="Announcement"
      type="info"
      maxWidth={660}
      message={
        <>
          <style>{styles}</style>
          <div className="ann-scroll">
            <div
              className="ann-body"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>
        </>
      }
      confirmText="Got it"
      onConfirm={handleClose}
    />
  );
}

export default AnnouncementStructure;