import React, { useState } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar"; 
import { 
  FaImage, FaFacebook, FaInstagram, FaPhoneAlt, 
  FaTwitter, FaTiktok, FaSave, FaHeading 
} from "react-icons/fa";
import "./settings.css";

const SettingsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [logoName, setLogoName] = useState("");
  const [logo, setLogo] = useState(null);
  const [banner, setBanner] = useState(null);

  const [socials, setSocials] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
  });

  const [phone, setPhone] = useState("");

  const handleImageUpload = (e, setter) => {
    const file = e.target.files[0];
    if (file) setter(URL.createObjectURL(file));
  };

  const removeImage = (setter) => setter(null);

  return (
    <div className="settings-layout">
      
      {/* Sidebar */}
      <Sidebar onToggle={(open) => setIsSidebarOpen(open)} />

      {/* Page Content */}
      <div className={`settings-content ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <h2 className="page-title">Website Settings</h2>

        {/* LOGO NAME + IMAGE */}
        <div className="settings-card">

          <div className="card-header">
            <h3>Logo + Name</h3>
          </div>

          {/* Logo name input */}
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter logo name"
              value={logoName}
              onChange={(e) => setLogoName(e.target.value)}
            />
          </div>

          {/* Logo image */}
          <div className="card-header small-gap">
            <FaImage className="card-icon" />
            <h4>Logo Image</h4>
          </div>

          {logo ? (
            <>
              <img src={logo} alt="Logo" className="preview-img" />
              <button onClick={() => removeImage(setLogo)} className="delete-btn">
                Delete
              </button>
            </>
          ) : (
            <p className="empty-text">No logo uploaded</p>
          )}

          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogo)} />
        </div>

        {/* BANNER */}
        <div className="settings-card">
          <div className="card-header">
            <FaImage className="card-icon gold" />
            <h3>Banner Image</h3>
          </div>

          {banner ? (
            <>
              <img src={banner} alt="Banner" className="preview-img" />
              <button onClick={() => removeImage(setBanner)} className="delete-btn">Delete</button>
            </>
          ) : (
            <p className="empty-text">No banner uploaded</p>
          )}

          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setBanner)} />
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

        <button className="save-btn">
          <FaSave className="save-icon" /> Save Changes
        </button>

      </div>
    </div>
  );
};

export default SettingsPage;
