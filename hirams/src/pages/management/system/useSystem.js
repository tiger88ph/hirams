import { useState, useCallback } from "react";

export default function useSystem() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("general");

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