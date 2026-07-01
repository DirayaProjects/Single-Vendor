import { parseResponse } from "./apiUtils";

export async function getPromoAds() {
  return parseResponse(await fetch("/api/admin/promo-ads"));
}

export async function createPromoAd(dto) {
  return parseResponse(await fetch("/api/admin/promo-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function updatePromoAd(id, dto) {
  return parseResponse(await fetch(`/api/admin/promo-ads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function deletePromoAd(id) {
  return parseResponse(await fetch(`/api/admin/promo-ads/${id}`, { method: "DELETE" }));
}
