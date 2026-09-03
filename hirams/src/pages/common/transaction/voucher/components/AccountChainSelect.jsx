import { useState, useEffect, useMemo, useRef } from "react";
import { Box, Typography, Skeleton, useTheme } from "@mui/material";
import JournalAccountAPI from "../../../../../api/endpoints/journal-account.api.js";
import getThemeColors from "../../../../../utils/style/getThemeColors.js";
const MAX_DEPTH = 15;

const useColors = (c) => ({
  gray: {
    textPrimary: c.gray.textPrimary,
    textHeading: c.gray.textHeading,
    inputBg: c.gray.inputBg,
  },
  slate: { btnBorder: c.slate.btnBorder },
  red: { text: c.red.text },
  amber: { warnText: c.amber.warnText },
  skeleton: { overlay: c.skeleton.overlay },
});

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
              <Box
                component="select"
                value={selectedId}
                onChange={(e) => handleSelectAt(idx, e.target.value)}
                sx={{
                  ...fieldSx,
                  border: `0.5px solid ${error && isLastLevel && !hasChildren ? colors.red.text : colors.slate.btnBorder}`,
                }}
              >
                <option value="">
                  {idx === 0 ? "Select account…" : "Select linked account…"}
                </option>
                {options.map((acc) => (
                  <option
                    key={acc.nJournalAccountId}
                    value={acc.nJournalAccountId}
                  >
                    {acc.strAccountName}
                  </option>
                ))}
              </Box>

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
