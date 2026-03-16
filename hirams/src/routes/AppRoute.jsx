import React, { useMemo, useCallback } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useIdleTimer } from "../utils/auth/useIdleTimer";
import { clearClientState } from "../utils/auth/logout";
import useMapping from "../utils/mappings/useMapping";
import { createRoot } from "react-dom/client";
import Swal from "sweetalert2";
import api from "../utils/api/api";

import Layout from "../components/layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import DotSpinner from "../components/common/DotSpinner";

// Auth
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Register from "../pages/auth/Register";
import ResetPassword from "../pages/auth/ResetPassword";

// Index
import IndexPage from "../pages/index";

// Pages
import Dashboard from "../pages/common/overview/Dashboard";
import Transaction from "../pages/common/transaction/Transaction";
import TransactionCanvas from "../pages/common/transaction/TransactionCanvas";
import TransactionPricing from "../pages/common/transaction/TransactionPricing";
import TransactionPricingSet from "../pages/common/transaction/TransactionPricingSet";
import Documentation from "../pages/common/documentation/Index";
import AddBulkItem from "../pages/common/transaction/components/AddBulkItem";
import Client from "../pages/common/client/Client";
import Supplier from "../pages/common/supplier/Supplier";
import User from "../pages/management/user/User";
import Company from "../pages/management/company/Company";
import DirectCost from "../pages/management/direct-cost/DirectCost";

const BASE_PATH = import.meta.env.MODE === "production" ? "/hirams" : "/";

export default function AppRoute() {
  const { userTypes, loading: mappingLoading } = useMapping();

  // ── Idle logout ──────────────────────────────────────────────────────────────
  // Stable reference via useCallback — no deps needed because it only reads
  // localStorage at call-time. This prevents useIdleTimer from re-registering
  // all DOM listeners on every render.
  const handleIdle = useCallback(async () => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      console.error("Failed to parse user:", e);
    }

    if (!user?.nUserId) return;

    // Show spinner while logging out
    Swal.fire({
      html: `
        <div style="
          display:flex; flex-direction:column;
          align-items:center; gap:12px; padding:28px;
        ">
          <div id="idle-spinner-root"></div>
          <span style="font-size:0.85rem; color:#64748b;">
            You have been logged out due to inactivity…
          </span>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        const el = document.getElementById("idle-spinner-root");
        if (el) createRoot(el).render(React.createElement(DotSpinner, { size: 8 }));
      },
    });

    try {
      await api.post("logout", { nUserId: user.nUserId });
    } catch (e) {
      console.error("Idle logout API call failed:", e);
    } finally {
      // clearClientState handles localStorage, sessionStorage, caches,
      // service workers, and cookies — no duplication needed here.
      await clearClientState();
      Swal.close();
      window.location.href = BASE_PATH;
    }
  }, []); // empty deps: reads localStorage at invocation, not at definition

  useIdleTimer(3_600_000, handleIdle); // 1 hour

  // ── Role resolution ──────────────────────────────────────────────────────────
  const roleKeys = Object.keys(userTypes || {});

  // Destructure by index — index 2 is intentionally skipped (unused role slot)
  const [
    accountOfficerLevel,      // 0
    managementLevel,          // 1
    ,                         // 2 — unused
    procurementLevel,         // 3
    generalManagerLevel,      // 4
    accountOfficerLeaderLevel,// 5
    procurementLeaderLevel,   // 6
  ] = roleKeys;

  const safeRoles = (...roles) => roles.filter(Boolean);

  // ── Router ───────────────────────────────────────────────────────────────────
  // Only rebuilt when the set of role keys actually changes.
  const router = useMemo(
    () =>
      createBrowserRouter(
        [
          // ── Public ────────────────────────────────────────────────────────
          { path: "/",               element: <Login /> },
          { path: "/forgotPassword", element: <ForgotPassword /> },
          { path: "/register",       element: <Register /> },
          { path: "/index",          element: <IndexPage /> },
          { path: "/reset-password", element: <ResetPassword /> },

          // ── All roles ──────────────────────────────────────────────────────
          {
            element: (
              <ProtectedRoute
                allowedRoles={safeRoles(
                  accountOfficerLevel,
                  accountOfficerLeaderLevel,
                  generalManagerLevel,
                  managementLevel,
                  procurementLevel,
                  procurementLeaderLevel,
                )}
              />
            ),
            children: [
              {
                element: <Layout />,
                children: [
                  { path: "/dashboard",               element: <Dashboard /> },
                  { path: "/documentation",           element: <Documentation /> },
                  { path: "/supplier",                element: <Supplier /> },
                  { path: "/transaction",             element: <Transaction /> },
                  { path: "/transaction-canvas",      element: <TransactionCanvas /> },
                  { path: "/transaction-pricing-set", element: <TransactionPricingSet /> },
                  { path: "/transaction-pricing",     element: <TransactionPricing /> },
                  { path: "/client",                  element: <Client /> },
                  { path: "/add-bulk-item",           element: <AddBulkItem /> },
                ],
              },
            ],
          },

          // ── Management ────────────────────────────────────────────────────
          {
            element: (
              <ProtectedRoute
                allowedRoles={safeRoles(generalManagerLevel, managementLevel)}
              />
            ),
            children: [
              {
                element: <Layout />,
                children: [
                  { path: "/user",        element: <User /> },
                  { path: "/company",     element: <Company /> },
                  { path: "/direct-cost", element: <DirectCost /> },
                ],
              },
            ],
          },

          // ── Procurement ───────────────────────────────────────────────────
          {
            element: (
              <ProtectedRoute
                allowedRoles={safeRoles(procurementLevel, procurementLeaderLevel)}
              />
            ),
            children: [{ element: <Layout />, children: [{}] }],
          },

          // ── Account Officer ───────────────────────────────────────────────
          {
            element: (
              <ProtectedRoute
                allowedRoles={safeRoles(
                  accountOfficerLevel,
                  accountOfficerLeaderLevel,
                )}
              />
            ),
            children: [
              {
                element: <Layout />,
                children: [
                  { path: "/transaction-canvas", element: <TransactionCanvas /> },
                ],
              },
            ],
          },
        ],
        { basename: BASE_PATH }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleKeys.join(",")]
  );

  if (mappingLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <DotSpinner size={15} gap={2} message={true} />
      </div>
    );
  }

  return <RouterProvider router={router} />;
}