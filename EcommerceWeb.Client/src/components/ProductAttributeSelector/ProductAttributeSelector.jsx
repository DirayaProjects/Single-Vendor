import React from "react";
import ColorSwatch from "../ColorSwatch/ColorSwatch";
import { isColorAttributeName } from "../../utils/colorAttribute";
import { getAttributeEntries } from "../../utils/productAttributes";
import "./ProductAttributeSelector.css";

export default function ProductAttributeSelector({
  attributes,
  selected = {},
  onChange,
  size = "md",
}) {
  const entries = getAttributeEntries(attributes);
  if (entries.length === 0) return null;

  const setValue = (name, value) => {
    onChange?.({ ...selected, [name]: value });
  };

  return (
    <div className="product-attribute-selector">
      {entries.map(({ name, values }) => (
        <div key={name} className="attr-selector-row">
          <span className="attr-selector-label">{name}</span>
          {isColorAttributeName(name) ? (
            <div className="attr-selector-options color-options">
              {values.map((value) => (
                <ColorSwatch
                  key={value}
                  color={value}
                  size={size === "lg" ? "lg" : "md"}
                  selected={selected[name] === value}
                  onClick={() => setValue(name, value)}
                  title={value}
                />
              ))}
            </div>
          ) : (
            <div className="attr-selector-options">
              {values.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`attr-option-btn ${selected[name] === value ? "selected" : ""}`}
                  onClick={() => setValue(name, value)}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
