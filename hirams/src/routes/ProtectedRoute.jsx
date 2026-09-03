import { Outlet, Navigate, useLocation } from "react-router-dom";
import { getItem } from "../utils/storage/localStorage";

export default function ProtectedRoute({ allowedRoles }) {
  const location = useLocation();

  const user = getItem("user"); // storage.js already handles parse errors → returns null fallback
  const role = getItem("role");

  if (!user) {
    return <Navigate to="/index" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    return <Navigate to="/index" state={{ from: location }} replace />;
  }

  return <Outlet />;
}