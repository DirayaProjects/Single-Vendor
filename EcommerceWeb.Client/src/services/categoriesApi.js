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

export async function getCategories() {
  const response = await fetch("/api/admin/categories");
  return parseResponse(response);
}

export async function createCategory(dto) {
  const response = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function updateCategory(id, dto) {
  const response = await fetch(`/api/admin/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function deleteCategory(id) {
  const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
  return parseResponse(response);
}
