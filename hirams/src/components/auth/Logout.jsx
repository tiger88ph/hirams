import React, { useState } from "react";
import { Dialog } from "@mui/material";
import BaseButton from "../form/BaseButton.jsx";
import DotSpinner from "../loader/DotSpinner.jsx";

const FONT = `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;

/**
 * Sign-out confirmation modal.
 *
 * Purely presentational + its own step state (confirm → loading → error).
 * The actual sign-out work (API call, clearing storage, redirect) is
 * handled entirely by the `onConfirm` callback passed in from useLogout —
 * this component just reflects what step that process is in.
 */
export default function Logout({ open, onConfirm, onCancel }) {
  const [step, setStep] = useState("confirm"); // "confirm" | "loading" | "error"

  const handleConfirm = async () => {
    setStep("loading");
    try {
      await onConfirm();
      // On success onConfirm redirects the page itself, so there's
      // nothing further to do here — the component will be torn down
      // along with the page navigation.
    } catch (e) {
      console.error("Logout failed:", e);
      setStep("error");
      setTimeout(() => {
        onCancel?.();
      }, 2200);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={step === "confirm" ? onCancel : undefined}
      PaperProps={{
        sx: {
          borderRadius: "16px",
          fontFamily: FONT,
          maxWidth: 380,
          width: "100%",
          overflow: "hidden",
        },
      }}
    >
      {step === "confirm" && (
        <div style={{ padding: "36px 32px 28px", textAlign: "center" }}>
          <div
            style={{
              width: 60,
              height: 60,
              margin: "0 auto 18px",
              borderRadius: "50%",
              background: "#fff1f2",
              border: "1.5px solid #fecdd3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e11d48"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "1.2rem",
              fontWeight: 650,
              letterSpacing: "-0.02em",
              color: "#0f172a",
            }}
          >
            Sign out?
          </h2>

          <p
            style={{
              margin: "0 0 24px",
              fontSize: "0.85rem",
              color: "#64748b",
              lineHeight: 1.6,
            }}
          >
            You'll need to sign back in to access your account.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <BaseButton
              label="Stay"
              actionColor="cancel"
              onClick={onCancel}
              sx={{ flex: 1 }}
            />
            <BaseButton
              label="Sign out"
              actionColor="delete"
              onClick={handleConfirm}
              sx={{ flex: 1 }}
            />
          </div>
        </div>
      )}

      {step === "loading" && (
        <div style={{ padding: "40px 36px", textAlign: "center" }}>
          <div
            style={{
              margin: "0 auto 16px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <DotSpinner size={8} />
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              fontWeight: 500,
              color: "#94a3b8",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            Signing out…
          </p>
        </div>
      )}

      {step === "error" && (
        <div style={{ padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 50,
              height: 50,
              margin: "0 auto 14px",
              borderRadius: "50%",
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d97706"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h3
            style={{
              margin: "0 0 5px",
              fontSize: "1rem",
              fontWeight: 650,
              color: "#0f172a",
            }}
          >
            Something went wrong
          </h3>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
            Redirecting you shortly…
          </p>
        </div>
      )}
    </Dialog>
  );
}
