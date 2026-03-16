import React from "react";
import { createRoot } from "react-dom/client";
import Swal from "sweetalert2";
import DotSpinner from "../../components/common/DotSpinner";
import BaseButton from "../../components/common/BaseButton";
import api from "../../utils/api/api";
import { clearMappings } from "../../utils/mappings/mappingCache";

// ─── Constants ────────────────────────────────────────────────────────────────
const FONT = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

const BASE_PATH = import.meta.env.MODE === "production" ? "/hirams" : "/";

const BASE_POPUP_STYLE = `
  font-family: ${FONT};
  border-radius: 16px;
  padding: 0;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 20px 60px -8px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06);
`;

const BASE_SWAL = {
  background: "#ffffff",
  backdrop: "rgba(15, 23, 42, 0.4)",
  customClass: { popup: "swal-no-padding" },
  didOpen: () => {
    Swal.getPopup().style.cssText += BASE_POPUP_STYLE;
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────
/** Close any open Swal before opening a new one to avoid stacking. */
const openSwal = (options) => {
  if (Swal.isVisible()) Swal.close();
  return Swal.fire(options);
};

const mountSpinner = (id) => {
  const el = document.getElementById(id);
  if (el) createRoot(el).render(React.createElement(DotSpinner, { size: 8 }));
};

// ─── Exported utilities ───────────────────────────────────────────────────────

/**
 * Wipes all client-side state: localStorage, sessionStorage, mapping cache,
 * browser caches, service workers, and cookies.
 * Safe to call from anywhere — each section is independently try/caught.
 */
export const clearClientState = async () => {
  localStorage.clear();
  sessionStorage.clear();
  clearMappings();

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn("Could not clear caches:", e);
  }

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch (e) {
    console.warn("Could not unregister service workers:", e);
  }

  try {
    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!name) return;
      const base = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      document.cookie = base;
      document.cookie = `${base};domain=${window.location.hostname}`;
    });
  } catch (e) {
    console.warn("Could not clear cookies:", e);
  }
};

export const forceLogout = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token"); // ← grab token
    if (user?.nUserId) {
      fetch(`${import.meta.env.VITE_API_BASE_URL}logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // ← add auth header
        },
        body: JSON.stringify({ nUserId: user.nUserId }),
      }).catch(() => {});
    }
  } catch (_) {}

  localStorage.clear();
  sessionStorage.clear();
  clearMappings();
  window.location.href = BASE_PATH;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useLogout = () => {
  const logout = async () => {
    // ── 1. Confirmation ────────────────────────────────────────────────────────
    const { isConfirmed } = await openSwal({
      ...BASE_SWAL,
      html: `
        <div style="padding:36px 32px 28px; text-align:center; font-family:${FONT};">
          <div style="
            width:60px; height:60px; margin:0 auto 18px;
            border-radius:50%; background:#fff1f2; border:1.5px solid #fecdd3;
            display:flex; align-items:center; justify-content:center;
          ">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                 stroke="#e11d48" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
          <h2 style="margin:0 0 6px; font-size:1.2rem; font-weight:650; letter-spacing:-0.02em; color:#0f172a;">
            Sign out?
          </h2>
          <p style="margin:0 0 24px; font-size:0.85rem; color:#64748b; line-height:1.6;">
            You'll need to sign back in to access your account.
          </p>
          <div id="swal-btn-root" style="display:flex; gap:8px;"></div>
        </div>
      `,
      showConfirmButton: false,
      showCancelButton: false,
      allowOutsideClick: true,
      allowEscapeKey: true,
      didOpen: () => {
        Swal.getPopup().style.cssText += BASE_POPUP_STYLE;
        const container = document.getElementById("swal-btn-root");
        if (!container) return;
        createRoot(container).render(
          React.createElement(
            React.Fragment,
            null,
            React.createElement(BaseButton, {
              label: "Stay",
              actionColor: "cancel",
              onClick: () => Swal.close(),
              sx: { flex: 1 },
            }),
            React.createElement(BaseButton, {
              label: "Sign out",
              actionColor: "delete",
              onClick: () => Swal.clickConfirm(),
              sx: { flex: 1 },
            }),
          ),
        );
      },
      preConfirm: () => true,
    });

    if (!isConfirmed) return;

    // ── 2. Loading ─────────────────────────────────────────────────────────────
    openSwal({
      ...BASE_SWAL,
      html: `
        <div style="background:#ffffff; padding:40px 36px; text-align:center;">
          <div id="spinner-root" style="margin:0 auto 16px; display:flex; justify-content:center;"></div>
          <p style="
            margin:0; font-family:${FONT};
            font-size:0.8rem; font-weight:500;
            color:#94a3b8; letter-spacing:0.05em; text-transform:uppercase;
          ">Signing out…</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      backdrop: "rgba(15, 23, 42, 0.5)",
      didOpen: () => {
        Swal.getPopup().style.cssText += BASE_POPUP_STYLE;
        mountSpinner("spinner-root");
      },
    });

    try {
      // ── 3. API call ──────────────────────────────────────────────────────────
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.nUserId) await api.post("logout", { nUserId: user.nUserId });
      } catch (e) {
        console.error("Logout API call failed:", e);
      }

      // ── 4. Wipe state & redirect ─────────────────────────────────────────────
      await clearClientState();
      window.location.href = BASE_PATH;
    } catch (error) {
      console.error("Logout failed:", error);

      // ── 5. Error fallback ────────────────────────────────────────────────────
      await openSwal({
        ...BASE_SWAL,
        html: `
          <div style="padding:32px; text-align:center; font-family:${FONT};">
            <div style="
              width:50px; height:50px; margin:0 auto 14px;
              border-radius:50%; background:#fffbeb; border:1.5px solid #fde68a;
              display:flex; align-items:center; justify-content:center;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 style="margin:0 0 5px; font-size:1rem; font-weight:650; color:#0f172a;">
              Something went wrong
            </h3>
            <p style="margin:0; font-size:0.82rem; color:#94a3b8;">
              Redirecting you shortly…
            </p>
          </div>
        `,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      window.location.href = BASE_PATH;
    }
  };

  return logout;
};
