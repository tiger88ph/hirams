import React from "react";
import { createRoot } from "react-dom/client";
import AuthAPI from "../../api/endpoints/auth.api.js";
import { getItem, clearAll } from "../../utils/storage/localStorage";
import { clearMappings } from "../storage/mappingCache.js";
import Logout from "../../components/auth/Logout.jsx";
import { clearClientState } from "./clearClientState.js";
const BASE_PATH = import.meta.env.MODE === "production" ? "/hirams" : "/";
/** Imperatively mounts <Logout /> into a detached DOM node and tears it
 *  down once the user cancels, or once the outcome (success/error) has
 *  played out. Keeps callers simple: just call logout(), no JSX to place. */
const mountLogoutModal = (onConfirm) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const cleanup = () => {
    root.unmount();
    container.remove();
  };

  root.render(
    React.createElement(Logout, {
      open: true,
      onConfirm,
      onCancel: cleanup,
    }),
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useLogout = () => {
  const logout = () => {
    mountLogoutModal(async () => {
      try {
        const user = getItem("user", {});
        if (user?.nUserId) await AuthAPI.logout(user.nUserId);
      } catch (e) {
        console.error("Logout API call failed:", e);
      }

      await clearClientState();
      window.location.href = BASE_PATH;
    });
  };

  return logout;
};