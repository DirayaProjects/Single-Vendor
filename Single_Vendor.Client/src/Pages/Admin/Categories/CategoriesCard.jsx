import React from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

const CategoryCard = ({ category, onEdit, onDelete }) => {
  return (
    <div className="category-card">
      <img src={category.image} alt={category.name} />
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
