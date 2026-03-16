// src/utils/hooks/useAutoRefetch.js
import { useEffect } from "react";

export default function useAutoRefetch(fetchFn, enabled = true, intervalMs = 15000) {
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      fetchFn();
    }, intervalMs);

    return () => clearInterval(interval); 
  }, [fetchFn, intervalMs, enabled]);
}