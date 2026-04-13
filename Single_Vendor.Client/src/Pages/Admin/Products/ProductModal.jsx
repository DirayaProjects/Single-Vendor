import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { adminUploadProductImage } from "../../../services/adminApi";
import { getApiBase } from "../../../services/apiConfig";
import "./products.css";

export default function ProductModal({
  product = null,
  categories = [],
  attributes = [],
  onClose,
  onSave,
}) {
  const splitValues = (raw) =>
    String(raw || "")
      .split(/\s*(?:\||\/|,|;)\s*/)
      .map((v) => v.trim())
      .filter(Boolean);
  const joinValues = (vals) => Array.from(new Set((vals || []).map((v) => String(v).trim()).filter(Boolean))).join(" | ");

  const [form, setForm] = useState({
    name: "",
    details: "",
    categoryId: "",
    brand: "",
    price: "",
    quantity: "",
    attributes: {},
  });

  const [images, setImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        details: product.details || "",
        categoryId: product.categoryId !== undefined && product.categoryId !== null ? String(product.categoryId) : "",
        brand: product.brand || "",
        price: product.price !== undefined && product.price !== null ? String(product.price) : "",
        quantity:
          product.stockQuantity !== undefined && product.stockQuantity !== null
            ? String(product.stockQuantity)
            : product.quantity !== undefined
              ? String(product.quantity)
              : "",
        attributes: product.attributes && typeof product.attributes === "object" ? { ...product.attributes } : {},
      });
      setImages(product.images || []);
    } else {
      setForm({
        name: "",
        details: "",
        categoryId: "",
        brand: "",
        price: "",
        quantity: "",
        attributes: {},
      });
      setImages([]);
    }
  }, [product]);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, Math.max(0, 4 - images.length));
    e.target.value = "";
    if (!files.length) return;
    setUploadError("");
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const url = await adminUploadProductImage(file);
        urls.push(url);
      }
      setImages((prev) => [...prev, ...urls].slice(0, 20));
    } catch (err) {
      setUploadError(err.message || "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => setImages(images.filter((_, i) => i !== idx));

  const handleAttributeChange = (attr, value) => {
    setForm((prev) => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: value },
    }));
  };

  const toggleAttributeValue = (attr, value, checked) => {
    setForm((prev) => {
      const current = splitValues(prev.attributes[attr]);
      const nextValues = checked ? [...current, value] : current.filter((v) => v !== value);
      return {
        ...prev,
        attributes: { ...prev.attributes, [attr]: joinValues(nextValues) },
      };
    });
  };

  const toggleAttribute = (attrName, checked) => {
    setForm((prev) => {
      const next = { ...prev.attributes };
      if (!checked) delete next[attrName];
      else if (!next[attrName]) next[attrName] = "";
      return { ...prev, attributes: next };
    });
  };

  const validate = () => {
    const err = {};
    if (!form.name?.trim()) err.name = "Name is required";
    if (!form.price || Number.isNaN(Number(form.price))) err.price = "Valid price required";
    if (!form.quantity || Number.isNaN(Number(form.quantity))) err.quantity = "Valid quantity required";
    return err;
  };

  const handleSave = (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length > 0) return;
    onSave({
      ...(product || {}),
      name: form.name.trim(),
      details: form.details,
      categoryId: form.categoryId === "" ? null : Number(form.categoryId),
      brand: form.brand,
      price: Number(form.price),
      stockQuantity: Number(form.quantity),
      images,
      attributes: form.attributes,
    });
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(ev) => ev.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? "Edit Product" : "Add Product"}</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
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
              Stock qty *
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
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value, attributes: {} })}
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.categoryId} value={String(c.categoryId)}>
                  {c.name}
                </option>
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

          {attributes.length > 0 && (
            <div className="product-attributes">
              <p className="modal-hint">Select attributes, then choose one or more values for each.</p>
              {attributes.map((attr) => {
                const selected = Object.prototype.hasOwnProperty.call(form.attributes, attr.name);
                const values = Array.isArray(attr.values) ? attr.values : [];
                const selectedValues = splitValues(form.attributes[attr.name]);
                return (
                  <div key={attr.attributeId || attr.name} className="attr-input">
                    <label className="attr-toggle-row">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => toggleAttribute(attr.name, e.target.checked)}
                      />
                      <span>{attr.name}</span>
                    </label>
                    {selected && values.length > 0 && (
                      <div className="attr-values-grid">
                        {values.map((v) => {
                          const active = selectedValues.includes(v);
                          return (
                            <label
                              key={`${attr.name}-${v}`}
                              className={`attr-value-option ${active ? "active" : ""}`}
                            >
                              <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => toggleAttributeValue(attr.name, v, e.target.checked)}
                              />
                              <span>{v}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {selected && values.length === 0 && (
                      <input
                        value={form.attributes[attr.name] || ""}
                        placeholder={`${attr.name}`}
                        onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <label>
            Images (max 4 shown in grid; files upload to server)
            <input type="file" accept="image/*" multiple disabled={uploading} onChange={handleFileChange} />
          </label>
          {uploadError && <small className="error">{uploadError}</small>}
          {uploading && <small>Uploading…</small>}

          <div className="image-preview-container">
            {images.map((img, idx) => (
              <div key={idx} className="image-preview">
                <img
                  src={
                    img.startsWith("/")
                      ? `${getApiBase() || window.location.origin}${img}`
                      : img
                  }
                  alt={`Preview ${idx}`}
                />
                <button type="button" className="remove-image-btn" onClick={() => removeImage(idx)}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={uploading}>
              Save Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
