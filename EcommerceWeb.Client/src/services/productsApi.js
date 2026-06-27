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

export async function getProducts() {
  const response = await fetch("/api/admin/products");
  return parseResponse(response);
}

export async function createProduct(dto) {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function updateProduct(id, dto) {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function deleteProduct(id) {
  const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
  return parseResponse(response);
}
