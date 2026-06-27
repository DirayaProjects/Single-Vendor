import React from "react";
import { FaFacebook, FaInstagram, FaTwitter, FaTiktok, FaPhoneAlt } from "react-icons/fa";
import "./footer.css";
import { useStorefront } from "../../contexts/StorefrontContext";

const Footer = () => {
  const { settings } = useStorefront();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-left">
        <h4>{settings?.logoName || "Website"}</h4>
        <p>copyright © {year}</p>
        {settings?.phone && (
          <p className="footer-phone">
            <FaPhoneAlt /> {settings.phone}
          </p>
        )}
      </div>
      <div className="footer-right">
        <p>Follow Us</p>
        <div className="social-icons">
          {settings?.facebook && (
            <a href={settings.facebook} target="_blank" rel="noreferrer"><FaFacebook /></a>
          )}
          {settings?.instagram && (
            <a href={settings.instagram} target="_blank" rel="noreferrer"><FaInstagram /></a>
          )}
          {settings?.twitter && (
            <a href={settings.twitter} target="_blank" rel="noreferrer"><FaTwitter /></a>
          )}
          {settings?.tiktok && (
            <a href={settings.tiktok} target="_blank" rel="noreferrer"><FaTiktok /></a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
