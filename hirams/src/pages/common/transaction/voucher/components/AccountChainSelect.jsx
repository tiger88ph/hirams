import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Typography, Skeleton, useTheme } from "@mui/material";
import { KeyboardArrowDown, SearchOutlined } from "@mui/icons-material";
import JournalAccountAPI from "../../../../../api/endpoints/journal-account.api.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
const MAX_DEPTH = 15;
const SEARCH_THRESHOLD = 5;
const DROPDOWN_MAX_HEIGHT = 50;

const useColors = (c) => ({
  gray: {
    textPrimary: c.gray.textPrimary,
    textHeading: c.gray.textHeading,
    textMuted: c.gray.textMuted,
    inputBg: c.gray.inputBg,
  },
  slate: {
    btnBorder: c.slate.btnBorder,
    border: c.slate.border,
    hover: c.slate.hover,
  },
  blue: { bg: c.blue.bg, border: c.blue.border, text: c.blue.text },
  red: { text: c.red.text },
  amber: { warnText: c.amber.warnText },
  skeleton: { overlay: c.skeleton.overlay },
});

const resolveAccountLabel = (account) => {
  if (account?.strAccountName) return account.strAccountName;
  if (account?.client) {
    return `Receivables from ${
      account.client.strClientNickName || account.client.strClientName
    }`;
  }
  if (account?.supplier) {
    return `Receivables from ${
      account.supplier.strSupplierNickName || account.supplier.strSupplierName
    }`;
  }
  return "—";
};

// ── Custom dropdown for a single chain level ───────────────────────────
// Renders like a <select>, but with a capped, scrollable menu height and
// (once there are more than SEARCH_THRESHOLD options) a search field to
// filter the list.
function ChainLevelSelect({
  options,
  value,
  placeholder,
  hasError,
  colors,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const showSearch = options.length > SEARCH_THRESHOLD;

  useEffect(() => {
    if (!open) {
      setSearch("");
      return;
    }
    if (showSearch) {
      // focus after the menu mounts
      const id = requestAnimationFrame(() => searchInputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open, showSearch]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find(
    (a) => Number(a.nJournalAccountId) === Number(value),
  );

  const filteredOptions = useMemo(() => {
    if (!showSearch) return options;
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((a) =>
      (a.display_name || "").toLowerCase().includes(q),
    );
  }, [options, search, showSearch]);

  const handlePick = (accountId) => {
    onChange(accountId);
    setOpen(false);
  };

  const fieldSx = {
    width: "100%",
    px: 1.25,
    py: 0.875,
    fontSize: "0.75rem",
    borderRadius: "8px",
    outline: "none",
    fontFamily: "inherit",
    color: colors.gray.textPrimary,
    background: colors.gray.inputBg,
    boxSizing: "border-box",
  };

  return (
    <Box ref={containerRef} sx={{ position: "relative" }}>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          ...fieldSx,
          border: `0.5px solid ${hasError ? colors.red.text : colors.slate.btnBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 0.5,
          cursor: "pointer",
        }}
      >
        <Typography
          noWrap
          sx={{
            fontSize: "0.75rem",
            color: selected ? colors.gray.textPrimary : colors.gray.textMuted,
          }}
        >
          {selected ? selected.display_name : placeholder}
        </Typography>
        <KeyboardArrowDown
          sx={{
            fontSize: "1rem",
            color: colors.gray.textMuted,
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        />
      </Box>

      {open && (
        <Box
          sx={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 20,
            bgcolor: colors.gray.inputBg,
            border: `1px solid ${colors.slate.border}`,
            borderRadius: "8px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {showSearch && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                m: 0.75,
                mb: 0.5,
                px: 1,
                height: 30,
                borderRadius: "6px",
                border: `1px solid ${colors.slate.border}`,
                flexShrink: 0,
              }}
            >
              <SearchOutlined
                sx={{ fontSize: "0.8rem", color: colors.gray.textMuted }}
              />
              <Box
                component="input"
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                sx={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "0.72rem",
                  color: colors.gray.textPrimary,
                  fontFamily: "inherit",
                  "::placeholder": { color: colors.gray.textMuted },
                }}
              />
            </Box>
          )}

          <Box
            sx={{
              maxHeight: DROPDOWN_MAX_HEIGHT,
              overflowY: "auto",
            }}
          >
            <Box
              onClick={() => handlePick("")}
              sx={{
                px: 1.25,
                py: 0.75,
                fontSize: "0.72rem",
                color: colors.gray.textMuted,
                cursor: "pointer",
                "&:hover": { bgcolor: colors.slate.hover },
              }}
            >
              {placeholder}
            </Box>

            {filteredOptions.length === 0 ? (
              <Box sx={{ px: 1.25, py: 1, textAlign: "center" }}>
                <Typography
                  sx={{ fontSize: "0.7rem", color: colors.gray.textMuted }}
                >
                  No matches
                </Typography>
              </Box>
            ) : (
              filteredOptions.map((acc) => {
                const isSelected =
                  Number(acc.nJournalAccountId) === Number(value);
                return (
                  <Box
                    key={acc.nJournalAccountId}
                    onClick={() => handlePick(acc.nJournalAccountId)}
                    sx={{
                      px: 1.25,
                      py: 0.75,
                      fontSize: "0.75rem",
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected
                        ? colors.blue.text
                        : colors.gray.textPrimary,
                      bgcolor: isSelected ? colors.blue.bg : "transparent",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: isSelected ? colors.blue.bg : colors.slate.hover,
                      },
                    }}
                  >
                    {acc.display_name}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function AccountChainSelect({
  value,
  preloadedAccount,
  onChange,
  error,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  const [chainOptions, setChainOptions] = useState([]);
  const [chainSelected, setChainSelected] = useState([]);
  const [parentsList, setParentsList] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // Tracks value changes triggered by our own handleSelectAt so we don't
  // re-run the full network rebuild (and flash the Skeleton) for a chain
  // we already have correctly built in local state.
  const skipRebuildRef = useRef(false);

  const showSkeleton = !isReady;

  useEffect(() => {
    let active = true;
    JournalAccountAPI.getParents()
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        setParentsList(list);
      })
      .catch((err) => {
        console.error("Failed to fetch parents:", err);
        if (active) setParentsList([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (skipRebuildRef.current) {
      // Value changed because of our own local selection — local
      // chainOptions/chainSelected already reflect it correctly.
      skipRebuildRef.current = false;
      return;
    }

    const targetId = Number(value);

    if (!targetId) {
      if (parentsList.length > 0) {
        setChainOptions([parentsList]);
        setChainSelected([]);
        setIsReady(true);
      }
      return;
    }

    if (parentsList.length === 0) return;

    const buildChain = async () => {
      setIsReady(false);

      try {
        const directTop = parentsList.find(
          (p) => Number(p.nJournalAccountId) === targetId,
        );
        if (directTop) {
          setChainOptions([parentsList]);
          setChainSelected([targetId]);
          onChange(targetId);
          setIsReady(true);
          return;
        }

        let account = preloadedAccount;
        if (!account) {
          const all = await JournalAccountAPI.getAll();
          const list = Array.isArray(all) ? all : (all?.data ?? []);
          account = list.find((a) => Number(a.nJournalAccountId) === targetId);
        }

        if (!account) {
          setChainOptions([parentsList]);
          setIsReady(true);
          return;
        }

        const path = [targetId];
        const levels = [];
        let parentId = Number(account.nParentAccountId) || 0;
        let depth = 0;

        if (parentId) {
          const sibRes = await JournalAccountAPI.getChildren(parentId);
          const siblings = Array.isArray(sibRes)
            ? sibRes
            : (sibRes?.data ?? []);
          levels.unshift(siblings);
        } else {
          levels.unshift(parentsList);
        }

        let currentPid = parentId;
        while (currentPid && depth < MAX_DEPTH) {
          depth++;

          let parentAcc = parentsList.find(
            (p) => Number(p.nJournalAccountId) === currentPid,
          );

          if (!parentAcc) {
            const res = await JournalAccountAPI.getParents();
            const plist = Array.isArray(res) ? res : (res?.data ?? []);
            parentAcc = plist.find(
              (p) => Number(p.nJournalAccountId) === currentPid,
            );
            if (plist.length > 0 && parentsList.length === 0) {
              setParentsList(plist);
            }
          }

          if (!parentAcc) break;

          path.unshift(currentPid);
          const nextPid = Number(parentAcc.nParentAccountId) || 0;

          if (nextPid) {
            const res = await JournalAccountAPI.getChildren(nextPid);
            levels.unshift(Array.isArray(res) ? res : (res?.data ?? []));
          } else {
            levels.unshift(parentsList);
          }

          currentPid = nextPid;
        }

        setChainOptions(levels);
        setChainSelected(path);
        onChange(targetId);
      } catch (err) {
        console.error("Build chain failed:", err);
        setChainOptions([parentsList]);
      } finally {
        setIsReady(true);
      }
    };

    buildChain();
  }, [value, preloadedAccount, parentsList]);

  const handleSelectAt = async (levelIdx, rawValue) => {
    const accountId = rawValue ? Number(rawValue) : "";
    const newSelected = chainSelected.slice(0, levelIdx + 1);
    newSelected[levelIdx] = accountId;
    setChainSelected(newSelected);
    setChainOptions((prev) => prev.slice(0, levelIdx + 1));

    if (!accountId) {
      skipRebuildRef.current = true;
      onChange("");
      return;
    }

    try {
      const res = await JournalAccountAPI.getChildren(accountId);
      const children = Array.isArray(res) ? res : (res?.data ?? []);

      if (children.length > 0) {
        setChainOptions((prev) => {
          const next = [...prev.slice(0, levelIdx + 1)];
          next[levelIdx + 1] = children;
          return next;
        });
      } else {
        skipRebuildRef.current = true;
        onChange(accountId);
      }
    } catch (err) {
      console.error("Failed to fetch children:", err);
      skipRebuildRef.current = true;
      onChange(accountId);
    }
  };

  return (
    <Box sx={{ mb: 1 }}>
      <Typography
        sx={{
          fontSize: "0.6rem",
          fontWeight: 600,
          color: colors.gray.textHeading,
          mb: 0.4,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        Account Title
      </Typography>

      {showSkeleton ? (
        <Skeleton
          variant="rounded"
          height={34}
          sx={{ borderRadius: "8px", bgcolor: colors.skeleton.overlay }}
        />
      ) : (
        chainOptions.map((options, idx) => {
          const isLastLevel = idx === chainOptions.length - 1;
          const selectedId = chainSelected[idx] ?? "";
          const selectedAcc = options.find(
            (a) => Number(a.nJournalAccountId) === Number(selectedId),
          );
          const hasChildren =
            selectedAcc &&
            chainOptions.length > idx + 1 &&
            chainOptions[idx + 1]?.length > 0 &&
            !chainSelected[idx + 1];

          return (
            <Box key={idx} sx={{ mb: !isLastLevel ? 0.6 : 0 }}>
              <ChainLevelSelect
                options={options}
                value={selectedId}
                placeholder={idx === 0 ? "Select account…" : "Select linked account…"}
                hasError={error && isLastLevel && !hasChildren}
                colors={colors}
                onChange={(newValue) => handleSelectAt(idx, newValue)}
              />

              {hasChildren && (
                <Typography
                  sx={{
                    fontSize: "0.58rem",
                    color: colors.amber.warnText,
                    mt: 0.3,
                  }}
                >
                  ⓘ Please select a linked account below.
                </Typography>
              )}
            </Box>
          );
        })
      )}

      {error && !showSkeleton && (
        <Typography
          sx={{ fontSize: "0.58rem", color: colors.red.text, mt: 0.3 }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}