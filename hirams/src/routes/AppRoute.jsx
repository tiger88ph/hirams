import React, { useMemo, useCallback } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useIdleTimer } from "../utils/auth/useIdleTimer";
import { clearClientState } from "../utils/auth/logout";
import { buildRoleGroups } from "../utils/helpers/roleHelper";
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
import TransactionArchive from "../pages/common/transaction/TransactionArchive";
import TransactionForPurchase from "../pages/common/transaction/TransactionForPurchase";

const BASE_PATH = import.meta.env.MODE === "production" ? "/hirams" : "/";

export default function AppRoute() {
  const { userTypes, loading: mappingLoading } = useMapping();

  // ── Idle logout ──────────────────────────────────────────────────────────────
  const handleIdle = useCallback(async () => {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem("user") || "null");
    } catch (e) {
      console.error("Failed to parse user:", e);
    }

    if (!user?.nUserId) return;

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
        if (el)
          createRoot(el).render(React.createElement(DotSpinner, { size: 8 }));
      },
    });

    try {
      await api.post("logout", { nUserId: user.nUserId });
    } catch (e) {
      console.error("Idle logout API call failed:", e);
    } finally {
      await clearClientState();
      Swal.close();
      window.location.href = BASE_PATH;
    }
  }, []);

  useIdleTimer(3_600_000, handleIdle);

  // ── Role resolution via roleHelper ──────────────────────────────────────────
  const roleKeyString = Object.keys(userTypes || {}).join(",");

  const { managementKey, procurementKey, accountOfficerKey } = useMemo(
    () => buildRoleGroups(userTypes || {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleKeyString],
  );

  // Coerce all keys to strings — prevents type mismatch ("1" !== 1)
  const toStringRoles = (...roles) => roles.filter(Boolean).map(String);

  const allRoles           = toStringRoles(...managementKey, ...procurementKey, ...accountOfficerKey);
  const managementRoles    = toStringRoles(...managementKey);
  const procurementRoles   = toStringRoles(...procurementKey);
  const accountOfficerRoles = toStringRoles(...accountOfficerKey);

  // ── Router ───────────────────────────────────────────────────────────────────
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

          // ── All roles ────────────────────────────────────────────────────
          {
            element: <ProtectedRoute allowedRoles={allRoles} />,
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
                  { path: "/transaction-archive",     element: <TransactionArchive /> },
                  { path: "/transaction-for-purchase", element: <TransactionForPurchase /> },

                ],
              },
            ],
          },

          // ── Management ───────────────────────────────────────────────────
          {
            element: <ProtectedRoute allowedRoles={managementRoles} />,
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

          // ── Procurement ──────────────────────────────────────────────────
          {
            element: <ProtectedRoute allowedRoles={procurementRoles} />,
            children: [{ element: <Layout />, children: [{}] }],
          },

          // ── Account Officer (AO + AOTL) ──────────────────────────────────
          {
            element: <ProtectedRoute allowedRoles={accountOfficerRoles} />,
            children: [
              {
                element: <Layout />,
                children: [{}],
              },
            ],
          },
        ],
        { basename: BASE_PATH },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleKeyString],
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