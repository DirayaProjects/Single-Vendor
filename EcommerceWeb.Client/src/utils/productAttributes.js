export function productHasAttributes(attributes) {
  if (!attributes || typeof attributes !== "object") return false;
  return Object.values(attributes).some((values) => {
    const list = Array.isArray(values) ? values : [values];
    return list.filter(Boolean).length > 0;
  });
}

export function getAttributeEntries(attributes) {
  if (!attributes || typeof attributes !== "object") return [];
  return Object.entries(attributes)
    .map(([name, values]) => ({
      name,
      values: (Array.isArray(values) ? values : [values]).filter(Boolean),
    }))
    .filter((entry) => entry.values.length > 0);
}

export function areAllAttributesSelected(attributes, selected) {
  return getAttributeEntries(attributes).every((entry) => Boolean(selected?.[entry.name]));
}

export function formatSelectedAttributes(selected) {
  if (!selected || typeof selected !== "object") return "";
  const parts = Object.entries(selected)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => `${name}: ${value}`);
  return parts.join(" · ");
}
