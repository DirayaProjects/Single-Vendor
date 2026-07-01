const PENDING_CART_KEY = "pending-cart-add";

export function savePendingCartAdd(payload) {
  sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(payload));
}

export function getPendingCartAdd() {
  const raw = sessionStorage.getItem(PENDING_CART_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearPendingCartAdd() {
  sessionStorage.removeItem(PENDING_CART_KEY);
}
