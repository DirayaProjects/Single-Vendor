import React from "react";
import { Navigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import Landing from "./landing/landing";

/**
 * / with ?storeSlug= → storefront home for that tenant.
 * / alone → login page.
 */
export default function RootEntry() {
  const [params] = useSearchParams();
  const raw = params.get("storeSlug")?.trim();
  if (raw) return <Landing />;
  return <Navigate to="/login" replace />;
}
