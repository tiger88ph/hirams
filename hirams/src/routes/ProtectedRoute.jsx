import { Outlet, Navigate, useLocation } from "react-router-dom";

/**
 * Guards a route tree by login state and optional role allowlist.
 *
 * - Not logged in  → /index
 * - Role not in allowedRoles → /index (preserves `from` for post-login redirect)
 */
export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();

  // Safe parse — a corrupted localStorage value must never crash the app
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch (_) {}

  const role = localStorage.getItem("role");

  if (!user) {
    return <Navigate to="/index" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/index" state={{ from: location }} replace />;
  }

  return <Outlet />;
}