async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Cart request failed");
  }
  return data;
}

export async function getCart(userId) {
  const response = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`);
  return parseResponse(response);
}

export async function addToCart(userId, productId, quantity = 1) {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId, quantity }),
  });
  return parseResponse(response);
}

export async function updateCartItem(cartItemId, userId, quantity) {
  const response = await fetch(`/api/cart/${cartItemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, quantity }),
  });
  return parseResponse(response);
}

export async function removeCartItem(cartItemId, userId) {
  const response = await fetch(
    `/api/cart/${cartItemId}?userId=${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
  return parseResponse(response);
}
