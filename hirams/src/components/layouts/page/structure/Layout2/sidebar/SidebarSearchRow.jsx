import React, { useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { InputBase } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import getThemeColors from "../../../../../../utils/style/getThemeColors";
import LookUpModal from "../../../../modal/LookUpModal";
import LookUpTransactions, {
  LOOKUP_SEARCH_BY,
} from "../../../../../../pages/shared/transactions/components/LookUpTransactions";

// ─────────────────────────────────────────────────────────────────
// Search row shown as the FIRST row of any sidebar item that has a
// submenu (opt-in via `showSearch`). Typing into it opens the
// standalone LookUpModal; clearing / closing it hides the modal.
// ─────────────────────────────────────────────────────────────────
const useColors = (c) => ({
  rowBg: c.gray.inputBg,
  rowBorder: c.slate.border,
  icon: c.gray.textDisabled,
  text: c.gray.textPrimary,
  placeholder: c.gray.textDisabled,
});

const SidebarSearchRow = ({ placeholder = "Search..." }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const base = useMemo(() => getThemeColors(isDark), [isDark]);
  const colors = useMemo(() => useColors(base), [base]);

  // Typing anything opens the modal; empty input closes it.
  const [query, setQuery] = useState("");
  const [searchBy, setSearchBy] = useState(LOOKUP_SEARCH_BY[0] ?? "Default");
  const open = query.trim().length > 0;
  const closeModal = () => setQuery("");

  return (
    <div
      className="flex items-center gap-1.5 pl-1.5 pr-1.5 py-[3px] mb-1 ml-1 mr-1 rounded-md flex-shrink-0 cursor-text"
      style={{
        backgroundColor: colors.rowBg,
        border: `1px solid ${colors.rowBorder}`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <SearchIcon sx={{ fontSize: 13, color: colors.icon, flexShrink: 0 }} />
      <InputBase
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        inputProps={{ "aria-label": placeholder }}
        sx={{
          flex: 1,
          minWidth: 0,
          fontSize: "11.5px",
          color: colors.text,
          "& input": { padding: 0 },
          "&::placeholder": {
            color: colors.placeholder,
            opacity: 1,
          },
        }}
      />

      <LookUpModal
        open={open}
        query={query}
        onChange={setQuery}
        handleClose={closeModal}
        searchByOptions={LOOKUP_SEARCH_BY}
        searchBy={searchBy}
        onSearchByChange={setSearchBy}
      >
        <LookUpTransactions
          query={query}
          searchBy={searchBy}
          onSelect={closeModal}
        />
      </LookUpModal>
    </div>
  );
};

export default SidebarSearchRow;
