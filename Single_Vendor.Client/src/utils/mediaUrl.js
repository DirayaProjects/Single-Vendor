import { getApiBase } from "../services/apiConfig";

/** Turn API-relative paths (/uploads/...) into absolute URLs for <img src>. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return "";
  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }
  if (url.startsWith("/")) {
    const base = getApiBase() || (typeof window !== "undefined" ? window.location.origin : "");
    return `${base}${url}`;
  }
  return url;
}

export function resolveResponsiveMedia(url) {
  const src = resolveMediaUrl(url);
  if (!src || !/-(md)\.webp($|\?)/i.test(src)) {
    return { src, srcSet: "" };
  }

  const sm = src.replace(/-md\.webp/i, "-sm.webp");
  const lg = src.replace(/-md\.webp/i, "-lg.webp");
  const srcSet = `${sm} 480w, ${src} 960w, ${lg} 1600w`;
  return { src, srcSet };
}
