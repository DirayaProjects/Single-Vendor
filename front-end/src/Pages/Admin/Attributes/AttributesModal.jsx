import React, { useState, useEffect } from "react";
import "../Categories/CategoriesPage.css";

const AttributeModal = ({ attribute, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (attribute) {
      setName(attribute.name);
      setValue(attribute.value);
    } else {
      setName("");
      setValue("");
    }
  }, [attribute]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !value) return;
    const attrData = attribute ? { ...attribute, name, value } : { name, value, date: new Date().toISOString().split("T")[0] };
    onSave(attrData);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{attribute ? "Edit Attribute" : "Add Attribute"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Attribute Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Attribute Value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="modal-buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttributeModal;
