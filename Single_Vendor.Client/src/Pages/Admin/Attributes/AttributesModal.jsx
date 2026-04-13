import React from "react";
import { FaTimes } from "react-icons/fa";

const AttributeModal = ({
  title,
  formData,
  setFormData,
  addValueField,
  removeValueField,
  handleValueChange,
  saveModal,
  closeModal
}) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-content modal-attribute">
        <h2>{title}</h2>
        <input
          type="text"
          placeholder="Attribute Name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
        />
        <div className="multi-values-box">
          {formData.values.map((v, i) => (
            <div className="value-row" key={i}>
              <input
                type="text"
                placeholder={`Value ${i + 1}`}
                value={v}
                onChange={e => handleValueChange(i, e.target.value)}
              />
              <button type="button" className="remove-value" onClick={() => removeValueField(i)}>✕</button>
            </div>
          ))}
          <button className="add-value" onClick={addValueField}>+ Add Value</button>
        </div>
        <div className="modal-buttons">
          <button onClick={closeModal}>Cancel</button>
          <button onClick={saveModal}>{title.includes("Edit") ? "Save" : "Add"}</button>
        </div>
      </div>
    </div>
  );
};

export default AttributeModal;
