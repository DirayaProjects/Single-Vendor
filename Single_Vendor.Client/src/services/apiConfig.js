/** Base URL for the ASP.NET API (no trailing slash). */
export function getApiBase() {
  const base = process.env.REACT_APP_API_URL || "";
  return base.replace(/\/$/, "");
}
