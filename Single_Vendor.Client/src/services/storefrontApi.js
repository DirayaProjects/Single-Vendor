import { getApiBase } from "./apiConfig";
import { getUserToken } from "./userAuth";

function buildUrl(path, query) {
  const base = getApiBase().replace(/\/$/, "");
  const qs = new URLSearchParams();
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0) qs.set(k, String(v));
    });
  }
  const q = qs.toString();
  const full = `${path}${q ? `?${q}` : ""}`;
  return base ? `${base}${full}` : full;
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Public store branding/settings (no auth). Used when the shop is opened with ?storeSlug=….
 */
export async function fetchStoreSettingsBySlug(slug) {
  if (!slug || !String(slug).trim()) {
    throw new Error("Store slug is required.");
  }
  const url = buildUrl(`/api/store/by-slug/${encodeURIComponent(String(slug).trim())}`);
  return getJson(url);
}

/** Store suggestions by partial name/slug for guest open-shop flow. */
export async function fetchStoreSuggestions(q) {
  return getJson(buildUrl("/api/store/suggestions", { q }));
}

/** Categories for a store (slug or backend default). */
export async function fetchStorefrontCategories(storeSlug) {
  return getJson(buildUrl("/api/categories", { storeSlug }));
}

/** Product list for storefront. */
export async function fetchStorefrontProducts(storeSlug, opts = {}) {
  const { categoryId, q } = opts;
  return getJson(
    buildUrl("/api/storefront/products", {
      storeSlug,
      categoryId: categoryId != null && categoryId !== "" ? String(categoryId) : undefined,
      q: q?.trim() || undefined,
    })
  );
}

/** Single product with images and specs. */
export async function fetchStorefrontProductDetail(productId, storeSlug) {
  return getJson(buildUrl(`/api/storefront/products/${productId}`, { storeSlug }));
}

/** Recent product reviews for a store (carousel / testimonials). */
export async function fetchStorefrontReviews(storeSlug, take = 40) {
  return getJson(buildUrl("/api/storefront/reviews", { storeSlug, take: String(take) }));
}

/** Landing promo / ad cards (empty if feature off or none active). */
export async function fetchStorefrontPromoAds(storeSlug) {
  return getJson(buildUrl("/api/storefront/promo-ads", { storeSlug }));
}

/** Public reviews for one product (product detail). */
export async function fetchStorefrontProductReviews(productId, storeSlug, take = 50) {
  return getJson(
    buildUrl(`/api/storefront/products/${productId}/reviews`, {
      storeSlug,
      take: String(take),
    })
  );
}

/** Logged-in customer: current user's rating for a product (if any). */
export async function fetchMyProductReview(productId, storeSlug) {
  const url = buildUrl(`/api/storefront/products/${productId}/reviews/me`, { storeSlug });
  const token = getUserToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Logged-in customer: submit or update 1–5 star product review. */
export async function submitProductReview(productId, storeSlug, rating, comment) {
  const base = getApiBase().replace(/\/$/, "");
  const path = `/api/storefront/products/${productId}/reviews`;
  const url = base ? `${base}${path}` : path;
  const token = getUserToken();
  if (!token) throw new Error("Not signed in.");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      storeSlug: storeSlug || undefined,
      rating,
      comment: comment || undefined,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

async function fetchWithAuth(url, options = {}) {
  const token = getUserToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  const ct = res.headers.get("content-type");
  if (ct && ct.includes("application/json")) return res.json();
  return res.text();
}

/** Customer wishlist product IDs (same store as the user). */
export async function fetchWishlistIds() {
  const url = buildUrl("/api/storefront/wishlist");
  return fetchWithAuth(url);
}

export async function addWishlistProduct(productId) {
  const base = getApiBase().replace(/\/$/, "");
  const path = "/api/storefront/wishlist";
  const url = base ? `${base}${path}` : path;
  return fetchWithAuth(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId: Number(productId) }),
  });
}

export async function removeWishlistProduct(productId) {
  const base = getApiBase().replace(/\/$/, "");
  const path = `/api/storefront/wishlist/${Number(productId)}`;
  const url = base ? `${base}${path}` : path;
  return fetchWithAuth(url, { method: "DELETE" });
}

/** Place order from cart lines (customer JWT). */
export async function storefrontCheckout(items, notes) {
  const base = getApiBase().replace(/\/$/, "");
  const url = base ? `${base}/api/storefront/checkout` : "/api/storefront/checkout";
  const token = getUserToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      items: items.map((x) => ({ productId: x.productId, quantity: x.quantity })),
      notes: notes || undefined,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}
