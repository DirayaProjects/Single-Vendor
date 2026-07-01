export function isColorAttributeName(name) {
  return /^colou?r$/i.test((name || "").trim());
}

export function isValidHexColor(value) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test((value || "").trim());
}

export function normalizeHexColor(value, fallback = "#000000") {
  if (!value) return fallback;
  const v = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(v)) return v;
  if (/^#[0-9A-Fa-f]{3}$/.test(v)) return v;
  if (/^[0-9A-Fa-f]{6}$/.test(v)) return `#${v}`;
  if (/^[0-9A-Fa-f]{3}$/.test(v)) return `#${v}`;
  return fallback;
}
