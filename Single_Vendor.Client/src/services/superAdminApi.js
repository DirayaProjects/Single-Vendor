import { getApiBase } from "./apiConfig";
import { getSuperAdminToken } from "./superAdminAuth";

/**
 * @param {string} path - e.g. "/api/superadmin/stats"
 * @param {RequestInit & { json?: unknown }} options
 */
export async function superAdminApi(path, options = {}) {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  const token = getSuperAdminToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData = options.body instanceof FormData;
  let body = options.body;

  if (!isFormData) {
    if (options.json !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.json);
    } else if (!headers.has("Content-Type") && body && typeof body === "string") {
      headers.set("Content-Type", "application/json");
    }
  } else {
    headers.delete("Content-Type");
  }

  const res = await fetch(url, { ...options, headers, body });
  if (!res.ok) {
    const text = await res.text();
    let msg = text || res.statusText;
    try {
      const j = JSON.parse(text);
      if (j?.title) msg = j.title;
      if (typeof j === "string") msg = j;
    } catch {
      /* plain text */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) return res.json();
  return res.text();
}
