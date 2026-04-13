import React, { useState, useEffect } from "react";
import { adminUploadCategoryImage } from "../../../services/adminApi";
import "./CategoriesPage.css";

const CategoryModal = ({ category, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setImagePreview(category.imageUrl || category.image || "");
      setUploadError("");
    } else {
      setName("");
      setImagePreview("");
      setUploadError("");
    }
  }, [category]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadError("");
      setUploading(true);
      try {
        const url = await adminUploadCategoryImage(file);
        setImagePreview(url);
      } catch (err) {
        setUploadError(err.message || "Image upload failed.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const imageUrl = imagePreview || null;

    onSave({
      categoryId: category?.categoryId,
      name: name.trim(),
      imageUrl,
      displayOrder: category ? category.displayOrder : undefined,
      isActive: category ? category.isActive !== false : true,
    });
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
            required
          />

          <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
          {uploading && <p>Uploading image…</p>}
          {uploadError && <p className="categories-error-banner">{uploadError}</p>}

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: "100%", marginTop: "10px", borderRadius: "5px" }}
            />
          )}

          <div className="modal-buttons">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
