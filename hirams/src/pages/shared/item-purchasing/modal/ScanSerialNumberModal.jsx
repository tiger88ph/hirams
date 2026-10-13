import React, { useEffect, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  CheckCircleOutlined,
  CloseOutlined,
  PhotoCameraOutlined,
  PlayArrowOutlined,
  VideocamOffOutlined,
} from "@mui/icons-material";
import { BrowserMultiFormatReader } from "@zxing/browser";
import ModalContainer from "../../../../components/layouts/modal/ModalContainer";
import getThemeColors from "../../../../utils/style/getThemeColors";

// ── Inline color map — ONLY the tokens this modal uses ──────────────────
// (a plain factory, not a hook — it just maps theme tokens)
const getColors = (c) => ({
  cardBg: c.slate.outerBg,
  cardBorder: c.slate.border,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textMuted: c.gray.textMuted,
  textFaint: c.gray.textDisabled,
  greenText: c.green.text,
  blueText: c.blue.text,
  errorText: c.red.text,
  errorBg: c.red.bg,
  // camera viewfinder overlay — mode-independent (see getThemeColors)
  scanner: c.scanner,
});

/**
 * Camera scanner for one purchase line's serial numbers.
 *
 * Every scanned code is checked against the line before it is kept:
 *   • no duplicates,
 *   • never more than `max` (the qty being received / delivered) — the same
 *     rule the Serial Numbers field enforces when typing,
 *   • only serials actually received and not yet delivered when the item
 *     has recorded ones (`allowedValues`); an empty list means the item is
 *     not serialized, so any code is accepted,
 *   • never a serial the line already holds on record (`denyValues`) — used
 *     when receiving, so the same unit cannot be checked in twice.
 *
 * The accepted list is handed straight back to the row's form through
 * `onChange`, so the field behind the modal stays in sync.
 */
export default function ScanSerialNumberModal({
  open,
  onClose,
  serials = [],
  max = 0,
  allowedValues = [],
  denyValues = [],
  onChange,
  subTitle = "",
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = React.useMemo(() => getThemeColors(isDark), [isDark]);
  const c = React.useMemo(() => getColors(base), [base]);

  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  // The decode callback is registered once, but `serials` / `max` change on
  // every scan — read the newest handler instead of a captured one.
  const acceptRef = useRef(null);
  // The same label stays in frame for a second or two and would be read over
  // and over; only a repeat of the *same* code is held off. A different code
  // is accepted straight away, so several items can be scanned quickly.
  const lastRef = useRef({ text: "", at: 0 });

  // Fresh state every time the modal is opened.
  useEffect(() => {
    if (!open) return;
    setError("");
    setCameraOn(true);
    lastRef.current = { text: "", at: 0 };
  }, [open]);

  // ── Scan handling ───────────────────────────────────────────────────────
  const accept = (raw) => {
    const text = String(raw ?? "").trim();
    if (!text) return;
    if (serials.includes(text)) {
      setError(`"${text}" is already in the list.`);
      return;
    }
    if (max > 0 && serials.length >= max) {
      setError(`Quantity limit reached — ${max} serial number(s) on this line.`);
      return;
    }
    if (denyValues.includes(text)) {
      setError(`"${text}" is already recorded for this item.`);
      return;
    }
    if (allowedValues.length > 0 && !allowedValues.includes(text)) {
      setError("This S/N was not part of the received items.");
      return;
    }
    setError("");
    onChange?.([...serials, text]);
  };

  useEffect(() => {
    acceptRef.current = accept;
  });

  const removeAt = (i) => {
    setError("");
    onChange?.(serials.filter((_, idx) => idx !== i));
  };

  // ── Camera ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open || !cameraOn) return;
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;
    codeReader
      .decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoRef.current,
        (result) => {
          if (!result) return;
          const text = String(result.getText() ?? "").trim();
          if (!text) return;
          const now = Date.now();
          if (lastRef.current.text === text && now - lastRef.current.at < 1200)
            return;
          lastRef.current = { text, at: now };
          acceptRef.current?.(text);
        },
      )
      .catch(() => {
        setError(
          "Could not access the camera. Check permissions and try again.",
        );
        setCameraOn(false);
      });
    return () => {
      try {
        codeReader.reset();
      } catch {
        /* stream already gone */
      }
      if (codeReaderRef.current === codeReader) codeReaderRef.current = null;
    };
  }, [open, cameraOn]);

  const stopCamera = () => {
    try {
      codeReaderRef.current?.reset();
    } catch {
      /* nothing to release */
    }
    codeReaderRef.current = null;
    setCameraOn(false);
  };

  const subtitle =
    subTitle || `Scanned ${serials.length} of ${max}`;

  return (
    <ModalContainer
      open={open}
      handleClose={onClose}
      title="Scan Serial Numbers"
      subTitle={subtitle}
      showSave={false}
      cancelLabel="Done"
      disableBackdropClick
      contentPadding={{ xs: 1.5, sm: 2 }}
    >
      {/* Camera preview + scan frame */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/3",
          background: c.scanner.letterbox,
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          muted
          playsInline
        />
        <Box
          sx={{
            position: "absolute",
            inset: "15% 10%",
            border: `2px solid ${c.scanner.frameRing}`,
            borderRadius: "10px",
            pointerEvents: "none",
          }}
        />
        {!cameraOn && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              background: c.scanner.scrim,
              color: c.scanner.text,
            }}
          >
            <PhotoCameraOutlined sx={{ fontSize: "1.6rem" }} />
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 600 }}>
              Camera is off
            </Typography>
            <Box
              component="button"
              type="button"
              onClick={() => setCameraOn(true)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.6,
                px: 1.5,
                py: 0.6,
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: c.scanner.text,
                background: c.scanner.btnBg,
                border: `1px solid ${c.scanner.btnBorder}`,
                borderRadius: "7px",
                cursor: "pointer",
                "&:hover": { background: c.scanner.btnBgHover },
              }}
            >
              <PlayArrowOutlined sx={{ fontSize: "0.9rem" }} />
              Start Camera
            </Box>
          </Box>
        )}
      </Box>

      {/* Camera toggle + counter */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mt: 1.25,
        }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => (cameraOn ? stopCamera() : setCameraOn(true))}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.6,
            px: 1.25,
            py: 0.6,
            fontSize: "0.62rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: c.textSecondary,
            background: c.cardBg,
            border: `0.5px solid ${c.cardBorder}`,
            borderRadius: "7px",
            cursor: "pointer",
            transition: "color 0.15s, background 0.15s",
            "&:hover": { color: c.blueText },
          }}
        >
          {cameraOn ? (
            <VideocamOffOutlined sx={{ fontSize: "0.9rem" }} />
          ) : (
            <PlayArrowOutlined sx={{ fontSize: "0.9rem" }} />
          )}
          {cameraOn ? "Stop Camera" : "Start Camera"}
        </Box>

        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 700,
            color: serials.length >= max ? c.greenText : c.blueText,
          }}
        >
          {serials.length} / {max} scanned
        </Typography>
      </Box>

      <Typography
        sx={{
          fontSize: "0.65rem",
          color: c.textMuted,
          mt: 0.75,
          lineHeight: 1.4,
        }}
      >
        Up to {max} serial number(s) may be scanned for this line
        {allowedValues.length > 0
          ? ` — only the ${allowedValues.length} received and not yet delivered.`
          : denyValues.length > 0
            ? ` — the ${denyValues.length} already received serial number(s) are blocked.`
            : "."}
      </Typography>

      {error && (
        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 600,
            color: c.errorText,
            mt: 1.25,
            p: 1,
            background: c.errorBg,
            borderRadius: "6px",
          }}
        >
          {error}
        </Typography>
      )}

      {/* Scanned list */}
      <Box sx={{ mt: 1.5 }}>
        <Typography
          sx={{
            fontSize: "0.58rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: c.textFaint,
          }}
        >
          Scanned Serial Numbers
        </Typography>

        {serials.length === 0 ? (
          <Typography
            sx={{ fontSize: "0.72rem", color: c.textMuted, mt: 0.75 }}
          >
            Nothing scanned yet — point the camera at the S/N label.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              mt: 0.75,
              maxHeight: 160,
              overflowY: "auto",
            }}
          >
            {serials.map((sn, i) => (
              <Box
                key={`${sn}-${i}`}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1,
                  py: 0.5,
                  background: c.cardBg,
                  border: `0.5px solid ${c.cardBorder}`,
                  borderRadius: "6px",
                }}
              >
                <CheckCircleOutlined
                  sx={{ fontSize: "0.85rem", color: c.greenText, flexShrink: 0 }}
                />
                <Typography
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: c.textPrimary,
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sn}
                </Typography>
                <Box
                  component="button"
                  type="button"
                  onClick={() => removeAt(i)}
                  title="Remove this serial number"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    border: "none",
                    borderRadius: "50%",
                    background: "transparent",
                    color: c.textMuted,
                    cursor: "pointer",
                    "&:hover": { background: c.errorBg, color: c.errorText },
                  }}
                >
                  <CloseOutlined sx={{ fontSize: "0.75rem" }} />
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </ModalContainer>
  );
}
