async function parseResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Upload failed");
  }
  return data;
}

export async function uploadImage(file, folder = "misc") {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/admin/upload?folder=${encodeURIComponent(folder)}`, {
    method: "POST",
    body: formData,
  });

  return parseResponse(response);
}

/** Derive thumb/large URL from a medium URL stored in the database. */
export function sizedImageUrl(mediumUrl, size = "medium") {
  if (!mediumUrl) return null;
  if (!mediumUrl.includes("/uploads/")) return mediumUrl;
  if (size === "medium") return mediumUrl;
  return mediumUrl.replace("/medium.webp", `/${size}.webp`);
}
