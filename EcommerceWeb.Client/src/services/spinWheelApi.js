import { parseResponse } from "./apiUtils";

export async function getSpinPrizes() {
  return parseResponse(await fetch("/api/admin/spin-wheel/prizes"));
}

export async function createSpinPrize(dto) {
  return parseResponse(await fetch("/api/admin/spin-wheel/prizes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function updateSpinPrize(id, dto) {
  return parseResponse(await fetch(`/api/admin/spin-wheel/prizes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function deleteSpinPrize(id) {
  return parseResponse(await fetch(`/api/admin/spin-wheel/prizes/${id}`, { method: "DELETE" }));
}

export async function getSpinWheelStatus(slug, userId) {
  return parseResponse(await fetch(
    `/api/storefront/${encodeURIComponent(slug)}/spin-wheel/status?userId=${encodeURIComponent(userId)}`
  ));
}

export async function spinWheel(slug, userId) {
  return parseResponse(await fetch(`/api/storefront/${encodeURIComponent(slug)}/spin-wheel/spin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  }));
}
