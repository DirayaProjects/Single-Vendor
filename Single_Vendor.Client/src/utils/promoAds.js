export function promoAdHasContent(ad) {
  return !!(
    String(ad?.titleLine || "").trim() ||
    String(ad?.bigText || "").trim() ||
    String(ad?.subLine || "").trim() ||
    String(ad?.imageUrl || "").trim() ||
    String(ad?.linkUrl || "").trim()
  );
}

/** Fisher–Yates shuffle then take up to n items (new array each call). */
export function shufflePick(arr, n) {
  if (!arr?.length) return [];
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}
