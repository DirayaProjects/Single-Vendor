import { Navigate, Outlet } from "react-router-dom";
import { getSuperAdminToken } from "../../services/superAdminAuth";

export function RequireSuperAdmin() {
  return getSuperAdminToken() ? <Outlet /> : <Navigate to="/login" replace />;
}
