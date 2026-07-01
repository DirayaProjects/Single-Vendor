import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { uploadImage } from "../../../services/uploadApi";
import { isColorAttributeName } from "../../../utils/colorAttribute";
import ColorSwatch from "../../../components/ColorSwatch/ColorSwatch";
import "./products.css";

function buildAttributeSelection(product, attributes) {
  const selection = {};
  attributes.forEach((attr) => {
    const existing = product?.attributes?.[attr.name];
    const values = Array.isArray(existing)
      ? existing.filter(Boolean)
      : existing
        ? [existing]
        : [];
    selection[attr.name] = { enabled: values.length > 0, values };
  });
  return selection;
}

function buildAttributesPayload(selection) {
  const payload = {};
  Object.entries(selection).forEach(([name, { enabled, values }]) => {
    if (enabled && values.length > 0) {
      payload[name] = values;
    }
  });
  return payload;
}

export default function ProductModal({ product = null, categories = [], attributes = [], onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    details: "",
    categoryId: "",
    brand: "",
    price: "",
    salePrice: "",
    quantity: "",
  });

  const [attributeSelection, setAttributeSelection] = useState({});
  const [imageItems, setImageItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        details: product.details || "",
        categoryId: product.categoryId || "",
        brand: product.brand || "",
        price: product.price || "",
        salePrice: product.salePrice ?? "",
        quantity: product.quantity || "",
      });
      setAttributeSelection(buildAttributeSelection(product, attributes));
      setImageItems(
        (product.images || []).map((url, index) => ({
          id: `existing-${index}-${url}`,
          preview: url,
          url,
          file: null,
        }))
      );
    } else {
      setForm({
        name: "",
        details: "",
        categoryId: "",
        brand: "",
        price: "",
        quantity: "",
      });
      setAttributeSelection(buildAttributeSelection(null, attributes));
      setImageItems([]);
    }
  }, [product, attributes]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4 - imageItems.length);
    const nextItems = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      preview: URL.createObjectURL(file),
      url: null,
      file,
    }));
    setImageItems((prev) => [...prev, ...nextItems]);
    e.target.value = "";
  };

  const removeImage = (id) => {
    setImageItems((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(item.preview);
      }
      return prev.filter((x) => x.id !== id);
    });
  };

  const toggleAttribute = (name, enabled) => {
    setAttributeSelection((prev) => ({
      ...prev,
      [name]: {
        enabled,
        values: enabled ? prev[name]?.values || [] : [],
      },
    }));
  };

  const toggleAttributeValue = (name, value) => {
    setAttributeSelection((prev) => {
      const current = prev[name]?.values || [];
      const values = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {
        ...prev,
        [name]: { enabled: true, values },
      };
    });
  };

  const validate = () => {
    const err = {};
    if (!form.name?.trim()) err.name = "Name is required";
    if (!form.categoryId) err.categoryId = "Category is required";
    if (!form.price || Number.isNaN(Number(form.price))) err.price = "Valid price required";
    if (form.salePrice && Number(form.salePrice) >= Number(form.price)) {
      err.salePrice = "Sale price must be less than regular price";
    }
    if (!form.quantity || Number.isNaN(Number(form.quantity))) err.quantity = "Valid quantity required";
    return err;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    try {
      setSaving(true);
      const uploadedUrls = [];

      for (const item of imageItems) {
        if (item.url) {
          uploadedUrls.push(item.url);
          continue;
        }
        if (item.file) {
          const uploaded = await uploadImage(item.file, "products");
          uploadedUrls.push(uploaded.mediumUrl);
        }
      }

      await onSave({
        id: product?.id,
        name: form.name.trim(),
        details: form.details,
        categoryId: Number(form.categoryId),
        brand: form.brand,
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        quantity: Number(form.quantity),
        attributes: buildAttributesPayload(attributeSelection),
        images: uploadedUrls,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal product-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{product ? "Edit Product" : "Add Product"}</h3>
          <button type="button" className="modal-close" onClick={onClose}><FaTimes /></button>
        </div>

        <form className="modal-form modal-form-scroll" onSubmit={handleSave}>
          <div className="modal-form-body">
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
                Sale Price
                <input
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  placeholder="Optional"
                />
                {errors.salePrice && <small className="error">{errors.salePrice}</small>}
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
              Category *
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <small className="error">{errors.categoryId}</small>}
            </label>

            <label>
              Brand
              <input
                value={form.brand || ""}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </label>

            {attributes.length > 0 && (
              <div className="product-attributes-editor">
                <p className="section-label">Attributes</p>
                {attributes.map((attr) => (
                  <div key={attr.id} className="attr-group">
                    <label className="attr-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(attributeSelection[attr.name]?.enabled)}
                        onChange={(e) => toggleAttribute(attr.name, e.target.checked)}
                      />
                      <span>{attr.name}</span>
                    </label>

                    {attributeSelection[attr.name]?.enabled && (
                      isColorAttributeName(attr.name) ? (
                        <div className="attr-color-grid">
                          {(attr.values || []).map((value) => (
                            <ColorSwatch
                              key={value}
                              color={value}
                              size="md"
                              selected={attributeSelection[attr.name]?.values?.includes(value)}
                              onClick={() => toggleAttributeValue(attr.name, value)}
                              title={value}
                            />
                          ))}
                          {(attr.values || []).length === 0 && (
                            <span className="empty-attr-values">No colors defined for this attribute.</span>
                          )}
                        </div>
                      ) : (
                      <div className="attr-values-grid">
                        {(attr.values || []).map((value) => (
                          <label key={value} className="value-checkbox-label">
                            <input
                              type="checkbox"
                              checked={attributeSelection[attr.name]?.values?.includes(value)}
                              onChange={() => toggleAttributeValue(attr.name, value)}
                            />
                            <span>{value}</span>
                          </label>
                        ))}
                        {(attr.values || []).length === 0 && (
                          <span className="empty-attr-values">No values defined for this attribute.</span>
                        )}
                      </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}

            <label>
              Images (max 4)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={imageItems.length >= 4}
              />
            </label>

            <div className="image-preview-container">
              {imageItems.map((item) => (
                <div key={item.id} className="image-preview">
                  <img src={item.preview} alt="Product preview" />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeImage(item.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions modal-actions-sticky">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
