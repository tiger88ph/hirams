import React, { useState, useEffect, useMemo } from "react";
import { Box, Typography, Dialog, Button, keyframes } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { FileDownload, CheckCircleOutline, Close } from "@mui/icons-material";
import getThemeColors from "../../utils/style/getThemeColors";

/* ═══════════════════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════════════════ */
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40%           { transform: scale(1); opacity: 1; }
`;

const fadeSlideIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
  0%   { background-position: -300% center; }
  100% { background-position: 300% center; }
`;

const pulsate = keyframes`
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%       { opacity: 0.7; transform: scale(0.94); }
`;

const checkPop = keyframes`
  0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
  65%  { transform: scale(1.18) rotate(4deg);  opacity: 1; }
  100% { transform: scale(1)    rotate(0deg);  opacity: 1; }
`;

const floatUp = keyframes`
  0%   { transform: translateY(0);     opacity: 0.55; }
  100% { transform: translateY(-40px); opacity: 0; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
`;

const progressFill = (pct) => keyframes`
  from { width: 0%; }
  to   { width: ${pct}%; }
`;

/* ═══════════════════════════════════════════════════════
   STEPS CONFIG
═══════════════════════════════════════════════════════ */
const STEPS = [
  { label: "Gathering transaction data", duration: 800 },
  { label: "Computing cost breakdown", duration: 700 },
  { label: "Building Excel rows", duration: 600 },
  { label: "Formatting workbook", duration: 500 },
  { label: "Finalising export", duration: 400 },
];
const TOTAL_DURATION = STEPS.reduce((s, st) => s + st.duration, 0);

const Particle = ({ delay, left, color }) => (
  <Box
    sx={{
      position: "absolute",
      bottom: "30%",
      left: `${left}%`,
      width: 6,
      height: 6,
      borderRadius: "50%",
      backgroundColor: color,
      opacity: 0,
      animation: `${floatUp} 1.8s ${delay}s ease-out infinite`,
      pointerEvents: "none",
    }}
  />
);

// ── Component-local color map — ONLY tokens this file uses ──
const useColors = (c) => ({
  // Primary/blue
  blueText: c.blue.text,
  blueTextStrong: c.blue.textStrong,
  blueBg: c.blue.bg,
  blueHover: c.blue.hover,
  // Success/green
  greenText: c.green.text,
  // Neutral text
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  // Border
  border: c.slate.border,
  // Danger/red
  redText: c.red.text,
  redBorder: c.red.border,
  redBg: c.red.bg,
  // Dialog backgrounds
  dialogBg: {
    dark: "rgba(22,26,36,0.97)",
    light: "rgba(245, 248, 255, 0.97)",
  },
  backdropBg: {
    dark: "rgba(0,0,0,0.6)",
    light: "rgba(10, 25, 60, 0.35)",
  },
  cardGradient: {
    dark: "linear-gradient(135deg, #1b2838 0%, #14304a 100%)",
    light: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
  },
  shadow: {
    dark: "0 24px 60px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.35)",
    light: "0 24px 60px rgba(25,118,210,0.18), 0 4px 16px rgba(0,0,0,0.08)",
  },
  cardShadow: {
    dark: "0 4px 16px rgba(25,118,210,0.35)",
    light: "0 4px 16px rgba(25,118,210,0.2)",
  },
  stepGlow: {
    dark: "0 0 8px rgba(147,197,253,0.45)",
    light: "0 0 8px rgba(25,118,210,0.45)",
  },
});

/* ═══════════════════════════════════════════════════════
   EXPORT DIALOG SPINNER
═══════════════════════════════════════════════════════ */
const ExportSpinnerContent = ({
  open = false,
  done = false,
  fileName = "",
  onCancel,
}) => {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  // Primary blue aliases
  const accent = colors.blueText;
  const accentLight = colors.blueBg;
  const accentDark = colors.blueTextStrong;

  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [showDone, setShowDone] = useState(false);

  /* Reset internal state every time the dialog opens */
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setProgress(0);
      setProgressKey(0);
      setShowDone(false);
    }
  }, [open]);

  /* Advance fake steps while API is pending */
  useEffect(() => {
    if (!open || done) return;
    let elapsed = 0;
    let accumulated = 0;
    const timers = STEPS.map((step, i) => {
      const t = setTimeout(() => {
        setStepIndex(i);
        accumulated += step.duration;
        const pct = Math.min(
          Math.round((accumulated / TOTAL_DURATION) * 88),
          88,
        );
        setProgress(pct);
        setProgressKey((k) => k + 1);
      }, elapsed);
      elapsed += step.duration;
      return t;
    });
    return () => timers.forEach(clearTimeout);
  }, [open, done]);

  /* When API resolves → snap to 100 % → show checkmark */
  useEffect(() => {
    if (!done) return;
    setProgress(100);
    setProgressKey((k) => k + 1);
    const t = setTimeout(() => setShowDone(true), 380);
    return () => clearTimeout(t);
  }, [done]);

  const currentStep = STEPS[Math.min(stepIndex, STEPS.length - 1)];
  const dialogBg = isDark ? colors.dialogBg.dark : colors.dialogBg.light;
  const backdropBg = isDark ? colors.backdropBg.dark : colors.backdropBg.light;
  const cardGradient = isDark
    ? colors.cardGradient.dark
    : colors.cardGradient.light;
  const shadow = isDark ? colors.shadow.dark : colors.shadow.light;
  const cardShadow = isDark ? colors.cardShadow.dark : colors.cardShadow.light;
  const stepGlow = isDark ? colors.stepGlow.dark : colors.stepGlow.light;

  return (
    <Dialog
      open={open}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          background: dialogBg,
          backdropFilter: "blur(10px)",
          boxShadow: shadow,
          width: 360,
          minHeight: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: backdropBg,
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      {/* Floating particles behind the card */}
      {!showDone &&
        [8, 20, 33, 47, 60, 74, 88].map((left, i) => (
          <Particle
            key={left}
            left={left}
            delay={i * 0.22}
            color={i % 2 === 0 ? accent : accentLight}
          />
        ))}

      {/* Card content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2.5,
          px: 4,
          py: 4,
          width: "100%",
          animation: `${fadeSlideIn} 0.3s ease`,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ── Icon ── */}
        {showDone ? (
          <Box
            sx={{
              animation: `${checkPop} 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards`,
            }}
          >
            <CheckCircleOutline
              sx={{ fontSize: 58, color: colors.greenText }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              position: "relative",
              width: 64,
              height: 64,
              borderRadius: "18px",
              background: cardGradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${pulsate} 2s ease-in-out infinite`,
              boxShadow: cardShadow,
            }}
          >
            {/* Spinning ring */}
            <Box
              sx={{
                position: "absolute",
                inset: -4,
                borderRadius: "22px",
                border: "3px solid transparent",
                borderTopColor: accent,
                borderRightColor: accentLight,
                animation: `${spin} 1.2s linear infinite`,
              }}
            />
            <FileDownload sx={{ fontSize: 32, color: accent }} />
          </Box>
        )}

        {/* ── Title ── */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 700,
              color: showDone ? colors.greenText : colors.textPrimary,
              letterSpacing: "0.15px",
              transition: "color 0.35s",
            }}
          >
            {showDone
              ? "Export Complete!"
              : `Exporting ${fileName || "Breakdown"}`}
          </Typography>
          {!showDone && (
            <Typography
              sx={{
                fontSize: "0.74rem",
                color: colors.textSecondary,
                mt: 0.4,
                fontWeight: 400,
              }}
            >
              Generating your Excel file, please wait…
            </Typography>
          )}
        </Box>

        {/* ── Progress Bar ── */}
        {!showDone && (
          <Box sx={{ width: "100%" }}>
            {/* Track */}
            <Box
              sx={{
                width: "100%",
                height: 8,
                borderRadius: 99,
                backgroundColor: colors.blueBg,
                overflow: "hidden",
              }}
            >
              {/* Fill */}
              <Box
                key={progressKey}
                sx={{
                  height: "100%",
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${accentDark} 0%, ${accent} 40%, ${accentLight} 70%, ${accent} 100%)`,
                  backgroundSize: "300% 100%",
                  animation: `${progressFill(progress)} 0.55s ease forwards, ${shimmer} 2s linear infinite`,
                }}
              />
            </Box>

            {/* Step label + percent */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 1,
              }}
            >
              <Typography
                key={stepIndex}
                sx={{
                  fontSize: "0.7rem",
                  color: colors.textSecondary,
                  fontWeight: 500,
                  maxWidth: "76%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  animation: `${fadeSlideIn} 0.28s ease`,
                }}
              >
                {currentStep.label}
              </Typography>
              <Typography
                sx={{ fontSize: "0.76rem", fontWeight: 700, color: accent }}
              >
                {progress}%
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── Step Dots ── */}
        {!showDone && (
          <Box sx={{ display: "flex", gap: 0.8, alignItems: "center" }}>
            {STEPS.map((_, i) => (
              <Box
                key={i}
                sx={{
                  width: i === stepIndex ? 22 : 8,
                  height: 8,
                  borderRadius: 99,
                  backgroundColor: i <= stepIndex ? accent : colors.blueBg,
                  transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow: i === stepIndex ? stepGlow : "none",
                }}
              />
            ))}
          </Box>
        )}

        {/* ── Cancel Button ── */}
        {!showDone && onCancel && (
          <Button
            onClick={onCancel}
            size="small"
            startIcon={<Close sx={{ fontSize: "0.9rem !important" }} />}
            sx={{
              mt: 0.5,
              fontSize: "0.72rem",
              fontWeight: 600,
              color: colors.textSecondary,
              textTransform: "none",
              borderRadius: "99px",
              px: 2,
              py: 0.6,
              border: `1.5px solid ${colors.border}`,
              backgroundColor: "transparent",
              letterSpacing: "0.2px",
              transition: "all 0.2s ease",
              "&:hover": {
                color: colors.redText,
                borderColor: colors.redBorder,
                backgroundColor: colors.redBg,
              },
            }}
          >
            Cancel
          </Button>
        )}

        {/* ── Done Message ── */}
        {showDone && (
          <Typography
            sx={{
              fontSize: "0.78rem",
              color: colors.textSecondary,
              textAlign: "center",
              animation: `${fadeSlideIn} 0.35s ease`,
            }}
          >
            Your file is downloading now.
          </Typography>
        )}
      </Box>
    </Dialog>
  );
};

export default ExportSpinnerContent;
