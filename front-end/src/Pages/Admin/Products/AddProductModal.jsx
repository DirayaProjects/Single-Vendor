
import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";
import "./products.css"; // uses the same css file - modal styles included

export default function AddProductModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", details: "", price: "", category: sampleCategoryValue() });
  const [errors, setErrors] = useState({});

  function sampleCategoryValue() {
    // default empty
    return "";
  }

  const handleFile = (e) => {
    const file = e.target.files[0];
    setForm((f) => ({ ...f, image: file }));
  };

  const validate = () => {
    const err = {};
    if (!form.name?.trim()) err.name = "Name is required";
    if (!form.price || Number.isNaN(Number(form.price))) err.price = "Valid price required";
    return err;
  };

  const submit = (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length === 0) {
      onSave({
        name: form.name,
        details: form.details,
        price: Number(form.price),
        category: form.category || "Uncategorized",
        brand: form.brand || "Brand A",
        rating: form.rating ? Number(form.rating) : 4,
      });
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal small" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Product</h3>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <form className="modal-form" onSubmit={submit}>
          <label>
            Name *
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors.name && <small className="error">{errors.name}</small>}
          </label>

          <label>
            Details
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
          </label>

          <div className="row">
            <label style={{ flex: 1 }}>
              Price *
              <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              {errors.price && <small className="error">{errors.price}</small>}
            </label>

            <label style={{ flex: 1 }}>
              Category
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothes">Clothes</option>
                <option value="Home">Home</option>
                <option value="Sports">Sports</option>
              </select>
            </label>
          </div>

          <label>
            Brand
            <input value={form.brand || ""} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          </label>

          <label>
            Image
            <input type="file" accept="image/*" onChange={handleFile} />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Product</button>
          </div>
        </form>
      </div>
    </div>
  );
}
