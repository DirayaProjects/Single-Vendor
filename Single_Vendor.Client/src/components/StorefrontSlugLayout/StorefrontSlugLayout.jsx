import React from "react";
import { Navigate, Outlet, useSearchParams } from "react-router-dom";

/** Storefront catalog routes require ?storeSlug= so tenants are explicit (no default store). */
export default function StorefrontSlugLayout() {
  const [params] = useSearchParams();
  if (!params.get("storeSlug")?.trim()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
