import React from "react";
import { FaStar } from "react-icons/fa";

/** Read-only display of average rating (0–5). */
export default function ProductStars({ value, count }) {
  const v = Math.min(5, Math.max(0, Number(value) || 0));
  const rounded = Math.round(v * 10) / 10;
  return (
    <div className="stars product-stars-row" title={count ? `${count} reviews` : undefined} aria-label={`Rating ${rounded}`}>
      <span>{Number.isInteger(rounded) ? String(Math.trunc(rounded)) : rounded.toFixed(1)}</span>
      <FaStar className="star filled" />
    </div>
  );
}
