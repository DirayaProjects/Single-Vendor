import React, { useState, useEffect } from "react";
import { uploadImage } from "../../../services/uploadApi";
import "./CategoriesPage.css";

const CategoryModal = ({ category, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setImagePreview(category.image || "");
      setImageFile(null);
    } else {
      setName("");
      setImagePreview("");
      setImageFile(null);
    }
  }, [category]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    try {
      setSaving(true);
      let imageUrl = category?.image || null;

      if (imageFile) {
        const uploaded = await uploadImage(imageFile, "categories");
        imageUrl = uploaded.mediumUrl;
      }

      await onSave({
        ...category,
        name,
        image: imageUrl,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h2>{category ? "Edit Category" : "Add Category"}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Category Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input type="file" accept="image/*" onChange={handleImageChange} />

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="category-modal-preview"
            />
          )}

          <div className="modal-buttons">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
