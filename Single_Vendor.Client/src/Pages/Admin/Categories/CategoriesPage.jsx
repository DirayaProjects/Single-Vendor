import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import CategoryCard from "./CategoriesCard";
import CategoryModal from "./CategoriesModal";
import { FaSearch } from "react-icons/fa";
import { adminApi } from "../../../services/adminApi";
import "./CategoriesPage.css";

const PLACEHOLDER = "https://via.placeholder.com/150?text=Category";

const mapApiToUi = (c) => ({
  id: c.categoryId,
  categoryId: c.categoryId,
  name: c.name,
  image: c.imageUrl || PLACEHOLDER,
  imageUrl: c.imageUrl,
  displayOrder: c.displayOrder,
  isActive: c.isActive,
});

const CategoriesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const list = await adminApi("/api/admin/categories");
      setCategories(Array.isArray(list) ? list.map(mapApiToUi) : []);
    } catch (e) {
      setError(e.message || "Could not load categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleSaveCategory = async (payload) => {
    try {
      if (payload.categoryId) {
        await adminApi(`/api/admin/categories/${payload.categoryId}`, {
          method: "PUT",
          json: {
            name: payload.name,
            imageUrl: payload.imageUrl || null,
            displayOrder: payload.displayOrder ?? 0,
            isActive: payload.isActive !== false,
          },
        });
      } else {
        await adminApi("/api/admin/categories", {
          method: "POST",
          json: {
            name: payload.name,
            imageUrl: payload.imageUrl || null,
            displayOrder: payload.displayOrder,
          },
        });
      }
      await reload();
      setModalOpen(false);
      setEditingCategory(null);
    } catch (e) {
      alert(e.message || "Save failed.");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Deactivate this category?")) return;
    try {
      await adminApi(`/api/admin/categories/${id}`, { method: "DELETE" });
      await reload();
    } catch (e) {
      alert(e.message || "Delete failed.");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Sidebar onToggle={setSidebarOpen} />
      <div className={`admin-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <h1 className="page-title">Categories</h1>
        {loading && <p>Loading…</p>}
        {error && <div className="categories-error-banner">{error}</div>}

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
            onClose={() => {
              setModalOpen(false);
              setEditingCategory(null);
            }}
            onSave={handleSaveCategory}
          />
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
