async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Favorites request failed");
  }
  return data;
}

export async function getFavorites(userId) {
  const response = await fetch(`/api/favorites?userId=${encodeURIComponent(userId)}`);
  return parseResponse(response);
}

export async function toggleFavorite(userId, productId) {
  const response = await fetch("/api/favorites/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, productId }),
  });
  return parseResponse(response);
}
