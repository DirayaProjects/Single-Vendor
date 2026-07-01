import React, { useEffect, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { StorefrontProvider, useStorefront } from "../../contexts/StorefrontContext";
import { CartProvider } from "../../contexts/CartContext";
import { FavoritesProvider } from "../../contexts/FavoritesContext";
import SpinWheelModal from "../../components/SpinWheel/SpinWheelModal";
import { getAuthSession, AUTH_CHANGED_EVENT } from "../../services/authApi";
import { getSpinWheelStatus } from "../../services/spinWheelApi";

function StorefrontGate() {
  const { slug, loading, error, features } = useStorefront();
  const [showSpin, setShowSpin] = useState(false);
  const [spinUserId, setSpinUserId] = useState(null);

  useEffect(() => {
    const maybeShowSpin = async () => {
      const session = getAuthSession();
      if (!session?.userId || session.isAdmin || !features?.spinWheelEnabled || !features?.spinWheelVisible) {
        return;
      }

      try {
        const status = await getSpinWheelStatus(slug, session.userId);
        if (status.canSpin) {
          setSpinUserId(session.userId);
          setShowSpin(true);
        }
      } catch {
        /* ignore */
      }
    };

    maybeShowSpin();
    window.addEventListener(AUTH_CHANGED_EVENT, maybeShowSpin);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, maybeShowSpin);
  }, [slug, features]);

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
      <FavoritesProvider>
        <Outlet />
        {showSpin && spinUserId && (
          <SpinWheelModal slug={slug} userId={spinUserId} onClose={() => setShowSpin(false)} />
        )}
      </FavoritesProvider>
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
