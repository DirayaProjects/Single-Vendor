import React, { useState, useMemo } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import ProductModal from "./ProductModal"; 
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaSearch, FaHeart, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "./products.css";

// Initial filters
const initialFilters = ["Category", "Brand", "Price Range", "Rating"];
const sampleCategories = ["Electronics", "Clothes", "Home", "Sports"];
const sampleBrands = ["Brand A", "Brand B", "Brand C", "Brand D"];

// Category-specific attributes
const CATEGORY_ATTRIBUTES = {
  Clothes: ["Color", "Size", "Material"],
  Electronics: ["Warranty", "Brand", "Model"],
  Home: ["Material", "Dimensions", "Weight"],
  Sports: ["Brand", "Size", "Type"]
};

// Generate sample products
const generateProducts = (n = 48) => {
  const list = [];
  for (let i = 1; i <= n; i++) {
    const category = sampleCategories[i % sampleCategories.length];
    const brand = sampleBrands[i % sampleBrands.length];
    const price = 10 + ((i * 13) % 120);
    list.push({
      id: i,
      name: `Product ${i}`,
      details: `Description for product ${i}.`,
      category,
      brand,
      price,
      rating: (i % 5) + 1,
      images: [],
      favorites: Math.floor(Math.random() * 20),
      attributes: {} // dynamic attributes per category
    });
  }
  return list;
};

// Product card component
function ProductCard({ product, onEdit, onDelete }) {
  const images = product.images || [];
  const [mainImg, setMainImg] = useState(images[0] || null);

  return (
    <div className="product-card">
      <div className="image-area">
        {mainImg ? (
          <img src={mainImg} alt={product.name} className="main-image" />
        ) : (
          <div className="image-placeholder" />
        )}
        <div className="fav-top-right">
          <FaHeart /> {product.favorites}
        </div>
      </div>

      {images.length > 1 && (
        <div className="image-preview-container">
          {images.slice(0, 4).map((img, idx) => (
            <div
              key={idx}
              className="image-preview"
              onClick={() => setMainImg(img)}
            >
              <img src={img} alt={`thumb-${idx}`} />
            </div>
          ))}
        </div>
      )}

      <div className="card-content">
        <div className="card-top">
          <h4 className="product-title">{product.name}</h4>
          <div className="product-price">${product.price}</div>
        </div>
        <p className="product-details">{product.details}</p>
        <div className="card-bottom">
          <span className="chip">{product.category}</span>
          <span className="chip brand">{product.brand}</span>
        </div>

        {/* Display dynamic attributes */}
        {product.attributes && Object.keys(product.attributes).length > 0 && (
          <div className="product-attributes">
            {Object.entries(product.attributes).map(([key, value]) => (
              <span key={key} className="chip attr-chip">{key}: {value}</span>
            ))}
          </div>
        )}

        <div className="card-actions">
          <button className="icon small edit" onClick={() => onEdit(product)}>
            <FaEdit />
          </button>
          <button className="icon delete" onClick={() => onDelete(product.id)}>
            <FaTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Products Page
export default function ProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOrder, setFiltersOrder] = useState(initialFilters);
  const [products, setProducts] = useState(() => generateProducts());
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
          p.details.toLowerCase().includes(s) ||
          p.brand.toLowerCase().includes(s)
      );
    }
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (activeBrand) list = list.filter((p) => p.brand === activeBrand);
    if (activePriceRange) {
      if (activePriceRange === "0-25") list = list.filter((p) => p.price <= 25);
      else if (activePriceRange === "25-75")
        list = list.filter((p) => p.price > 25 && p.price <= 75);
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

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(new Set(products.map((p) => p.brand)));

  const handleSaveProduct = (prod) => {
    if (prod.id) {
      setProducts(products.map((p) => (p.id === prod.id ? prod : p)));
    } else {
      const newId = products.length ? Math.max(...products.map((p) => p.id)) + 1 : 1;
      setProducts([{ id: newId, favorites: 0, ...prod }, ...products]);
    }
    setIsModalOpen(false);
    setModalProduct(null);
  };

  return (
    <div className="products-layout">
      <Sidebar onToggle={(isOpen) => setSidebarOpen(Boolean(isOpen))} />
      <main className="products-page" style={{ marginLeft: sidebarOpen ? 220 : 60 }}>
        {/* Top row */}
        <div className="top-row">
          <h2 className="page-title">Products</h2>
          <div className="top-controls">
            <div className="search-box">
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            <button className="add-btn" onClick={() => { setModalProduct(null); setIsModalOpen(true); }}>
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {/* Filters */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="filters" direction="horizontal">
            {(provided) => (
              <div className="filters-row" ref={provided.innerRef} {...provided.droppableProps}>
                {filtersOrder.map((label, idx) => (
                  <Draggable key={label} draggableId={label} index={idx}>
                    {(prov) => (
                      <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps} className="filter-chip">
                        {label === "Category" && (
                          <select className="filter-simple" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
                            <option value="">All Categories</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        )}
                        {label === "Brand" && (
                          <select className="filter-simple" value={activeBrand} onChange={(e) => setActiveBrand(e.target.value)}>
                            <option value="">All Brands</option>
                            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                          </select>
                        )}
                        {label === "Price Range" && (
                          <select className="filter-simple" value={activePriceRange} onChange={(e) => setActivePriceRange(e.target.value)}>
                            <option value="">All Prices</option>
                            <option value="0-25">$0 - $25</option>
                            <option value="25-75">$25 - $75</option>
                            <option value="75+">$75+</option>
                          </select>
                        )}
                        {label === "Rating" && (
                          <select className="filter-simple" value={activeRating || ""} onChange={(e) => setActiveRating(Number(e.target.value) || null)}>
                            <option value="">All Ratings</option>
                            {[5,4,3,2,1].map(r => <option key={r} value={r}>{r}★ & up</option>)}
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

        {/* Product Grid */}
        <div className="product-grid">
          {paginated.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={(prod) => { setModalProduct(prod); setIsModalOpen(true); }}
              onDelete={(id) => setProducts(products.filter((x) => x.id !== id))}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((s) => Math.max(1, s - 1))}>Prev</button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) return (
              <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
            );
            else if (p === page - 3 || p === page + 3) return <span key={p} className="dots">…</span>;
            else return null;
          })}
          <button disabled={page === totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))}>Next</button>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <ProductModal
            product={modalProduct}
            onClose={() => { setIsModalOpen(false); setModalProduct(null); }}
            onSave={handleSaveProduct}
          />
        )}
      </main>
    </div>
  );
}
