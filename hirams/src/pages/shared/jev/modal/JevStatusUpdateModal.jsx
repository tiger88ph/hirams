import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ModalContainer from "../../../../components/layouts/modal/ModalContainer.jsx";
import getThemeColors from "../../../../utils/style/getThemeColors.js";
import JevAPI from "../../../../api/endpoints/jev.api.js";
import { withSpinner, showSwal } from "../../../../utils/helpers/swal.jsx";

const useColors = (c) => ({
  border: c.slate.border,
  hoverBg: c.slate.hover,
  green: { bg: c.green.bg, border: c.green.border, text: c.green.text },
  amber: { bg: c.amber.bg, border: c.amber.border, text: c.amber.text },
  red: { bg: c.red.bg, border: c.red.border, text: c.red.text },
  blue: { bg: c.blue.bg, border: c.blue.border, text: c.blue.text },
  text: { pri: c.gray.textPrimary, sec: c.gray.textSecondary },
});

// A / C / P are the jev_status codes (config/mappings.php). A code the
// mapping never names falls through to the neutral blue tone.
const toneFor = (code, colors) =>
  code === "A"
    ? colors.green
    : code === "C"
      ? colors.red
      : code === "P"
        ? colors.amber
        : colors.blue;

const pillStyle = (tone) => ({
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 8px",
  fontSize: "10px",
  fontWeight: 500,
  borderRadius: "9999px",
  backgroundColor: tone.bg,
  color: tone.text,
  border: `1px solid ${tone.border}`,
});

/**
 * Status switcher of the JEV listing — ModalContainer plus a radio group of
 * every status in the jev_status mapping, with the row's own status disabled
 * so a JEV can only ever move somewhere new.
 *
 * Writes through PUT /jev/{id} with a DIRECT cStatus ('A' / 'P' / 'C'), not
 * the endpoint's 'toggle' branch — a toggle can only round-trip P <-> A and
 * could never reach Cancelled.
 */
export default function JevStatusUpdateModal({
  open,
  jev,
  jevStatus = {},
  onClose,
  onSuccess,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useColors(base);

  const [picked, setPicked] = useState("");
  const [saving, setSaving] = useState(false);

  const current = jev?.cStatus ?? "";
  const entity = jev?.strJEVNumber || "JEV";
  const options = useMemo(() => Object.entries(jevStatus ?? {}), [jevStatus]);

  // Fresh dialog on every open — a pick left over from the previous row must
  // never preselect itself against the next one.
  useEffect(() => {
    if (open) {
      setPicked("");
      setSaving(false);
    }
  }, [open, jev?.nJEVId]);

  const handleClose = () => {
    setPicked("");
    setSaving(false);
    onClose?.();
  };

  const handleSave = async () => {
    if (!jev?.nJEVId || !picked || picked === current || saving) return;
    // Read up front: handleClose() clears the target on the next render, so
    // everything the request and its toasts need is captured first.
    const targetId = jev.nJEVId,
      next = picked,
      label = jevStatus?.[next] ?? next;

    // withSpinner already owns the progress UI, so the dialog leaves
    // immediately instead of holding the stage on its own loading state.
    handleClose();
    setSaving(true);
    try {
      await withSpinner(entity, async () => {
        await JevAPI.update(targetId, { cStatus: next });
      });
      // The server's JevUpdated broadcast is toOthers() — this tab has to
      // tell ITSELF the row changed, same as handleJevAESaved does.
      window.dispatchEvent(new CustomEvent("jev_data_updated"));
      await showSwal("SUCCESS", {}, { entity, action: `set to ${label}` });
      onSuccess?.(next);
    } catch (err) {
      console.error(err);
      await showSwal("ERROR", {}, { entity });
    } finally {
      setSaving(false);
    }
  };

  const currentLabel = current ? (jevStatus?.[current] ?? current) : "—";
  const canSave = !!picked && picked !== current && !saving;

  return (
    <ModalContainer
      open={open}
      handleClose={handleClose}
      title="Update JEV Status"
      subTitle={jev?.strJEVNumber?.trim() || ""}
      onSave={handleSave}
      saveLabel="Save Status"
      // No `loading` on purpose: ModalContainer would swap its body for a
      // DotSpinner, but withSpinner already runs that at page level — the
      // dialog closes on save instead (see handleSave).
      disabled={!canSave}
      width={{ xs: "90%", sm: 440 }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography sx={{ fontSize: "0.72rem", color: colors.text.sec }}>
            Current status
          </Typography>
          <span style={pillStyle(toneFor(current, colors))}>{currentLabel}</span>
        </Box>

        <Divider />

        <Typography sx={{ fontSize: "0.72rem", color: colors.text.sec }}>
          Set to
        </Typography>

        <RadioGroup
          name="jev-status"
          value={picked}
          onChange={(e) => setPicked(e.target.value)}
        >
          {options.map(([code, label]) => {
            const tone = toneFor(code, colors);
            const isCurrent = code === current;
            const selected = picked === code;

            return (
              <FormControlLabel
                key={code}
                value={code}
                disabled={isCurrent}
                sx={{
                  m: 0,
                  mb: 0.75,
                  py: 0.75,
                  px: 1.25,
                  borderRadius: 2,
                  border: `1px solid ${selected ? tone.border : colors.border}`,
                  background: selected ? tone.bg : "transparent",
                  opacity: isCurrent ? 0.55 : 1,
                  cursor: isCurrent ? "default" : "pointer",
                  transition: "all 0.15s",
                  "&:hover": isCurrent
                    ? {}
                    : { background: selected ? tone.bg : colors.hoverBg },
                  "&.Mui-disabled": { background: "transparent" },
                }}
                control={
                  <Radio
                    size="small"
                    sx={{
                      p: 0.5,
                      color: tone.border,
                      "&.Mui-checked": { color: tone.text },
                    }}
                  />
                }
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      width: "100%",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: tone.text,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: selected ? 700 : 500,
                        color: colors.text.pri,
                      }}
                    >
                      {label}
                    </Typography>
                    {isCurrent && (
                      <Typography
                        sx={{
                          ml: "auto",
                          fontSize: "0.62rem",
                          fontWeight: 700,
                          letterSpacing: "0.4px",
                          textTransform: "uppercase",
                          color: colors.text.sec,
                        }}
                      >
                        Current
                      </Typography>
                    )}
                  </Box>
                }
              />
            );
          })}
        </RadioGroup>
      </Box>
    </ModalContainer>
  );
}
