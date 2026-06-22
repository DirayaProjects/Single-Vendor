const STORAGE_KEY = "singleVendorUserJwt";

const sessionEvent = "singleVendor:userSession";

function notifySessionChanged() {
  try {
    window.dispatchEvent(new Event(sessionEvent));
  } catch {
    /* ignore */
  }
}

export function getUserToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setUserToken(token) {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
    notifySessionChanged();
  } catch {
    /* ignore */
  }
}

export function clearUserToken() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    notifySessionChanged();
  } catch {
    /* ignore */
  }
}
