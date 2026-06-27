import React, { useEffect, useState } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import CategoryCard from "./CategoriesCard";
import CategoryModal from "./CategoriesModal";
import { FaSearch } from "react-icons/fa";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../../services/categoriesApi";
import "./CategoriesPage.css";

const CategoriesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = async (category) => {
    const saved = await createCategory({ name: category.name, image: category.image });
    setCategories((prev) => [...prev, saved]);
  };

  const handleEditCategory = async (updatedCategory) => {
    const saved = await updateCategory(updatedCategory.id, {
      name: updatedCategory.name,
      image: updatedCategory.image,
    });
    setCategories((prev) => prev.map((cat) => (cat.id === saved.id ? saved : cat)));
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    await deleteCategory(id);
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Sidebar onToggle={setSidebarOpen} />
      <div className={`admin-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <h1 className="page-title">Categories</h1>

        {error && <p className="error-text">{error}</p>}

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

        {loading ? (
          <p>Loading categories...</p>
        ) : (
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
        )}

        {modalOpen && (
          <CategoryModal
            category={editingCategory}
            onClose={() => setModalOpen(false)}
            onSave={async (cat) => {
              try {
                if (editingCategory) {
                  await handleEditCategory(cat);
                } else {
                  await handleAddCategory(cat);
                }
                setModalOpen(false);
              } catch (err) {
                alert(err.message || "Failed to save category");
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
