const STORAGE_KEY = "singleVendorSuperAdminJwt";

export function getSuperAdminToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSuperAdminToken(token) {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearSuperAdminToken() {
  sessionStorage.removeItem(STORAGE_KEY);
}
