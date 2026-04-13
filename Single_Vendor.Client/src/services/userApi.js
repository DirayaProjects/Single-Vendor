import { getApiBase } from "./apiConfig";
import { getUserToken } from "./userAuth";

/**
 * Authenticated customer API (Bearer user JWT).
 */
export async function userApi(path, options = {}) {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  const token = getUserToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body = options.body;
  if (options.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.json);
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
      /* plain */
    }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) return res.json();
  return res.text();
}
