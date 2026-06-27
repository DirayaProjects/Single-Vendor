import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { sizedImageUrl } from "../../../services/uploadApi";

const CategoryCard = ({ category, onEdit, onDelete }) => {
  const imageSrc = sizedImageUrl(category.image, "medium") || category.image;

  return (
    <div className="category-card">
      {imageSrc ? (
        <img src={imageSrc} alt={category.name} />
      ) : (
        <div className="category-image-placeholder">{category.name.charAt(0)}</div>
      )}
      <h3>{category.name}</h3>
      <div className="actions">
        <button onClick={onEdit}>
          <FaEdit color="#161f55" />
        </button>
        <button onClick={onDelete}>
          <FaTrash color="#f44336" />
        </button>
      </div>
    </div>
  );
};

export default CategoryCard;
