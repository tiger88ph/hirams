import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Box, Fade, InputBase, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import getThemeColors from "../../../utils/style/getThemeColors";

const useColors = (c) => ({
  border: c.slate.border,
  textPrimary: c.gray.textPrimary,
  textSecondary: c.gray.textSecondary,
  textDisabled: c.gray.textDisabled,
  blueText: c.blue.text,
  blueBgSoft: c.blue.bgSoft,
  chipBg: c.slate.mutedBg,
  hoverBg: c.slate.hover,
  modalBg: c.slate.outerBgSolid,
  headerFooterBg: c.slate.itemHeaderBgSolid,
  backdrop: c.slate.backdrop,
});

const toOption = (opt, idx) =>
  typeof opt === "object" && opt !== null
    ? {
        value: String(opt.value ?? opt.label ?? idx),
        label: String(opt.label ?? opt.value ?? ""),
      }
    : { value: String(opt), label: String(opt) };

const Kbd = ({ children, colors }) => (
  <Box
    component="kbd"
    sx={{
      fontFamily: "inherit",
      fontSize: "11px",
      fontWeight: 600,
      color: colors.textSecondary,
      bgcolor: colors.chipBg,
      border: `1px solid ${colors.border}`,
      borderRadius: "5px",
      px: 0.75,
      lineHeight: "18px",
    }}
  >
    {children}
  </Box>
);

const LookUpModal = ({
  open = false,
  query = "",
  onChange,
  handleClose,
  searchByOptions = [],
  searchBy,
  onSearchByChange,
  children,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const inputRef = useRef(null);

  const searchByList = useMemo(
    () =>
      (searchByOptions.length ? searchByOptions : ["Default"]).map(toOption),
    [searchByOptions],
  );

  const [internalSearchBy, setInternalSearchBy] = useState(
    () => searchByList[0]?.value ?? "Default",
  );
  const activeSearchBy = searchBy ?? internalSearchBy;

  const handleSelectSearchBy = (value) => {
    setInternalSearchBy(value);
    onSearchByChange?.(value);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const len = el.value?.length ?? 0;
      el.setSelectionRange?.(len, len);
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      closeAfterTransition
      disableEnforceFocus
      disableAutoFocus
      aria-label="Look up"
      slotProps={{
        backdrop: { sx: { backgroundColor: colors.backdrop } },
      }}
    >
      <Fade in={open} timeout={150}>
        <Box
          sx={{
            position: "absolute",
            top: "12vh",
            left: "50%",
            transform: "translateX(-50%)",
            width: { xs: "94%", sm: 640, md: 760 },
            maxWidth: "95%",
            height: { xs: "70vh", sm: 560 },
            maxHeight: "76vh",
            bgcolor: colors.modalBg,
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            boxShadow: 24,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            outline: "none",
          }}
        >
          {/* HEADER: search input + search-by segmented chips */}
          <Box
            sx={{
              bgcolor: colors.headerFooterBg,
              borderBottom: `1px solid ${colors.border}`,
              px: 2,
              pt: 1.5,
              pb: 1.25,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <SearchIcon sx={{ fontSize: 20, color: colors.textDisabled }} />
              <InputBase
                inputRef={inputRef}
                value={query}
                onChange={(e) => onChange?.(e.target.value)}
                placeholder="Search transactions…"
                inputProps={{ "aria-label": "Search" }}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  fontSize: "15px",
                  fontWeight: 500,
                  color: colors.textPrimary,
                  "& input": { padding: 0 },
                  "& input::placeholder": {
                    color: colors.textDisabled,
                    opacity: 1,
                  },
                }}
              />
              <Kbd colors={colors}>Esc</Kbd>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                mt: 1.25,
              }}
            >
              <Typography
                sx={{ fontSize: "11px", color: colors.textDisabled, mr: 0.25 }}
              >
                Search by
              </Typography>
              {searchByList.map((opt) => {
                const active = opt.value === activeSearchBy;
                return (
                  <Box
                    key={opt.value}
                    onClick={() => handleSelectSearchBy(opt.value)}
                    sx={{
                      fontSize: "12px",
                      fontWeight: 600,
                      px: 1.25,
                      py: 0.25,
                      borderRadius: "9999px",
                      cursor: "pointer",
                      userSelect: "none",
                      border: `1px solid ${active ? colors.blueText : colors.border}`,
                      bgcolor: active ? colors.blueBgSoft : "transparent",
                      color: active ? colors.blueText : colors.textSecondary,
                      "&:hover": {
                        bgcolor: active ? colors.blueBgSoft : colors.hoverBg,
                      },
                    }}
                  >
                    {opt.label}
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box
            sx={{
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {children}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default LookUpModal;
