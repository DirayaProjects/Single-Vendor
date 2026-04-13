import React, { useState, useMemo, useEffect, useCallback } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import ProductModal from "./ProductModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaSearch, FaHeart, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { adminApi } from "../../../services/adminApi";
import { getApiBase } from "../../../services/apiConfig";
import "./products.css";

const initialFilters = ["Category", "Brand", "Price Range", "Rating"];

function mapApiProduct(p) {
  return {
    id: p.productId,
    productId: p.productId,
    name: p.name,
    details: p.description || "",
    category: p.categoryName || "",
    categoryId: p.categoryId ?? "",
    brand: p.brand || "",
    price: Number(p.price),
    stockQuantity: p.stockQuantity,
    rating: Number(p.ratingAverage) || 0,
    ratingCount: p.ratingCount,
    favorites: p.favoriteCount,
    images: p.imageUrls || [],
    attributes: p.specifications && typeof p.specifications === "object" ? { ...p.specifications } : {},
    isActive: p.isActive !== false,
  };
}

function ProductCard({ product, onEdit, onDelete }) {
  const images = product.images || [];
  const [mainImg, setMainImg] = useState(images[0] || null);

  useEffect(() => {
    setMainImg(images[0] || null);
  }, [images]);

  const resolveSrc = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    if (url.startsWith("/")) return `${getApiBase() || window.location.origin}${url}`;
    return url;
  };

  return (
    <div className={`product-card ${product.isActive === false ? "product-inactive" : ""}`}>
      <div className="image-area">
        {mainImg ? (
          <img src={resolveSrc(mainImg)} alt={product.name} className="main-image" />
        ) : (
          <div className="image-placeholder" />
        )}
        <div className="fav-top-right">
          <FaHeart /> {product.favorites}
        </div>
        {product.isActive === false && <span className="inactive-badge">Inactive</span>}
      </div>

      {images.length > 1 && (
        <div className="image-preview-container">
          {images.slice(0, 4).map((img, idx) => (
            <div key={idx} className="image-preview" onClick={() => setMainImg(img)}>
              <img src={resolveSrc(img)} alt={`thumb-${idx}`} />
            </div>
          ))}
        </div>
      )}

      <div className="card-content">
        <div className="card-top">
          <h4 className="product-title">{product.name}</h4>
          <div className="product-price">${Number(product.price).toFixed(2)}</div>
        </div>
        <p className="product-details">{product.details}</p>
        <div className="card-bottom">
          <span className="chip">{product.category || "—"}</span>
          <span className="chip brand">{product.brand || "—"}</span>
        </div>

        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="product-attributes">
            {Object.entries(product.attributes).map(([key, value]) => (
              <span key={key} className="chip attr-chip">
                {key}: {value}
              </span>
            ))}
          </div>
        )}

        <div className="card-actions">
          <button type="button" className="icon small edit" onClick={() => onEdit(product)}>
            <FaEdit />
          </button>
          <button type="button" className="icon delete" onClick={() => onDelete(product.productId)}>
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOrder, setFiltersOrder] = useState(initialFilters);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [listError, setListError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [activeCategory, setActiveCategory] = useState("");
  const [activeBrand, setActiveBrand] = useState("");
  const [activePriceRange, setActivePriceRange] = useState("");
  const [activeRating, setActiveRating] = useState(null);

  const loadAll = useCallback(async () => {
    setListError("");
    setLoading(true);
    try {
      const [prods, cats, attrs] = await Promise.all([
        adminApi("/api/admin/products"),
        adminApi("/api/admin/categories"),
        adminApi("/api/admin/attributes").catch(() => []),
      ]);
      setProducts((prods || []).map(mapApiProduct));
      setCategories((cats || []).filter((c) => c.isActive !== false));
      setAttributes(Array.isArray(attrs) ? attrs : []);
    } catch (e) {
      setListError(e.message || "Failed to load products.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(filtersOrder);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setFiltersOrder(newOrder);
  };

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          (p.details && p.details.toLowerCase().includes(s)) ||
          (p.brand && p.brand.toLowerCase().includes(s))
      );
    }
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (activeBrand) list = list.filter((p) => p.brand === activeBrand);
    if (activePriceRange) {
      if (activePriceRange === "0-25") list = list.filter((p) => p.price <= 25);
      else if (activePriceRange === "25-75") list = list.filter((p) => p.price > 25 && p.price <= 75);
      else if (activePriceRange === "75+") list = list.filter((p) => p.price > 75);
    }
    if (activeRating) list = list.filter((p) => p.rating >= activeRating);

    if (sortBy === "price-asc") list.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") list.sort((a, b) => b.price - a.price);
    else if (sortBy === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "name-desc") list.sort((a, b) => b.name.localeCompare(a.name));

    return list;
  }, [products, search, activeCategory, activeBrand, activePriceRange, activeRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const categoryNames = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));

  const handleSaveProduct = async (prod) => {
    const payload = {
      categoryId: prod.categoryId === "" || prod.categoryId === null ? null : Number(prod.categoryId),
      name: prod.name,
      description: prod.details || null,
      brand: prod.brand || null,
      price: prod.price,
      stockQuantity: prod.stockQuantity ?? prod.quantity ?? 0,
      imageUrls: prod.images || [],
      specifications: prod.attributes || {},
    };
    try {
      if (prod.productId) {
        await adminApi(`/api/admin/products/${prod.productId}`, {
          method: "PUT",
          json: { ...payload, isActive: prod.isActive !== false },
        });
      } else {
        await adminApi("/api/admin/products", { method: "POST", json: payload });
      }
      await loadAll();
      setIsModalOpen(false);
      setModalProduct(null);
    } catch (e) {
      window.alert(e.message || "Save failed");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Mark this product inactive?")) return;
    try {
      await adminApi(`/api/admin/products/${productId}`, { method: "DELETE" });
      await loadAll();
    } catch (e) {
      window.alert(e.message || "Delete failed");
    }
  };

  return (
    <div className="products-layout">
      <Sidebar onToggle={(isOpen) => setSidebarOpen(Boolean(isOpen))} />
      <main className="products-page" style={{ marginLeft: sidebarOpen ? 220 : 60 }}>
        <div className="top-row">
          <h2 className="page-title">Products</h2>
          <div className="top-controls">
            <div className="search-box">
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <FaSearch className="search-icon" />
            </div>
            <div className="sort-block">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="">Sort By</option>
                <option value="price-asc">Price: low → high</option>
                <option value="price-desc">Price: high → low</option>
                <option value="name-asc">Name A → Z</option>
                <option value="name-desc">Name Z → A</option>
              </select>
            </div>
            <button type="button" className="add-btn" onClick={() => loadAll()}>
              Refresh
            </button>
            <button
              type="button"
              className="add-btn"
              onClick={() => {
                setModalProduct(null);
                setIsModalOpen(true);
              }}
            >
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {listError && <p className="admin-inline-error">{listError}</p>}
        {loading && <p className="admin-inline-hint">Loading…</p>}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="filters" direction="horizontal">
            {(provided) => (
              <div className="filters-row" ref={provided.innerRef} {...provided.droppableProps}>
                {filtersOrder.map((label, idx) => (
                  <Draggable key={label} draggableId={label} index={idx}>
                    {(prov) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="filter-chip"
                      >
                        {label === "Category" && (
                          <select
                            className="filter-simple"
                            value={activeCategory}
                            onChange={(e) => {
                              setActiveCategory(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Categories</option>
                            {categoryNames.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        )}
                        {label === "Brand" && (
                          <select
                            className="filter-simple"
                            value={activeBrand}
                            onChange={(e) => {
                              setActiveBrand(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Brands</option>
                            {brands.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        )}
                        {label === "Price Range" && (
                          <select
                            className="filter-simple"
                            value={activePriceRange}
                            onChange={(e) => {
                              setActivePriceRange(e.target.value);
                              setPage(1);
                            }}
                          >
                            <option value="">All Prices</option>
                            <option value="0-25">$0 - $25</option>
                            <option value="25-75">$25 - $75</option>
                            <option value="75+">$75+</option>
                          </select>
                        )}
                        {label === "Rating" && (
                          <select
                            className="filter-simple"
                            value={activeRating || ""}
                            onChange={(e) => setActiveRating(Number(e.target.value) || null)}
                          >
                            <option value="">All Ratings</option>
                            {[5, 4, 3, 2, 1].map((r) => (
                              <option key={r} value={r}>
                                {r}★ & up
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="product-grid">
          {paginated.map((p) => (
            <ProductCard
              key={p.productId}
              product={p}
              onEdit={(prod) => {
                setModalProduct(prod);
                setIsModalOpen(true);
              }}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <div className="pagination">
          <button type="button" disabled={page === 1} onClick={() => setPage((s) => Math.max(1, s - 1))}>
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
              return (
                <button
                  key={p}
                  type="button"
                  className={page === p ? "active" : ""}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              );
            if (p === page - 3 || p === page + 3)
              return (
                <span key={p} className="dots">
                  …
                </span>
              );
            return null;
          })}
          <button
            type="button"
            disabled={page === totalPages}
            onClick={() => setPage((s) => Math.min(totalPages, s + 1))}
          >
            Next
          </button>
        </div>

        {isModalOpen && (
          <ProductModal
            product={modalProduct}
            categories={categories}
            attributes={attributes}
            onClose={() => {
              setIsModalOpen(false);
              setModalProduct(null);
            }}
            onSave={handleSaveProduct}
          />
        )}
      </main>
    </div>
  );
}
