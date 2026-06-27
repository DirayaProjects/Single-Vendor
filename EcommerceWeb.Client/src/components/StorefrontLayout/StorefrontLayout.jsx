import React from "react";
import { Outlet, useParams } from "react-router-dom";
import { StorefrontProvider, useStorefront } from "../../contexts/StorefrontContext";
import { CartProvider } from "../../contexts/CartContext";

function StorefrontGate() {
  const { loading, error } = useStorefront();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        Loading store...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div>
          <h2>Store not found</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <CartProvider>
      <Outlet />
    </CartProvider>
  );
}

export default function StorefrontLayout() {
  const { slug } = useParams();

  return (
    <StorefrontProvider slug={slug}>
      <StorefrontGate />
    </StorefrontProvider>
  );
}
