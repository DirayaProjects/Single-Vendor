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

export async function getAttributes() {
  const response = await fetch("/api/admin/attributes");
  return parseResponse(response);
}

export async function createAttribute(dto) {
  const response = await fetch("/api/admin/attributes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function updateAttribute(id, dto) {
  const response = await fetch(`/api/admin/attributes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseResponse(response);
}

export async function deleteAttribute(id) {
  const response = await fetch(`/api/admin/attributes/${id}`, { method: "DELETE" });
  return parseResponse(response);
}
