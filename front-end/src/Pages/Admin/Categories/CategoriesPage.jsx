import React, { useState } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import CategoryCard from "./CategoriesCard";
import CategoryModal from "./CategoriesModal";
import { FaSearch } from "react-icons/fa";
import "./CategoriesPage.css";

const initialCategories = [
  { id: 1, name: "Electronics", image: "https://via.placeholder.com/150" },
  { id: 2, name: "Clothing", image: "https://via.placeholder.com/150" },
  { id: 3, name: "Toys", image: "https://via.placeholder.com/150" },
];

const CategoriesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleAddCategory = (category) => {
    setCategories([...categories, { id: Date.now(), ...category }]);
  };

  const handleEditCategory = (updatedCategory) => {
    setCategories(
      categories.map((cat) =>
        cat.id === updatedCategory.id ? updatedCategory : cat
      )
    );
  };

  const handleDeleteCategory = (id) => {
    setCategories(categories.filter((cat) => cat.id !== id));
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Sidebar onToggle={setSidebarOpen} />
      <div className={`admin-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <h1 className="page-title">Categories</h1>

        <div className="top-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="search-icon" />
          </div>
          <button
            className="add-btn"
            onClick={() => {
              setEditingCategory(null);
              setModalOpen(true);
            }}
          >
            + Add Category
          </button>
        </div>

        <div className="categories-grid">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => {
                setEditingCategory(category);
                setModalOpen(true);
              }}
              onDelete={() => handleDeleteCategory(category.id)}
            />
          ))}
        </div>

        {modalOpen && (
          <CategoryModal
            category={editingCategory}
            onClose={() => setModalOpen(false)}
            onSave={(cat) => {
              editingCategory
                ? handleEditCategory(cat)
                : handleAddCategory(cat);
              setModalOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
