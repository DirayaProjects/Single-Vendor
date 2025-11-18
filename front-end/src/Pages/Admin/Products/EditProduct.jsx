import React, { useState } from "react";

export default function EditProductModal({ product, onClose, onSave }) {
  const [name, setName] = useState(product.name);
  const [details, setDetails] = useState(product.details);
  const [category, setCategory] = useState(product.category);
  const [brand, setBrand] = useState(product.brand);
  const [price, setPrice] = useState(product.price);
  const [image, setImage] = useState(product.image || null);

  const handleSave = () => {
    const updatedProduct = { ...product, name, details, category, brand, price, image };
    onSave(updatedProduct);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Product</h3>
          <span className="modal-close" onClick={onClose}>×</span>
        </div>

        <div className="modal-form">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label>Details</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} />

          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} />

          <label>Brand</label>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} />

          <label>Price</label>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />

          <label>Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {image && <img src={image} alt="Preview" style={{ width: "100px", marginTop: "8px", borderRadius: "6px" }} />}
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
