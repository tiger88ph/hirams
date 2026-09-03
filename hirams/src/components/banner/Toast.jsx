import React, { useEffect, useState, forwardRef, memo } from "react";
import { Alert, Fade, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import getThemeColors from "../../utils/style/getThemeColors";

// ── Component-specific color map: ONLY tokens this component uses ──
const useColors = (c) => ({
  error: { bg: c.red.bg, text: c.red.text },
  success: { bg: c.green.bg, text: c.green.text },
  warning: { bg: c.amber.bg, text: c.amber.warnText },
  info: { bg: c.blue.bg, text: c.blue.text },
});

const Toast = forwardRef(function Toast(
  { open, message, severity = "error", duration = 5000, onClose, sx = {} },
  ref,
) {
  // ✅ Standard wiring — exact pattern from your docs
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = React.useMemo(() => useColors(base), [base]);

  const [visible, setVisible] = useState(open);

  // Sync visibility
  useEffect(() => {
    setVisible(open);
    if (!open) return;

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, duration]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  // Map severity → palette token
  const token = colors[severity] || colors.error;
  const bgColor = token.bg;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 50,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1300,
        width: "100%",
        maxWidth: 600,
        ...sx,
      }}
    >
      <Fade in={visible} timeout={100}>
        <Alert
          ref={ref}
          severity={severity}
          onClose={handleClose}
          variant="filled"
          sx={{
            width: "100%",
            backgroundColor: bgColor,
            color: token.text,
          }}
        >
          {message}
        </Alert>
      </Fade>
    </Box>
  );
});

export default memo(Toast);
