async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Orders request failed");
  }
  return data;
}

export async function getMyOrders(userId) {
  const response = await fetch(`/api/my-orders?userId=${encodeURIComponent(userId)}`);
  return parseResponse(response);
}

export async function getMyOrderById(orderId, userId) {
  const response = await fetch(
    `/api/my-orders/${orderId}?userId=${encodeURIComponent(userId)}`
  );
  return parseResponse(response);
}
