import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import { setUserToken } from "../../services/userAuth";
import { clearAdminToken } from "../../services/adminAuth";
import { clearSuperAdminToken } from "../../services/superAdminAuth";

/** Default palette (matches pre-theme storefront). */
const DEFAULTS = {
  "--store-primary": "#102542",
  "--store-header-bg": "#0f223d",
  "--store-body-bg": "#f9f9f9",
  "--store-footer-bg": "#0f223d",
  "--store-button": "#0f223d",
  "--store-accent": "#ff6b6b",
  "--store-secondary": "#303030",
  "--store-link": "#5f9ea0",
};

function normalizeHex(value) {
  if (value == null || typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  const withHash = t.startsWith("#") ? t : `#${t}`;
  return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash : null;
}

function firstHex(data, keys, fallback) {
  for (const k of keys) {
    const h = normalizeHex(data[k]);
    if (h) return h;
  }
  return fallback;
}

function applyMap(root, map) {
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
}

function resetToDefaults(root) {
  applyMap(root, DEFAULTS);
}

/**
 * Reads ?storeSlug= from the URL, loads /api/store/by-slug/{slug}, and sets CSS variables on :root.
 */
function consumeGoogleJwtFragment() {
  const h = window.location.hash;
  if (!h || !h.includes("sv_token=")) return;
  const m = h.match(/sv_token=([^&]+)/);
  if (m?.[1]) {
    try {
      setUserToken(decodeURIComponent(m[1]));
      clearAdminToken();
      clearSuperAdminToken();
    } catch {
      /* ignore */
    }
  }
  const clean = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", clean);
}

export default function StorefrontThemeSync() {
  const location = useLocation();
  const { settings } = useStorefrontSettings();

  useEffect(() => {
    consumeGoogleJwtFragment();
  }, []);

  useEffect(() => {
    consumeGoogleJwtFragment();
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const root = document.documentElement;
    const data = settings;
    if (!data) {
      resetToDefaults(root);
      return undefined;
    }

    const primary = firstHex(data, ["primaryColorHex"], DEFAULTS["--store-primary"]);
    const headerBg = firstHex(data, ["headerBackgroundHex", "primaryColorHex"], DEFAULTS["--store-header-bg"]);
    const bodyBg = firstHex(data, ["bodyBackgroundHex"], DEFAULTS["--store-body-bg"]);
    const footerBg = firstHex(
      data,
      ["footerBackgroundHex", "headerBackgroundHex", "primaryColorHex"],
      DEFAULTS["--store-footer-bg"]
    );
    const button = firstHex(data, ["buttonColorHex", "primaryColorHex"], DEFAULTS["--store-button"]);
    const accent = firstHex(data, ["accentColorHex"], DEFAULTS["--store-accent"]);
    const secondary = firstHex(data, ["secondaryColorHex"], DEFAULTS["--store-secondary"]);
    const link = firstHex(data, ["linkColorHex"], DEFAULTS["--store-link"]);

    applyMap(root, {
      "--store-primary": primary,
      "--store-header-bg": headerBg,
      "--store-body-bg": bodyBg,
      "--store-footer-bg": footerBg,
      "--store-button": button,
      "--store-accent": accent,
      "--store-secondary": secondary,
      "--store-link": link,
    });

    return undefined;
  }, [settings]);

  return null;
}
