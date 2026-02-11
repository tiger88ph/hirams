import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { createRoot } from "react-dom/client";
import React from "react";
import DotSpinner from "../../components/common/DotSpinner";
import api from "../../utils/api/api";

export const useLogout = () => {
  const navigate = useNavigate();

  const logout = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      html: `<div id="spinner-container" style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                <div id="spinner-root"></div>
                <span style="font-size:0.85rem;">Logging out...</span>
            </div>`,
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        const container = document.getElementById("spinner-root");
        if (container) {
          const root = createRoot(container);
          root.render(React.createElement(DotSpinner, { size: 8 }));
        }
      },
    });

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user.nUserId) throw new Error("User ID not found");

      await api.post("logout", { nUserId: user.nUserId });

      // Clear localStorage & sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // Clear all caches (CSS/JS/Service Workers)
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }

      // Clear cookies
      document.cookie
        .split(";")
        .forEach(
          (c) =>
            (document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`))
        );

      Swal.close();

      // Force full reload to reset all in-memory React state & CSS
      window.location.href = "/"; // or window.location.reload();

    } catch (error) {
      console.error("Logout failed:", error);
      Swal.fire("Error", "Failed to logout. Please try again.", "error");
    }
  };

  return logout;
};
