import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminToken } from "../../services/adminAuth";
import { getSuperAdminToken } from "../../services/superAdminAuth";
import { getUserToken } from "../../services/userAuth";
import "./portalHome.css";

/**
 * Entry when visiting / without ?storeSlug= — staff sign-in and a simple path for shoppers.
 * Shoppers with a store link use /?storeSlug=… and skip this screen.
 */
const PortalHome = () => {
  const navigate = useNavigate();
  const [storeInput, setStoreInput] = useState("");

  useEffect(() => {
    if (getSuperAdminToken()) {
      navigate("/superadmin/dashboard", { replace: true });
      return;
    }
    if (getAdminToken()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const goShop = (slug) => {
    const s = String(slug || "").trim();
    if (!s) return;
    navigate({ pathname: "/", search: `?storeSlug=${encodeURIComponent(s)}` });
  };

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    const s = storeInput.trim();
    if (s) goShop(s);
  };

  return (
    <div className="portal-root">
      <div className="portal-backdrop" aria-hidden />
      <main className="portal-main">
        <header className="portal-brand">
          <h1 className="portal-title">Single Vendor</h1>
          <p className="portal-tagline">Storefront platform — choose how you&apos;re signing in.</p>
        </header>

        <section className="portal-grid" aria-label="Choose an option">
          <article className="portal-card portal-card-customer">
            <h2>Shopping</h2>
            <p className="portal-card-desc">Open a store with its code or name — no account needed to browse.</p>
            <form className="portal-store-form" onSubmit={handleStoreSubmit}>
              <label htmlFor="portal-store-slug" className="portal-label">
                Store code or shop name
              </label>
              <div className="portal-store-row">
                <input
                  id="portal-store-slug"
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. my-boutique"
                  value={storeInput}
                  onChange={(e) => setStoreInput(e.target.value)}
                  className="portal-input"
                />
                <button type="submit" className="portal-btn portal-btn-secondary" disabled={!storeInput.trim()}>
                  Go
                </button>
              </div>
            </form>
            <p className="portal-hint">
              Got a full link from the shop? It already includes <code>?storeSlug=…</code> — open that and you&apos;ll land in the store.
            </p>
          </article>

          <article className="portal-card portal-card-staff">
            <h2>Staff</h2>
            <p className="portal-card-desc">
              Platform owner, store manager, or customer account — one sign-in. Your role decides where you land.
            </p>
            <Link to="/login" className="portal-btn portal-btn-primary">
              Sign in or create account
            </Link>
          </article>
        </section>

        <footer className="portal-foot">
          {getUserToken() && (
            <p className="portal-foot-row">
              <Link to="/account" className="portal-foot-link">
                My account
              </Link>
            </p>
          )}
        </footer>
      </main>
    </div>
  );
};

export default PortalHome;
