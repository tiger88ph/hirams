import React, { useMemo, useCallback, useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useIdleTimer } from "../utils/auth/useIdleTimer";
import { clearClientState } from "../utils/auth/logout";
import { buildRoleGroups } from "../utils/helpers/roleHelper";
import useMapping from "../utils/mappings/useMapping";
import { createRoot } from "react-dom/client";
import Swal from "sweetalert2";
import api from "../api/axios";
import AuthAPI from "../api/endpoints/auth.api.js";
import Layout from "../layouts/page/index";
import ProtectedRoute from "./ProtectedRoute";
import DotSpinner from "../components/loader/DotSpinner";

// Auth
import Login from "../pages/auth/login";
import ForgotPassword from "../pages/auth/forgot-password";
import Register from "../pages/auth/register";
import ResetPassword from "../pages/auth/reset-password";

// Index
import IndexPage from "../pages/index";

// Pages
import Dashboard from "../pages/common/overview/Dashboard";
import Documentation from "../pages/common/documentation/Index";
import TransactionCanvas from "../pages/common/transaction/canvas"; //DONE - NV
import TransactionPricing from "../pages/common/transaction/pricing"; //DONE - NV
import TransactionPricingSet from "../pages/common/transaction/pricing-set"; //DONE - NV
import AddBulkItem from "../pages/common/transaction/canvas/components/AddBulkItem"; //DONE - NV
import Transaction from "../pages/common/transaction/transactions"; //DONE - NV
import Client from "../pages/common/client"; //DONE - NV
import Supplier from "../pages/common/supplier"; //DONE - NV
import User from "../pages/management/user"; // DONE - NV -> LOCSTR
import Company from "../pages/management/company"; // DONE - NV -> LOCSTR
import DirectCost from "../pages/management/direct-cost"; //DONE - NV -> LOCSTR
import TransactionPurchaseCart from "../pages/common/transaction/purchase-cart"; //DONE - NV
import PrintPO from "../pages/common/transaction/print-pages/print-purchase-order"; //DONE - NV
import Inventory from "../pages/common/inventory"; // DONE - NV
import Assignee from "../pages/common/assignee"; // DONE - NV
import PrintCheque from "../pages/common/transaction/print-pages/print-cheque"; //DONE - NV
import TransactionArchive from "../pages/common/transaction/archive"; //DONE - NV
import TransactionForPurchase from "../pages/common/transaction/purchase"; //DONE - NV
import TransactionVoucher from "../pages/common/transaction/voucher"; //DONE - NV
import PrintVoucher from "../pages/common/transaction/print-pages/print-voucher"; //DONE - NV
import PrintDR from "../pages/common/transaction/print-pages/print-delivery-receipt"; //DONE - NV
import PrintSI from "../pages/common/transaction/print-pages/print-sales-invoice"; //DONE - NV
import VoucherUpdateView from "../pages/common/transaction/voucher/sub-pages/voucher-update";
import PurchaseCartUpdateView from "../pages/common/transaction/purchase-cart/sub-pages/purchase-cart-update";
import JournalAccount from "../pages/finance/journal-accounts"; //DONE - NV
import JournalEntryVoucher from "../pages/finance/journal-entry-voucher"; //DONE - NV
import ItemPurchasingView from "../pages/common/transaction/item-purchasing"; //DONE - NV
import ItemPurchasingUpdateView from "../pages/common/transaction/item-purchasing/sub-pages/item-purchasing-update"; //DONE - NV
// import ForJev from "../pages/finance/for-jev";

const BASE_PATH = import.meta.env.MODE === "production" ? "/hirams" : "/";
// import { UAParser } from "ua-parser-js";
import { getItem } from "../utils/storage/localStorage";
export default function AppRoute() {
  const { userTypes, loading: mappingLoading } = useMapping();

  // ── Log logged-in user's coordinates ────────────────────────────────────────
  // ── Log logged-in user's exact location (barangay / city / province / country) ──
  // useEffect(() => {
  //   let user = null;
  //   try {
  //     user = JSON.parse(localStorage.getItem("user") || "null");
  //   } catch (e) {
  //     console.error("Failed to parse user:", e);
  //   }

  //   if (!user?.nUserId) return;

  //   if (!navigator.geolocation) {
  //     console.warn("Geolocation is not supported by this browser.");
  //     return;
  //   }

  //   const reverseGeocode = async (latitude, longitude) => {
  //     try {
  //       const res = await fetch(
  //         `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
  //         {
  //           headers: {
  //             // Nominatim's usage policy requires an identifying header
  //             "Accept-Language": "en",
  //           },
  //         },
  //       );
  //       if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  //       const data = await res.json();
  //       const addr = data.address || {};

  //       return {
  //         barangay:
  //           addr.village ||
  //           addr.suburb ||
  //           addr.neighbourhood ||
  //           addr.quarter ||
  //           null,
  //         city: addr.city || addr.town || addr.municipality || null,
  //         province: addr.state || addr.province || null,
  //         country: addr.country || null,
  //         displayName: data.display_name || null,
  //       };
  //     } catch (err) {
  //       console.error("Reverse geocoding error:", err);
  //       return null;
  //     }
  //   };

  //   navigator.geolocation.getCurrentPosition(
  //     async (position) => {
  //       const { latitude, longitude, accuracy } = position.coords;
  //       const location = await reverseGeocode(latitude, longitude);

  //       console.log("Logged-in user location:", {
  //         userId: user.nUserId,
  //         latitude,
  //         longitude,
  //         accuracy,
  //         ...location,
  //       });
  //     },
  //     (error) => {
  //       console.error("Geolocation error:", error.message);
  //     },
  //     { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
  //   );
  // }, []);
  // useEffect(() => {
  //   let user = null;
  //   try {
  //     user = JSON.parse(localStorage.getItem("user") || "null");
  //   } catch (e) {
  //     console.error("Failed to parse user:", e);
  //   }

  //   if (!user?.nUserId) return;

  //   const parser = new UAParser();
  //   const result = parser.getResult();

  //   console.log("Logged-in user device info:", {
  //     userId: user.nUserId,
  //     deviceType: result.device.type || "desktop", // "mobile" | "tablet" | undefined→desktop
  //     deviceVendor: result.device.vendor,
  //     deviceModel: result.device.model,
  //     os: result.os.name,
  //     osVersion: result.os.version,
  //     browser: result.browser.name,
  //     browserVersion: result.browser.version,
  //     engine: result.engine.name,
  //   });
  // }, []);
  // ── Idle logout ──────────────────────────────────────────────────────────────
  const handleIdle = useCallback(async () => {
    const user = getItem("user");
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
      const user = getItem("user");
      if (user?.nUserId) await AuthAPI.logout(user.nUserId);
    } catch (e) {
      console.error("Idle logout API call failed:", e);
    }
  }, []);

  useIdleTimer(7_200_000, handleIdle);

  // ── Role resolution via roleHelper ──────────────────────────────────────────
  const roleKeyString = Object.keys(userTypes || {}).join(",");
  const {
    managementKey,
    procurementKey,
    accountOfficerKey,
    financeOfficerKey,
  } = useMemo(
    () => buildRoleGroups(userTypes || {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleKeyString],
  );

  const toStringRoles = (...roles) => roles.filter(Boolean).map(String);

  const allRoles = toStringRoles(
    ...managementKey,
    ...procurementKey,
    ...accountOfficerKey,
    ...financeOfficerKey,
  );
  const managementRoles = toStringRoles(...managementKey);
  const procurementRoles = toStringRoles(...procurementKey);
  const accountOfficerRoles = toStringRoles(...accountOfficerKey);
  const financeOfficerRoles = toStringRoles(...financeOfficerKey);

  // ── Router ───────────────────────────────────────────────────────────────────
  const router = useMemo(
    () =>
      createBrowserRouter(
        [
          // ── Public ────────────────────────────────────────────────────────
          { path: "/", element: <Login /> },
          { path: "/forgotPassword", element: <ForgotPassword /> },
          { path: "/register", element: <Register /> },
          { path: "/index", element: <IndexPage /> },
          { path: "/reset-password", element: <ResetPassword /> },
          { path: "/print-po", element: <PrintPO /> },
          { path: "/print-voucher", element: <PrintVoucher /> },
          { path: "/print-cheque", element: <PrintCheque /> },
          { path: "/print-dr", element: <PrintDR /> },
          { path: "/print-si", element: <PrintSI /> },
          // ── All roles ────────────────────────────────────────────────────
          {
            element: <ProtectedRoute allowedRoles={allRoles} />,
            children: [
              {
                element: <Layout />,
                children: [
                  { path: "/dashboard", element: <Dashboard /> },
                  { path: "/documentation", element: <Documentation /> },
                  { path: "/supplier", element: <Supplier /> },
                  { path: "/transaction", element: <Transaction /> },
                  {
                    path: "/transaction-canvas",
                    element: <TransactionCanvas />,
                  },
                  {
                    path: "/transaction-pricing-set",
                    element: <TransactionPricingSet />,
                  },
                  {
                    path: "/transaction-pricing",
                    element: <TransactionPricing />,
                  },
                  { path: "/client", element: <Client /> },
                  { path: "/add-bulk-item", element: <AddBulkItem /> },
                  {
                    path: "/transaction-archive",
                    element: <TransactionArchive />,
                  },
                  {
                    path: "/transaction-for-purchase",
                    element: <TransactionForPurchase />,
                  },
                  { path: "/cart", element: <TransactionPurchaseCart /> },
                  { path: "/voucher", element: <TransactionVoucher /> },
                  { path: "/assignee", element: <Assignee /> },
                  { path: "/inventory", element: <Inventory /> },
                  { path: "/journal-account", element: <JournalAccount /> },
                  {
                    path: "/journal-entry-voucher",
                    element: <JournalEntryVoucher />,
                  },
                  // {
                  //   path: "/for-jev",
                  //   element: <ForJev />,
                  // },
                  { path: "/voucher-update", element: <VoucherUpdateView /> },
                  {
                    path: "/purchase-cart-update",
                    element: <PurchaseCartUpdateView />,
                  },
                  {
                    path: "/item-purchasing",
                    element: <ItemPurchasingView />,
                  },
                  {
                    path: "/item-purchasing-update",
                    element: <ItemPurchasingUpdateView />,
                  }

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
                  { path: "/user", element: <User /> },
                  { path: "/company", element: <Company /> },
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
          // ── Finance Officer ──────────────────────────────────────────────
          {
            element: <ProtectedRoute allowedRoles={financeOfficerRoles} />,
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
