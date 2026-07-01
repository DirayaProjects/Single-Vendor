async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Checkout failed");
  }
  return data;
}

export async function checkout(userId, payload) {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...payload }),
  });
  return parseResponse(response);
}

export async function previewCheckout(userId, payload) {
  const response = await fetch("/api/checkout/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, ...payload }),
  });
  return parseResponse(response);
}
