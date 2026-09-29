import { useState, useEffect } from "react";
import JevEntriesAPI from "../../../../../../../../api/endpoints/jev-entries.api.js";

function useJevBalance(jevId, grandTotal) {
  const [state, setState] = useState({
    balanced: false,
    loading: false,
    message: "",
  });
  const [tick, setTick] = useState(0);

  // re-check when entries are added/edited/deleted (fired by JevViewPanel)
  useEffect(() => {
    if (!jevId) return;
    const h = (e) => {
      if (String(e.detail?.jevId) === String(jevId)) setTick((k) => k + 1);
    };
    window.addEventListener("jev_entry_data_updated", h);
    window.addEventListener("jev_entry_data_deleted", h);
    return () => {
      window.removeEventListener("jev_entry_data_updated", h);
      window.removeEventListener("jev_entry_data_deleted", h);
    };
  }, [jevId]);

  useEffect(() => {
    if (!jevId) return;
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    JevEntriesAPI.getByJevId(jevId)
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res) ? res : (res?.data ?? []);
        const from = list
          .filter((e) => Number(e.dAmount) < 0)
          .reduce((s, e) => s + Math.abs(Number(e.dAmount || 0)), 0);
        const to = list
          .filter((e) => Number(e.dAmount) >= 0)
          .reduce((s, e) => s + Math.abs(Number(e.dAmount || 0)), 0);
        const balanced = from > 0 && to > 0 && from === to;
        const matches =
          Number(from.toFixed(2)) === Number(grandTotal.toFixed(2));

        let message = "";
        if (from === 0 && to === 0) message = "JEV Entries not yet added";
        else if (!balanced) message = "JEV entries not balanced yet";
        else if (!matches)
          message = "JEV entries balanced but do not match the total";

        setState({ balanced: balanced && matches, loading: false, message });
      })
      .catch((err) => {
        console.error("JEV balance check failed:", err);
        if (active)
          setState({
            balanced: false,
            loading: false,
            message: "JEV entries not balanced yet",
          });
      });
    return () => {
      active = false;
    };
  }, [jevId, grandTotal, tick]);

  return state;
}

export default useJevBalance;
