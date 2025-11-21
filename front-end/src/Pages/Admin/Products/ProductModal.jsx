import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import "./products.css";

// Define category-specific attributes
const categoryAttributes = {
  Electronics: ["Warranty", "Voltage"],
  Clothes: ["Color", "Size", "Material"],
  Home: ["Material", "Dimensions"],
  Sports: ["Size", "Weight", "Brand"],
};

export default function ProductModal({ product = null, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    details: "",
    category: "",
    brand: "",
    price: "",
    quantity: "",
    attributes: {}, // dynamic attributes
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});

  // Load product data when editing
  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        details: product.details || "",
        category: product.category || "",
        brand: product.brand || "",
        price: product.price || "",
        quantity: product.quantity || "",
        attributes: product.attributes || {},
      });
      setImages(product.images || []);
    }
  }, [product]);

  // Handle image upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - images.length);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => [...prev, ev.target.result]);
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (idx) => setImages(images.filter((_, i) => i !== idx));

  // Handle attribute value change
  const handleAttributeChange = (attr, value) => {
    setForm((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: value },
    }));
  };

  // Validation
  const validate = () => {
    const err = {};
    if (!form.name?.trim()) err.name = "Name is required";
    if (!form.price || Number.isNaN(Number(form.price))) err.price = "Valid price required";
    if (!form.quantity || Number.isNaN(Number(form.quantity)))
      err.quantity = "Valid quantity required";
    return err;
  };

  const handleSave = (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length === 0) {
      onSave({
        ...form,
        price: Number(form.price),
        quantity: Number(form.quantity),
        images,
      });
    }
  };

  // Attributes to display based on selected category
  const attributesToShow = form.category ? categoryAttributes[form.category] || [] : [];

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? "Edit Product" : "Add Product"}</h3>
          <button className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <form className="modal-form" onSubmit={handleSave}>
          <label>
            Name *
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            {errors.name && <small className="error">{errors.name}</small>}
          </label>

          <label>
            Details
            <textarea
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </label>

          <div className="row">
            <label style={{ flex: 1 }}>
              Price *
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              {errors.price && <small className="error">{errors.price}</small>}
            </label>

            <label style={{ flex: 1 }}>
              Quantity *
              <input
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
              {errors.quantity && <small className="error">{errors.quantity}</small>}
            </label>
          </div>

          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value, attributes: {} })}
            >
              <option value="">Select category</option>
              {Object.keys(categoryAttributes).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Brand
            <input
              value={form.brand || ""}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </label>

          {/* Dynamic Attributes */}
          {attributesToShow.length > 0 && (
            <div className="product-attributes">
              {attributesToShow.map((attr) => (
                <div key={attr} className="attr-input">
                  <label>{attr}</label>
                  <input
                    value={form.attributes[attr] || ""}
                    placeholder={`Enter ${attr}`}
                    onChange={(e) => handleAttributeChange(attr, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <label>
            Images (max 4)
            <input type="file" accept="image/*" multiple onChange={handleFileChange} />
          </label>

          <div className="image-preview-container">
            {images.map((img, idx) => (
              <div key={idx} className="image-preview">
                <img src={img} alt={`Preview ${idx}`} />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeImage(idx)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
