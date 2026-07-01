import React from "react";
import "./PriceDisplay.css";

export default function PriceDisplay({ price, salePrice, effectivePrice, className = "" }) {
  const original = Number(price);
  const effective = effectivePrice != null && effectivePrice !== ""
    ? Number(effectivePrice)
    : salePrice != null && salePrice !== "" && Number(salePrice) > 0
      ? Number(salePrice)
      : original;
  const onSale = effective < original - 0.001;

  if (!onSale) {
    return <span className={`price-display ${className}`}>${original.toFixed(2)}</span>;
  }

  return (
    <span className={`price-display on-sale ${className}`}>
      <span className="price-old">${original.toFixed(2)}</span>
      <span className="price-new">${effective.toFixed(2)}</span>
    </span>
  );
}
