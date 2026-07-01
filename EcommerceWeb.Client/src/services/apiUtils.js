export async function parseResponse(response) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid response from server");
    }
  }
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
}
