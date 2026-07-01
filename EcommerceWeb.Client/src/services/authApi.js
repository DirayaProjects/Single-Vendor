export async function login(emailOrUsername, password) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emailOrUsername, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

export async function register(userName, email, password) {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userName, email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

const AUTH_CHANGED_EVENT = "auth-changed";

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function saveAuthSession(authData) {
  sessionStorage.setItem("authUser", JSON.stringify(authData));
  notifyAuthChanged();
}

export function getAuthSession() {
  const raw = sessionStorage.getItem("authUser");
  return raw ? JSON.parse(raw) : null;
}

export function clearAuthSession() {
  sessionStorage.removeItem("authUser");
  notifyAuthChanged();
}

export { AUTH_CHANGED_EVENT };
