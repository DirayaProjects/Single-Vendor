import { Navigate, Outlet } from "react-router-dom";
import { getAdminToken } from "../../services/adminAuth";

export function RequireAdmin() {
  return getAdminToken() ? <Outlet /> : <Navigate to="/login" replace />;
}
