async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export async function getOrders() {
  const response = await fetch("/api/admin/orders");
  return parseResponse(response);
}

export async function createOrder(dto) {
  const response = await fetch("/api/admin/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function updateOrder(id, dto) {
  const response = await fetch(`/api/admin/orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function deleteOrder(id) {
  const response = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
  return parseResponse(response);
}
