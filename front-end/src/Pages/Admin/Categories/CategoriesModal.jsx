import React, { useState, useEffect } from "react";
import "./CategoriesPage.css";

const CategoryModal = ({ category, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.name);
      setImagePreview(category.image);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || (!imagePreview && !imageFile)) return;

    // For now, we just store the image as base64 (can be replaced by API upload)
    const catData = {
      ...category,
      name,
      image: imagePreview,
    };
    onSave(catData);
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
