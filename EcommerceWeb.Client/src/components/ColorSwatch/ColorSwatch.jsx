import React from "react";
import { normalizeHexColor } from "../../utils/colorAttribute";
import "./ColorSwatch.css";

export default function ColorSwatch({
  color,
  selected = false,
  onClick,
  size = "md",
  title,
}) {
  const hex = normalizeHexColor(color);
  const className = [
    "color-swatch",
    `color-swatch-${size}`,
    selected ? "selected" : "",
    onClick ? "clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <span
      className={className}
      style={{ backgroundColor: hex }}
      title={title || hex}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    />
  );

  if (onClick) {
    return (
      <button type="button" className="color-swatch-btn" onClick={onClick} title={title || hex}>
        {inner}
      </button>
    );
  }

  return inner;
}
