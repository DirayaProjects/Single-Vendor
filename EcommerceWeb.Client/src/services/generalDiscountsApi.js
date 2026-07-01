import { parseResponse } from "./apiUtils";

export async function getGeneralDiscounts() {
  return parseResponse(await fetch("/api/admin/general-discounts"));
}

export async function createGeneralDiscount(dto) {
  return parseResponse(await fetch("/api/admin/general-discounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function updateGeneralDiscount(id, dto) {
  return parseResponse(await fetch(`/api/admin/general-discounts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function deleteGeneralDiscount(id) {
  return parseResponse(await fetch(`/api/admin/general-discounts/${id}`, { method: "DELETE" }));
}
