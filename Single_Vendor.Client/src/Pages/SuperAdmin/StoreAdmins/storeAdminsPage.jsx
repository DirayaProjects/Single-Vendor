import React, { useState, useEffect, useCallback } from "react";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar/SuperAdminSidebar";
import { superAdminApi } from "../../../services/superAdminApi";
import "../superAdminLayout.css";
import "./storeAdminsPage.css";

const emptyFeatures = {
  productRatingStars: false,
  customerProductReviews: false,
  storefrontTestimonials: false,
  promoAdsSection: false,
  adminSalesAnalytics: false,
  adminOrders: false,
  storefrontCartCheckout: false,
  wishlistFavorites: false,
  adminAttributes: false,
};

const featureFields = [
  { key: "productRatingStars", label: "Product rating stars (storefront)" },
  { key: "customerProductReviews", label: "Customer reviews & ratings (submit + APIs)" },
  { key: "storefrontTestimonials", label: "Testimonials section (landing)" },
  { key: "promoAdsSection", label: "Promo / sale spotlight cards (landing)" },
  { key: "adminSalesAnalytics", label: "Admin sales analytics (dashboard charts & revenue)" },
  { key: "adminOrders", label: "Admin orders module" },
  { key: "storefrontCartCheckout", label: "Storefront cart & checkout" },
  { key: "wishlistFavorites", label: "Wishlist / favorites (heart UI)" },
  { key: "adminAttributes", label: "Admin attributes" },
];

const StoreAdminsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [admins, setAdmins] = useState([]);
  const [listError, setListError] = useState("");
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [features, setFeatures] = useState(() => ({ ...emptyFeatures }));
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editFeatures, setEditFeatures] = useState(() => ({ ...emptyFeatures }));
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setListError("");
    setLoading(true);
    try {
      const list = await superAdminApi("/api/superadmin/admins");
      setAdmins(Array.isArray(list) ? list : []);
    } catch (e) {
      setAdmins([]);
      setListError(e.message || "Could not load store admins.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);
    try {
      await superAdminApi("/api/superadmin/admins", {
        method: "POST",
        json: {
          email: email.trim(),
          password,
          publicSlug: publicSlug.trim(),
          displayName: displayName.trim() || null,
          features: { ...features },
        },
      });
      setEmail("");
      setPassword("");
      setPublicSlug("");
      setDisplayName("");
      setFeatures({ ...emptyFeatures });
      await load();
    } catch (err) {
      setFormError(err.message || "Could not create admin.");
    } finally {
      setCreating(false);
    }
  };

  const setAllFeatures = (value) => {
    const next = {};
    featureFields.forEach(({ key }) => {
      next[key] = !!value;
    });
    setFeatures(next);
  };

  const setAllEditFeatures = (value) => {
    const next = {};
    featureFields.forEach(({ key }) => {
      next[key] = !!value;
    });
    setEditFeatures(next);
  };

  const beginEdit = (admin) => {
    setEditingId(admin.id);
    setEditSlug(admin.publicSlug || "");
    setEditDisplayName(admin.storeDisplayName || "");
    setEditFeatures({ ...emptyFeatures, ...(admin.features || {}) });
    setFormError("");
  };

  const cancelEdit = () => {
    setEditingId("");
    setEditSlug("");
    setEditDisplayName("");
    setEditFeatures({ ...emptyFeatures });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setFormError("");
    setSavingEdit(true);
    try {
      await superAdminApi(`/api/superadmin/admins/${editingId}`, {
        method: "PUT",
        json: {
          publicSlug: editSlug.trim(),
          displayName: editDisplayName.trim() || null,
          features: { ...editFeatures },
        },
      });
      await load();
      cancelEdit();
    } catch (err) {
      setFormError(err.message || "Could not update store admin.");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div>
      <SuperAdminSidebar onToggle={setSidebarOpen} />
      <div className={`superadmin-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <h1 className="store-admins-title">Store admins</h1>
        <p className="store-admins-lead">
          Each admin gets their own <strong>store</strong> and public <strong>slug</strong> (share link:
          <code> ?storeSlug=…</code> on the shop). They use <strong>/login</strong> for the dashboard. Passwords must
          meet Identity policy.
        </p>

        <div className="store-admins-panel">
          <h2>Create store admin</h2>
          <form className="store-admins-form" onSubmit={handleCreate}>
            <label>
              Email
              <input
                type="email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Initial password
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label>
              Public store slug
              <input
                type="text"
                placeholder="e.g. acme-boutique"
                value={publicSlug}
                onChange={(e) => setPublicSlug(e.target.value)}
                required
              />
            </label>
            <label>
              Store display name (optional)
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Shown on storefront"
              />
            </label>
            <fieldset className="store-admins-features">
              <legend>Store features (unchecked = hidden / disabled)</legend>
              <p className="store-admins-features-hint">
                Only checked capabilities are enabled for this store. Omitting the whole list (API) still enables
                everything for backward compatibility; this form always sends an explicit list.
              </p>
              <div className="store-admins-features-grid">
                {featureFields.map(({ key, label }) => (
                  <label key={key} className="store-admins-feature-row">
                    <input
                      type="checkbox"
                      checked={!!features[key]}
                      onChange={() => setFeatures((f) => ({ ...f, [key]: !f[key] }))}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
              <div className="store-admins-features-actions">
                <button type="button" onClick={() => setAllFeatures(true)}>
                  Select all
                </button>
                <button type="button" onClick={() => setAllFeatures(false)}>
                  Clear all
                </button>
              </div>
            </fieldset>
            <button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create admin"}
            </button>
          </form>
          {formError && <p className="store-admins-error">{formError}</p>}
        </div>

        <div className="store-admins-refresh">
          <button type="button" onClick={() => load()}>
            Refresh list
          </button>
        </div>
        {listError && <div className="store-admins-error">{listError}</div>}
        {loading && <p>Loading…</p>}

        <div className="store-admins-table-wrap">
          <table className="store-admins-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Store slug</th>
                <th>Store name</th>
                <th>Email confirmed</th>
                <th>Lockout</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.email || a.userName || a.id}</td>
                  <td>
                    <code>{a.publicSlug || "—"}</code>
                  </td>
                  <td>{a.storeDisplayName || "—"}</td>
                  <td>
                    <span className={`store-admins-badge ${a.emailConfirmed ? "ok" : "warn"}`}>
                      {a.emailConfirmed ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    {a.lockoutEnd ? (
                      <span className="store-admins-badge warn">Locked</span>
                    ) : (
                      <span className="store-admins-badge ok">Active</span>
                    )}
                  </td>
                  <td>
                    <button type="button" className="store-admins-row-btn" onClick={() => beginEdit(a)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {editingId && (
                <tr>
                  <td colSpan={6}>
                    <div className="store-admins-edit-box">
                      <h3>Edit store admin</h3>
                      <div className="store-admins-edit-grid">
                        <label>
                          Public store slug
                          <input type="text" value={editSlug} onChange={(e) => setEditSlug(e.target.value)} />
                        </label>
                        <label>
                          Store display name
                          <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} />
                        </label>
                      </div>
                      <fieldset className="store-admins-features">
                        <legend>Features</legend>
                        <div className="store-admins-features-grid">
                          {featureFields.map(({ key, label }) => (
                            <label key={`edit-${key}`} className="store-admins-feature-row">
                              <input
                                type="checkbox"
                                checked={!!editFeatures[key]}
                                onChange={() => setEditFeatures((f) => ({ ...f, [key]: !f[key] }))}
                              />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        <div className="store-admins-features-actions">
                          <button type="button" onClick={() => setAllEditFeatures(true)}>
                            Select all
                          </button>
                          <button type="button" onClick={() => setAllEditFeatures(false)}>
                            Clear all
                          </button>
                        </div>
                      </fieldset>
                      <div className="store-admins-edit-actions">
                        <button type="button" onClick={saveEdit} disabled={savingEdit}>
                          {savingEdit ? "Saving…" : "Save changes"}
                        </button>
                        <button type="button" onClick={cancelEdit} disabled={savingEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && admins.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#666" }}>
                    No store admins yet. Create one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StoreAdminsPage;
