import React, { useMemo } from "react";
import "./footer.css";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";

const Footer = () => {
  const { settings } = useStorefrontSettings();
  const phone = settings?.phone || "";
  const socials = useMemo(
    () => ({
      facebookUrl: settings?.facebookUrl || "",
      instagramUrl: settings?.instagramUrl || "",
      twitterUrl: settings?.twitterUrl || "",
      tiktokUrl: settings?.tiktokUrl || "",
    }),
    [settings]
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
              <span className="footer-phone">{phone}</span>
            </>
          ) : null}
        </p>
      </div>
      <div className="footer-right">
        <p>Follow Us</p>
        <div className="social-icons">
          <a
            href="https://www.youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="social-icon-link"
            aria-label="YouTube"
          >
            <i className="fab fa-youtube" />
          </a>
          <a
            href={socials.facebookUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-icon-link${socials.facebookUrl ? "" : " social-icon-link--muted"}`}
            aria-label="Facebook"
            onClick={(e) => {
              if (!socials.facebookUrl) e.preventDefault();
            }}
          >
            <i className="fab fa-facebook" />
          </a>
          <a
            href={socials.instagramUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-icon-link${socials.instagramUrl ? "" : " social-icon-link--muted"}`}
            aria-label="Instagram"
            onClick={(e) => {
              if (!socials.instagramUrl) e.preventDefault();
            }}
          >
            <i className="fab fa-instagram" />
          </a>
          <a
            href={socials.twitterUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-icon-link${socials.twitterUrl ? "" : " social-icon-link--muted"}`}
            aria-label="Twitter / X"
            onClick={(e) => {
              if (!socials.twitterUrl) e.preventDefault();
            }}
          >
            <i className="fab fa-twitter" />
          </a>
          <a
            href={socials.tiktokUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-icon-link${socials.tiktokUrl ? "" : " social-icon-link--muted"}`}
            aria-label="TikTok"
            onClick={(e) => {
              if (!socials.tiktokUrl) e.preventDefault();
            }}
          >
            <i className="fab fa-tiktok" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
