import React, { useState, useEffect } from "react";
import { Box, Typography, Dialog, Button, keyframes } from "@mui/material";
import { FileDownload, CheckCircleOutline, Close } from "@mui/icons-material";
import DotSpinner from "./DotSpinner";
/* ═══════════════════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════════════════ */
const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40%            { transform: scale(1); opacity: 1; }
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
  { label: "Computing cost breakdown",   duration: 700 },
  { label: "Building Excel rows",        duration: 600 },
  { label: "Formatting workbook",        duration: 500 },
  { label: "Finalising export",          duration: 400 },
];
const TOTAL_DURATION = STEPS.reduce((s, st) => s + st.duration, 0);

const Particle = ({ delay, left, color = "#1976d2" }) => (
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

/* ═══════════════════════════════════════════════════════
   EXPORT DIALOG SPINNER
   Props:
     open     — boolean  : controls Dialog visibility
     done     — boolean  : flip to true when the API call resolves
     onCancel — function : called when the user clicks Cancel
═══════════════════════════════════════════════════════ */
const ExportDialogSpinner = ({ open = false, done = false, fileName = "", onCancel }) => {
  const [stepIndex,   setStepIndex]   = useState(0);
  const [progress,    setProgress]    = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [showDone,    setShowDone]    = useState(false);

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
        const pct = Math.min(Math.round((accumulated / TOTAL_DURATION) * 88), 88);
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

  return (
    <Dialog
      open={open}
      maxWidth={false}
      PaperProps={{
        sx: {
          borderRadius: "20px",
          overflow: "hidden",
          background: "rgba(245, 248, 255, 0.97)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 24px 60px rgba(25,118,210,0.18), 0 4px 16px rgba(0,0,0,0.08)",
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
            backgroundColor: "rgba(10, 25, 60, 0.35)",
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
            color={i % 2 === 0 ? "#1976d2" : "#42a5f5"}
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
          <Box sx={{ animation: `${checkPop} 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards` }}>
            <CheckCircleOutline sx={{ fontSize: 58, color: "#2e7d32" }} />
          </Box>
        ) : (
          <Box
            sx={{
              position: "relative",
              width: 64,
              height: 64,
              borderRadius: "18px",
              background: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: `${pulsate} 2s ease-in-out infinite`,
              boxShadow: "0 4px 16px rgba(25,118,210,0.2)",
            }}
          >
            {/* Spinning ring */}
            <Box
              sx={{
                position: "absolute",
                inset: -4,
                borderRadius: "22px",
                border: "3px solid transparent",
                borderTopColor: "#1976d2",
                borderRightColor: "#42a5f5",
                animation: `${spin} 1.2s linear infinite`,
              }}
            />
            <FileDownload sx={{ fontSize: 32, color: "#1976d2" }} />
          </Box>
        )}

        {/* ── Title ── */}
        <Box sx={{ textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 700,
              color: showDone ? "#2e7d32" : "#1a237e",
              letterSpacing: "0.15px",
              transition: "color 0.35s",
            }}
          >
            {showDone ? "Export Complete!" : `Exporting ${fileName || "Breakdown"}`}
          </Typography>
          {!showDone && (
            <Typography sx={{ fontSize: "0.74rem", color: "#90a4ae", mt: 0.4, fontWeight: 400 }}>
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
                backgroundColor: "#e3f2fd",
                overflow: "hidden",
              }}
            >
              {/* Fill */}
              <Box
                key={progressKey}
                sx={{
                  height: "100%",
                  borderRadius: 99,
                  background:
                    "linear-gradient(90deg, #1565c0 0%, #1976d2 40%, #42a5f5 70%, #1976d2 100%)",
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
                  color: "#78909c",
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
              <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: "#1976d2" }}>
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
                  backgroundColor: i <= stepIndex ? "#1976d2" : "#e3f2fd",
                  transition: "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
                  boxShadow: i === stepIndex ? "0 0 8px rgba(25,118,210,0.55)" : "none",
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
              color: "#90a4ae",
              textTransform: "none",
              borderRadius: "99px",
              px: 2,
              py: 0.6,
              border: "1.5px solid #e0e7ef",
              backgroundColor: "transparent",
              letterSpacing: "0.2px",
              transition: "all 0.2s ease",
              "&:hover": {
                color: "#e53935",
                borderColor: "#ef9a9a",
                backgroundColor: "rgba(229,57,53,0.05)",
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
              color: "#607d8b",
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

export default ExportDialogSpinner;