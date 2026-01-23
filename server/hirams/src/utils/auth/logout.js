import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { createRoot } from "react-dom/client";
import React from "react";
import DotSpinner from "../../components/common/DotSpinner";

/**
 * Reusable logout hook.
 * Clears localStorage and navigates to login page after confirmation.
 */
export const useLogout = () => {
  const navigate = useNavigate();

  const logout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to logout?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, logout",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear all localStorage
        localStorage.clear();

        // Show DotSpinner in SweetAlert
        Swal.fire({
          html: `<div id="spinner-container" style="display:flex; flex-direction:column; align-items:center; gap:10px;">
                    <div id="spinner-root"></div>
                    <span style="font-size:0.85rem;">Logging out...</span>
                 </div>`,
          showConfirmButton: false,
          timer: 1000,
          timerProgressBar: true,
          didOpen: () => {
            const container = document.getElementById("spinner-root");
            if (container) {
              const root = createRoot(container);
              // Use React.createElement instead of JSX
              root.render(React.createElement(DotSpinner, { size: 8 }));
            }
          },
        }).then(() => {
          navigate("/"); // redirect to login/home
        });
      }
    });
  };

  return logout;
};
