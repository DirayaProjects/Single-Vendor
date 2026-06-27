import React, { useEffect, useState } from "react";
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
} from "react-icons/fa";
import { getSettings, updateSettings } from "../../../services/settingsApi";
import { uploadImage } from "../../../services/uploadApi";
import "./settings.css";

const SettingsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [logoName, setLogoName] = useState("");
  const [logo, setLogo] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [banner, setBanner] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
  });

  const [phone, setPhone] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getSettings();
        setLogoName(data.logoName || "");
        setLogo(data.logo || null);
        setLogoFile(null);
        setBanner(data.banner || null);
        setBannerFile(null);
        setPhone(data.phone || "");
        setShopSlug(data.slug || "");
        setSocials({
          facebook: data.facebook || "",
          instagram: data.instagram || "",
          twitter: data.twitter || "",
          tiktok: data.tiktok || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleImageUpload = (e, setPreview, setFile) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = (setPreview, setFile) => {
    setPreview(null);
    setFile(null);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      let logoUrl = logo?.startsWith("/uploads/") || logo?.startsWith("http") ? logo : null;
      let bannerUrl = banner?.startsWith("/uploads/") || banner?.startsWith("http") ? banner : null;

      if (logoFile) {
        const uploaded = await uploadImage(logoFile, "settings");
        logoUrl = uploaded.mediumUrl;
        setLogo(logoUrl);
        setLogoFile(null);
      }

      if (bannerFile) {
        const uploaded = await uploadImage(bannerFile, "settings");
        bannerUrl = uploaded.mediumUrl;
        setBanner(bannerUrl);
        setBannerFile(null);
      }

      await updateSettings({
        logoName,
        logo: logoUrl,
        banner: bannerUrl,
        phone,
        facebook: socials.facebook,
        instagram: socials.instagram,
        twitter: socials.twitter,
        tiktok: socials.tiktok,
      });
      const refreshed = await getSettings();
      setShopSlug(refreshed.slug || "");
      setMessage("Settings saved successfully.");
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const shareUrl = shopSlug ? `${window.location.origin}/s/${shopSlug}` : "";

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyMessage("Link copied!");
      setTimeout(() => setCopyMessage(""), 2000);
    } catch {
      setCopyMessage("Could not copy link");
    }
  };

  return (
    <div className="settings-layout">
      <Sidebar onToggle={(open) => setIsSidebarOpen(open)} />

      <div className={`settings-content ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <h2 className="page-title">Website Settings</h2>

        {loading && <p>Loading settings...</p>}
        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}

        {!loading && (
          <>
            <div className="settings-card share-card">
              <div className="card-header">
                <FaLink className="card-icon gold" />
                <h3>Shop link (share with customers)</h3>
              </div>
              <p className="share-help">
                Your shop slug is generated from the <strong>Logo name</strong> below. Save settings after changing the name to update the link.
              </p>
              {shopSlug ? (
                <>
                  <p className="share-slug-label">Slug: <code>{shopSlug}</code></p>
                  <div className="share-url-row">
                    <input type="text" readOnly value={shareUrl} className="share-url-input" />
                    <button type="button" className="copy-btn" onClick={copyShareLink}>
                      <FaCopy /> Copy
                    </button>
                  </div>
                  {copyMessage && <p className="success-text">{copyMessage}</p>}
                </>
              ) : (
                <p className="empty-text">Set a logo name and save settings to generate your shop link.</p>
              )}
            </div>

            <div className="settings-card">
              <div className="card-header">
                <h3>Logo + Name</h3>
              </div>

              <div className="input-group">
                <input
                  type="text"
                  placeholder="Enter logo name"
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                />
              </div>

              <div className="card-header small-gap">
                <FaImage className="card-icon" />
                <h4>Logo Image</h4>
              </div>

              {logo ? (
                <>
                  <img src={logo} alt="Logo" className="preview-img" />
                  <button onClick={() => removeImage(setLogo, setLogoFile)} className="delete-btn">
                    Delete
                  </button>
                </>
              ) : (
                <p className="empty-text">No logo uploaded</p>
              )}

              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogo, setLogoFile)} />
            </div>

            <div className="settings-card">
              <div className="card-header">
                <FaImage className="card-icon gold" />
                <h3>Banner Image</h3>
              </div>

              {banner ? (
                <>
                  <img src={banner} alt="Banner" className="preview-img" />
                  <button onClick={() => removeImage(setBanner, setBannerFile)} className="delete-btn">Delete</button>
                </>
              ) : (
                <p className="empty-text">No banner uploaded</p>
              )}

              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBanner, setBannerFile)} />
            </div>

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

            <button className="save-btn" onClick={handleSave} disabled={saving}>
              <FaSave className="save-icon" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
