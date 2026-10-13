import { useState, useCallback } from "react";

export default function useSettings() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("account");

  const handleTabChange = useCallback((_, newTab) => {
    setTab(newTab);
  }, []);

  return {
    search,
    setSearch,
    tab,
    handleTabChange,
  };
}