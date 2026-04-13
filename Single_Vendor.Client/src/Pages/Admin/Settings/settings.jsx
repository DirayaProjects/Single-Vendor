import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import {
  FaImage,
  FaFacebook,
  FaInstagram,
  FaPhoneAlt,
  FaTwitter,
  FaTiktok,
  FaSave,
  FaLink,
  FaCopy,
  FaBullhorn,
} from "react-icons/fa";
import { adminApi, adminUploadStoreImage } from "../../../services/adminApi";
import { getApiBase } from "../../../services/apiConfig";
import { useAdminStore } from "../../../contexts/AdminStoreContext";
import "./settings.css";

const PLACEHOLDER = "https://via.placeholder.com/320x120?text=No+image";
const HEX6 = /^#[0-9A-Fa-f]{6}$/;

function resolveAssetUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) {
    const base = getApiBase() || (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}${url}`;
  }
  return url;
}

function hexForPicker(hex) {
  return HEX6.test(hex || "") ? hex : "#000000";
}

const SettingsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageUploadError, setImageUploadError] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingPromoSlot, setUploadingPromoSlot] = useState(null);

  const [publicStoreSlug, setPublicStoreSlug] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  const [logoName, setLogoName] = useState("");
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
  });

  const [phone, setPhone] = useState("");

  const [promoSlots, setPromoSlots] = useState([]);
  const [promoMsg, setPromoMsg] = useState("");
  const [promoSaving, setPromoSaving] = useState(false);

  const [theme, setTheme] = useState({
    primaryColorHex: "",
    secondaryColorHex: "",
    accentColorHex: "",
    bodyBackgroundHex: "",
    headerBackgroundHex: "",
    footerBackgroundHex: "",
    buttonColorHex: "",
    linkColorHex: "",
  });
  const { features } = useAdminStore();
  const promoEnabled = !!features.promoAdsSection;

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [data, promos] = await Promise.all([
        adminApi("/api/admin/store"),
        promoEnabled ? adminApi("/api/admin/store/promo-ads").catch(() => []) : Promise.resolve([]),
      ]);
      setPublicStoreSlug(data.publicStoreSlug || "");
      setLogoName(data.storeDisplayName || "");
      setLogoPreview(data.logoUrl || null);
      setBannerPreview(data.bannerUrl || null);
      setSocials({
        facebook: data.facebookUrl || "",
        instagram: data.instagramUrl || "",
        twitter: data.twitterUrl || "",
        tiktok: data.tiktokUrl || "",
      });
      setPhone(data.phone || "");
      setTheme({
        primaryColorHex: data.primaryColorHex || "",
        secondaryColorHex: data.secondaryColorHex || "",
        accentColorHex: data.accentColorHex || "",
        bodyBackgroundHex: data.bodyBackgroundHex || "",
        headerBackgroundHex: data.headerBackgroundHex || "",
        footerBackgroundHex: data.footerBackgroundHex || "",
        buttonColorHex: data.buttonColorHex || "",
        linkColorHex: data.linkColorHex || "",
      });
      if (promoEnabled) {
        const slots = Array.isArray(promos) ? promos.slice().sort((a, b) => a.slotIndex - b.slotIndex) : [];
        setPromoSlots(
          slots.length
            ? slots.map((s) => ({
                slotIndex: s.slotIndex,
                titleLine: s.titleLine || "",
                bigText: s.bigText || "",
                subLine: s.subLine || "",
                linkUrl: s.linkUrl || "",
                imageUrl: s.imageUrl || "",
                isActive: s.isActive !== false,
              }))
            : [
                { slotIndex: 1, titleLine: "", bigText: "", subLine: "", linkUrl: "", imageUrl: "", isActive: true },
                { slotIndex: 2, titleLine: "", bigText: "", subLine: "", linkUrl: "", imageUrl: "", isActive: true },
                { slotIndex: 3, titleLine: "", bigText: "", subLine: "", linkUrl: "", imageUrl: "", isActive: true },
              ]
        );
      } else {
        setPromoSlots([]);
      }
    } catch (e) {
      setError(e.message || "Could not load store settings. Sign in at Admin → Sign in.");
    } finally {
      setLoading(false);
    }
  }, [promoEnabled]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePromoImageFile = async (e, slotIndex) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageUploadError("");
    setUploadingPromoSlot(slotIndex);
    try {
      const url = await adminUploadStoreImage(file);
      updatePromoField(slotIndex, "imageUrl", url);
    } catch (err) {
      setImageUploadError(err.message || "Promo image upload failed.");
    } finally {
      setUploadingPromoSlot(null);
    }
  };

  const handleStoreImageFile = async (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageUploadError("");
    const setBusy = kind === "logo" ? setUploadingLogo : setUploadingBanner;
    const setter = kind === "logo" ? setLogoPreview : setBannerPreview;
    setBusy(true);
    try {
      const url = await adminUploadStoreImage(file);
      setter(url);
    } catch (err) {
      setImageUploadError(err.message || "Image upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const removeImage = (setter) => setter(null);

  const updatePromoField = (slotIndex, field, value) => {
    setPromoSlots((rows) => rows.map((r) => (r.slotIndex === slotIndex ? { ...r, [field]: value } : r)));
  };

  const handleSavePromoAds = async () => {
    setPromoMsg("");
    setPromoSaving(true);
    try {
      await adminApi("/api/admin/store/promo-ads", {
        method: "PUT",
        json: {
          slots: promoSlots.map((s) => ({
            slotIndex: s.slotIndex,
            titleLine: s.titleLine || null,
            bigText: s.bigText || null,
            subLine: s.subLine || null,
            linkUrl: s.linkUrl?.trim() || null,
            imageUrl: s.imageUrl?.trim() || null,
            isActive: !!s.isActive,
          })),
        },
      });
      setPromoMsg("Landing promo ads saved.");
    } catch (e) {
      setPromoMsg(e.message || "Could not save promo ads.");
    } finally {
      setPromoSaving(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      if (logoPreview?.startsWith?.("blob:") || bannerPreview?.startsWith?.("blob:")) {
        setError("Wait for image upload to finish, or choose a file again.");
        setSaving(false);
        return;
      }

      const logoUrl = logoPreview || null;
      const bannerUrl = bannerPreview || null;

      await adminApi("/api/admin/store", {
        method: "PUT",
        json: {
          storeDisplayName: logoName || null,
          logoUrl: logoUrl || null,
          bannerUrl: bannerUrl || null,
          facebookUrl: socials.facebook || null,
          instagramUrl: socials.instagram || null,
          twitterUrl: socials.twitter || null,
          tiktokUrl: socials.tiktok || null,
          phone: phone || null,
          primaryColorHex: theme.primaryColorHex || null,
          secondaryColorHex: theme.secondaryColorHex || null,
          accentColorHex: theme.accentColorHex || null,
          bodyBackgroundHex: theme.bodyBackgroundHex || null,
          headerBackgroundHex: theme.headerBackgroundHex || null,
          footerBackgroundHex: theme.footerBackgroundHex || null,
          buttonColorHex: theme.buttonColorHex || null,
          linkColorHex: theme.linkColorHex || null,
        },
      });
      await load();
      alert("Saved.");
    } catch (e) {
      setError(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const shopOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl =
    publicStoreSlug && shopOrigin ? `${shopOrigin}/?storeSlug=${encodeURIComponent(publicStoreSlug)}` : "";

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyFeedback("Copied.");
      setTimeout(() => setCopyFeedback(""), 2000);
    } catch {
      setCopyFeedback("Copy failed — select the link and copy manually.");
      setTimeout(() => setCopyFeedback(""), 4000);
    }
  };

  return (
    <div className="settings-layout">
      <Sidebar onToggle={(open) => setIsSidebarOpen(open)} />

      <div className={`settings-content ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <h2 className="page-title">Website Settings</h2>
        <p className="settings-sub">
          Branding for <strong>your</strong> store (name, images, theme colors, contact). Logo and banner files are uploaded
          to the server so the link stays short (stored URLs are limited to 1000 characters).
        </p>

        {loading && <p>Loading…</p>}
        {error && <div className="settings-banner-error">{error}</div>}
        {imageUploadError && <div className="settings-banner-error">{imageUploadError}</div>}

        {/* SHAREABLE STORE LINK */}
        <div className="settings-card settings-card-share">
          <div className="card-header">
            <FaLink className="card-icon gold" />
            <h3>Share your store</h3>
          </div>
          <p className="empty-text" style={{ marginBottom: 12 }}>
            Customers open your shop using the <strong>store slug</strong> in the URL. Share this link on social media or
            messages — it loads <em>your</em> catalog and branding (same as <code>?storeSlug=…</code> on the storefront API).
          </p>
          {shareUrl ? (
            <div className="share-link-row">
              <input type="text" className="share-link-input" readOnly value={shareUrl} aria-label="Shareable store URL" />
              <button type="button" className="share-copy-btn" onClick={copyShareLink}>
                <FaCopy /> {copyFeedback || "Copy"}
              </button>
            </div>
          ) : (
            <p className="empty-text">
              No public slug is linked to this admin account. Ask a super admin to confirm your store&apos;s{" "}
              <strong>public slug</strong> in Store admins.
            </p>
          )}
        </div>

        {/* LOGO NAME + IMAGE */}
        <div className="settings-card">
          <div className="card-header">
            <h3>Logo + Name</h3>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Store display name"
              value={logoName}
              onChange={(e) => setLogoName(e.target.value)}
            />
          </div>

          <div className="card-header small-gap">
            <FaImage className="card-icon" />
            <h4>Logo Image</h4>
          </div>

          {logoPreview ? (
            <>
              <img
                src={resolveAssetUrl(logoPreview)}
                alt="Logo"
                className="preview-img"
                onError={(e) => {
                  e.target.src = PLACEHOLDER;
                }}
              />
              <button type="button" onClick={() => removeImage(setLogoPreview)} className="delete-btn">
                Remove
              </button>
            </>
          ) : (
            <p className="empty-text">No logo</p>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={uploadingLogo || saving}
            onChange={(e) => handleStoreImageFile(e, "logo")}
          />
          {uploadingLogo && <p className="empty-text">Uploading logo…</p>}
          <p className="empty-text" style={{ marginTop: 8 }}>
            After the file uploads, click <strong>Save Changes</strong> at the bottom to store it on your store.
          </p>
        </div>

        {/* BANNER */}
        <div className="settings-card">
          <div className="card-header">
            <FaImage className="card-icon gold" />
            <h3>Banner Image</h3>
          </div>

          {bannerPreview ? (
            <>
              <img
                src={resolveAssetUrl(bannerPreview)}
                alt="Banner"
                className="preview-img banner-preview"
                onError={(e) => {
                  e.target.src = PLACEHOLDER;
                }}
              />
              <button type="button" onClick={() => removeImage(setBannerPreview)} className="delete-btn">
                Remove
              </button>
            </>
          ) : (
            <p className="empty-text">No banner</p>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={uploadingBanner || saving}
            onChange={(e) => handleStoreImageFile(e, "banner")}
          />
          {uploadingBanner && <p className="empty-text">Uploading banner…</p>}
          <p className="empty-text" style={{ marginTop: 8 }}>
            Then use <strong>Save Changes</strong> below to keep the banner on your store.
          </p>
        </div>

        {/* SOCIAL MEDIA */}
        <div className="settings-card">
          <div className="card-header">
            <FaFacebook className="card-icon gold" />
            <h3>Social Media Accounts</h3>
          </div>

          <div className="social-list">
            <div className="input-group">
              <FaFacebook className="input-icon gold" />
              <input
                type="text"
                placeholder="Facebook Link"
                value={socials.facebook}
                onChange={(e) => setSocials({ ...socials, facebook: e.target.value })}
              />
            </div>

            <div className="input-group">
              <FaInstagram className="input-icon gold" />
              <input
                type="text"
                placeholder="Instagram Link"
                value={socials.instagram}
                onChange={(e) => setSocials({ ...socials, instagram: e.target.value })}
              />
            </div>

            <div className="input-group">
              <FaTwitter className="input-icon gold" />
              <input
                type="text"
                placeholder="Twitter Link"
                value={socials.twitter}
                onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
              />
            </div>

            <div className="input-group">
              <FaTiktok className="input-icon gold" />
              <input
                type="text"
                placeholder="TikTok Link"
                value={socials.tiktok}
                onChange={(e) => setSocials({ ...socials, tiktok: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* LANDING PROMO ADS (3 cards) */}
        {promoEnabled ? (<div className="settings-card">
          <div className="card-header">
            <FaBullhorn className="card-icon gold" />
            <h3>Landing promo ads</h3>
          </div>
          <p className="empty-text" style={{ marginBottom: 16 }}>
            Three deal cards on the storefront home (when <strong>Promo / sale spotlight</strong> is enabled). Upload an
            image for each card below. Optional link URL must start with <code>http://</code> or <code>https://</code> to
            be clickable on the site.
          </p>
          {promoMsg && (
            <p className={promoMsg.includes("saved") ? "empty-text" : "settings-banner-error"} style={{ marginBottom: 12 }}>
              {promoMsg}
            </p>
          )}
          <div className="promo-slots-editor">
            {promoSlots.map((slot) => (
              <div key={slot.slotIndex} className="promo-slot-card">
                <h4 className="promo-slot-title">Card {slot.slotIndex}</h4>
                <label className="promo-slot-check">
                  <input
                    type="checkbox"
                    checked={!!slot.isActive}
                    onChange={(e) => updatePromoField(slot.slotIndex, "isActive", e.target.checked)}
                  />
                  <span>Active on storefront</span>
                </label>
                <div className="input-group" style={{ marginTop: 8 }}>
                  <input
                    type="text"
                    placeholder="Top line (e.g. SALE UP TO)"
                    value={slot.titleLine}
                    onChange={(e) => updatePromoField(slot.slotIndex, "titleLine", e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Big text (e.g. 50%)"
                    value={slot.bigText}
                    onChange={(e) => updatePromoField(slot.slotIndex, "bigText", e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Sub line (e.g. OFF)"
                    value={slot.subLine}
                    onChange={(e) => updatePromoField(slot.slotIndex, "subLine", e.target.value)}
                  />
                </div>
                <div className="promo-image-row">
                  {slot.imageUrl ? (
                    <img
                      src={resolveAssetUrl(slot.imageUrl)}
                      alt=""
                      className="preview-img"
                      style={{ maxHeight: 100, objectFit: "cover", borderRadius: 8 }}
                      onError={(e) => {
                        e.target.src = PLACEHOLDER;
                      }}
                    />
                  ) : (
                    <p className="empty-text">No promo image</p>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={!!uploadingPromoSlot || promoSaving || loading}
                    onChange={(e) => handlePromoImageFile(e, slot.slotIndex)}
                  />
                  {uploadingPromoSlot === slot.slotIndex && <p className="empty-text">Uploading…</p>}
                  {slot.imageUrl ? (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => updatePromoField(slot.slotIndex, "imageUrl", "")}
                    >
                      Remove image
                    </button>
                  ) : null}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Link URL — optional, https://…"
                    value={slot.linkUrl}
                    onChange={(e) => updatePromoField(slot.slotIndex, "linkUrl", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <button type="button" className="save-btn" style={{ marginTop: 16 }} onClick={handleSavePromoAds} disabled={promoSaving || loading}>
            <FaSave className="save-icon" /> {promoSaving ? "Saving promos…" : "Save promo ads"}
          </button>
        </div>) : null}

        {/* THEME COLORS */}
        <div className="settings-card">
          <div className="card-header">
            <h3>Site colors</h3>
          </div>
          <p className="empty-text" style={{ marginBottom: 12 }}>
            Pick a color or type a hex value (e.g. <code>#2563eb</code>). Leave a field empty to clear. Used when the
            storefront loads your store settings.
          </p>
          <div className="social-list">
            {[
              ["primaryColorHex", "Primary"],
              ["secondaryColorHex", "Secondary"],
              ["accentColorHex", "Accent"],
              ["bodyBackgroundHex", "Page background"],
              ["headerBackgroundHex", "Header"],
              ["footerBackgroundHex", "Footer"],
              ["buttonColorHex", "Buttons"],
              ["linkColorHex", "Links"],
            ].map(([key, label]) => (
              <div className="color-row" key={key}>
                <label className="color-row-label">{label}</label>
                <input
                  type="color"
                  className="color-picker"
                  value={hexForPicker(theme[key])}
                  onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                  aria-label={`${label} color`}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  placeholder="#rrggbb or empty"
                  value={theme[key] || ""}
                  onChange={(e) => setTheme({ ...theme, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* PHONE NUMBER */}
        <div className="settings-card">
          <div className="card-header">
            <FaPhoneAlt className="card-icon gold" />
            <h3>Contact Phone</h3>
          </div>

          <div className="input-group">
            <FaPhoneAlt className="input-icon gold" />
            <input
              type="text"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <button type="button" className="save-btn" onClick={handleSave} disabled={saving || loading}>
          <FaSave className="save-icon" /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
