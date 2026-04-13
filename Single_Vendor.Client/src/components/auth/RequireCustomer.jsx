import { Navigate, Outlet } from "react-router-dom";
import { getUserToken } from "../../services/userAuth";

export function RequireCustomer() {
  return getUserToken() ? <Outlet /> : <Navigate to="/" replace />;
}
