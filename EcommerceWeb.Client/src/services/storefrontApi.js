async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export function storePath(slug, subPath = "") {
  const base = `/s/${encodeURIComponent(slug)}`;
  return subPath ? `${base}/${subPath.replace(/^\//, "")}` : base;
}

export async function fetchStorefront(slug) {
  const response = await fetch(`/api/storefront/${encodeURIComponent(slug)}`);
  return parseResponse(response);
}

export async function fetchStorefrontProducts(slug, { categoryId, search } = {}) {
  const params = new URLSearchParams();
  if (categoryId) params.set("categoryId", categoryId);
  if (search) params.set("search", search);
  const qs = params.toString();
  const response = await fetch(
    `/api/storefront/${encodeURIComponent(slug)}/products${qs ? `?${qs}` : ""}`
  );
  return parseResponse(response);
}

export async function fetchStorefrontProduct(slug, id) {
  const response = await fetch(
    `/api/storefront/${encodeURIComponent(slug)}/products/${id}`
  );
  return parseResponse(response);
}

export async function fetchProductReviews(slug, productId) {
  const response = await fetch(
    `/api/storefront/${encodeURIComponent(slug)}/products/${productId}/reviews`
  );
  return parseResponse(response);
}

export async function submitProductReview(slug, productId, payload) {
  const response = await fetch(
    `/api/storefront/${encodeURIComponent(slug)}/products/${productId}/reviews`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  return parseResponse(response);
}
