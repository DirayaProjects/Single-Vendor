import React, { useMemo } from "react";
import "./footer.css";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import { FaFacebookF, FaInstagram, FaTwitter, FaTiktok, FaWhatsapp, FaRegCopy } from "react-icons/fa";

const Footer = () => {
  const { settings } = useStorefrontSettings();
  const phone = (settings?.phone || "").trim();
  const [copyFeedback, setCopyFeedback] = React.useState("");

  const normalizeSocialUrl = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  };

  const phoneDigits = phone.replace(/[^\d+]/g, "");
  const whatsappHref = phoneDigits ? `https://wa.me/${phoneDigits.replace(/[^\d]/g, "")}` : "";

  const copyPhone = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopyFeedback("Copied");
      setTimeout(() => setCopyFeedback(""), 1800);
    } catch {
      setCopyFeedback("Copy failed");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  const socials = useMemo(
    () => ({
      facebookUrl: normalizeSocialUrl(settings?.facebookUrl),
      instagramUrl: normalizeSocialUrl(settings?.instagramUrl),
      twitterUrl: normalizeSocialUrl(settings?.twitterUrl),
      tiktokUrl: normalizeSocialUrl(settings?.tiktokUrl),
    }),
    [settings?.facebookUrl, settings?.instagramUrl, settings?.twitterUrl, settings?.tiktokUrl]
  );
  const socialLinks = useMemo(
    () =>
      [
        { href: socials.facebookUrl, label: "Facebook", icon: <FaFacebookF /> },
        { href: socials.instagramUrl, label: "Instagram", icon: <FaInstagram /> },
        { href: socials.twitterUrl, label: "Twitter / X", icon: <FaTwitter /> },
        { href: socials.tiktokUrl, label: "TikTok", icon: <FaTiktok /> },
      ].filter((item) => !!item.href),
    [socials.facebookUrl, socials.instagramUrl, socials.twitterUrl, socials.tiktokUrl]
  );

  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-left">
        <h4>Website</h4>
        <p>
          copyright © {year}
          {phone ? (
            <>
              <span className="footer-dot"> · </span>
              <a
                className="footer-phone footer-whatsapp-link"
                href={whatsappHref || undefined}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!whatsappHref) e.preventDefault();
                }}
                aria-label="Chat on WhatsApp"
                title={whatsappHref ? "Open WhatsApp chat" : "Phone"}
              >
                <FaWhatsapp />
                <span>{phone}</span>
              </a>
              <button type="button" className="footer-copy-btn" onClick={copyPhone} aria-label="Copy phone number">
                <FaRegCopy />
                <span>{copyFeedback || "Copy"}</span>
              </button>
            </>
          ) : null}
        </p>
      </div>
      {socialLinks.length > 0 ? (
        <div className="footer-right">
          <p>Follow Us</p>
          <div className="social-icons">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-link"
                aria-label={item.label}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </footer>
  );
};

export default Footer;
