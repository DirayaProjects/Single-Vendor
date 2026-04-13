import { getApiBase } from "./apiConfig";
import { getAdminToken } from "./adminAuth";

/**
 * @param {string} path - e.g. "/api/admin/store"
 * @param {RequestInit & { json?: unknown }} options
 */
export async function adminApi(path, options = {}) {
  const base = getApiBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(options.headers);
  const token = getAdminToken();
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
      if (j?.errors) msg = JSON.stringify(j.errors);
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

/** Upload a product image; returns public URL path (e.g. /uploads/products/...). */
export async function adminUploadProductImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const data = await adminApi("/api/admin/products/upload-image", { method: "POST", body: fd });
  if (!data?.url) throw new Error("Upload did not return a URL.");
  return data.url;
}

/** Upload logo/banner for store settings; returns short path (fits DB URL limit). */
export async function adminUploadStoreImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const data = await adminApi("/api/admin/store/upload-image", { method: "POST", body: fd });
  if (!data?.url) throw new Error("Upload did not return a URL.");
  return data.url;
}

/** Upload category image; returns short webp URL path. */
export async function adminUploadCategoryImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const data = await adminApi("/api/admin/categories/upload-image", { method: "POST", body: fd });
  if (!data?.url) throw new Error("Upload did not return a URL.");
  return data.url;
}
