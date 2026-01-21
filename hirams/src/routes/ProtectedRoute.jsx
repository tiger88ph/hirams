import { Outlet, Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = localStorage.getItem("role");
  const location = useLocation();

  // Not logged in → go to index page
  if (!user) return <Navigate to="/index" replace />;

  // If allowedRoles is provided and current role not inside list → deny access
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/index" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
