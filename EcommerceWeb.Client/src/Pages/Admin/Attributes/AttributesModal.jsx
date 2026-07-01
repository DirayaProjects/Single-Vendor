import React from "react";
import { FaTimes, FaPlus } from "react-icons/fa";
import { isColorAttributeName, isValidHexColor, normalizeHexColor } from "../../../utils/colorAttribute";
import ColorSwatch from "../../../components/ColorSwatch/ColorSwatch";

const AttributeModal = ({
  title,
  formData,
  setFormData,
  addValueField,
  removeValueField,
  handleValueChange,
  saveModal,
  closeModal,
}) => {
  const isColorAttr = isColorAttributeName(formData.name);

  const addColorValue = () => {
    const used = new Set(formData.values.filter(isValidHexColor));
    let candidate = "#000000";
    for (let i = 0; i < 20 && used.has(candidate); i += 1) {
      candidate = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
    }
    setFormData({ ...formData, values: [...formData.values.filter(Boolean), candidate] });
  };

  const updateColorValue = (index, hex) => {
    handleValueChange(index, normalizeHexColor(hex));
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-attribute">
        <h2>{title}</h2>
        <input
          type="text"
          placeholder="Attribute Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />

        {isColorAttr ? (
          <div className="multi-values-box color-values-box">
            <p className="field-help">Pick colors for this attribute. Values are saved as hex codes.</p>
            <div className="color-values-editor">
              {formData.values.map((v, i) => (
                <div className="color-value-row" key={i}>
                  <input
                    type="color"
                    value={normalizeHexColor(v)}
                    onChange={(e) => updateColorValue(i, e.target.value)}
                    aria-label={`Color ${i + 1}`}
                  />
                  <ColorSwatch color={v} size="md" />
                  <code className="color-hex-code">{normalizeHexColor(v)}</code>
                  <button type="button" className="remove-value" onClick={() => removeValueField(i)} aria-label="Remove color">
                    <FaTimes />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="add-value color-add-btn" onClick={addColorValue}>
              <FaPlus /> Add color
            </button>
          </div>
        ) : (
          <div className="multi-values-box">
            {formData.values.map((v, i) => (
              <div className="value-row" key={i}>
                <input
                  type="text"
                  placeholder={`Value ${i + 1}`}
                  value={v}
                  onChange={(e) => handleValueChange(i, e.target.value)}
                />
                <button type="button" className="remove-value" onClick={() => removeValueField(i)}>✕</button>
              </div>
            ))}
            <button type="button" className="add-value" onClick={addValueField}>+ Add Value</button>
          </div>
        )}

        <div className="modal-buttons">
          <button type="button" onClick={closeModal}>Cancel</button>
          <button type="button" onClick={saveModal}>{title.includes("Edit") ? "Save" : "Add"}</button>
        </div>
      </div>
    </div>
  );
};

export default AttributeModal;
