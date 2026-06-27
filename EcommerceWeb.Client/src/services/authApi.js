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

export function saveAuthSession(authData) {
  sessionStorage.setItem("authUser", JSON.stringify(authData));
}

export function getAuthSession() {
  const raw = sessionStorage.getItem("authUser");
  return raw ? JSON.parse(raw) : null;
}

export function clearAuthSession() {
  sessionStorage.removeItem("authUser");
}
