import { parseResponse } from "./apiUtils";

export async function getDeliveryCities() {
  return parseResponse(await fetch("/api/admin/delivery-cities"));
}

export async function createDeliveryCity(dto) {
  return parseResponse(await fetch("/api/admin/delivery-cities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function updateDeliveryCity(id, dto) {
  return parseResponse(await fetch(`/api/admin/delivery-cities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  }));
}

export async function deleteDeliveryCity(id) {
  return parseResponse(await fetch(`/api/admin/delivery-cities/${id}`, { method: "DELETE" }));
}

export async function getStorefrontDeliveryCities(slug) {
  return parseResponse(await fetch(`/api/storefront/${encodeURIComponent(slug)}/delivery-cities`));
}
