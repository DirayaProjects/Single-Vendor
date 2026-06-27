export async function getDashboard() {
  const response = await fetch("/api/admin/dashboard");

  if (!response.ok) {
    throw new Error("Failed to load dashboard data");
  }

  return response.json();
}
