import React, { useState, useMemo } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProduct";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FaSearch, FaHeart, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "./products.css";

const initialFilters = ["Category", "Brand", "Price Range", "Rating"];
const sampleCategories = ["Electronics", "Clothes", "Home", "Sports"];
const sampleBrands = ["Brand A", "Brand B", "Brand C", "Brand D"];

// Generate products
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
      image: null,
      favorites: Math.floor(Math.random() * 20), // random favorite count
    });
  }
  return list;
};

export default function ProductsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOrder, setFiltersOrder] = useState(initialFilters);
  const [products, setProducts] = useState(() => generateProducts());
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
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

  // Filtered + search + sort
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

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const brands = Array.from(new Set(products.map((p) => p.brand)));

  return (
    <div className="products-layout">
      <Sidebar onToggle={(isOpen) => setSidebarOpen(Boolean(isOpen))} />
      <main className="products-page" style={{ marginLeft: sidebarOpen ? 220 : 60 }}>
        <div className="top-row">
          <h2 className="page-title">Products</h2>

          <div className="top-controls">
            <div className="search-box">
              <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
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

            <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
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
                            {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r}★ & up</option>)}
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

        {/* Products */}
        <div className="product-grid">
          {paginated.map((p) => (
            <div key={p.id} className="product-card">
              <div className="image-area">
                {p.image ? (
                  <img src={p.image} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div className="image-placeholder" />
                )}
                <div className="fav-top-right">
                  <FaHeart /> {p.favorites}
                </div>
              </div>

              <div className="card-top">
                <h4 className="product-title">{p.name}</h4>
                <div className="product-price">${p.price}</div>
              </div>
              <p className="product-details">{p.details}</p>
              <div className="card-bottom">
                <span className="chip">{p.category}</span>
                <span className="chip brand">{p.brand}</span>
              </div>
              <div className="card-actions">
                <button className="icon small" onClick={() => setEditProduct(p)}><FaEdit /></button>
                <button className="icon delete" onClick={() => setProducts(products.filter(x => x.id !== p.id))}><FaTrash /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((s) => Math.max(1, s - 1))}>Prev</button>
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            if (p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2)) return <button key={p} className={page === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
            else if (p === page - 3 || p === page + 3) return <span key={p} className="dots">…</span>;
            else return null;
          })}
          <button disabled={page === totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))}>Next</button>
        </div>

        {isAddModalOpen && <AddProductModal onClose={() => setIsAddModalOpen(false)} onSave={(newProduct) => {
          setProducts([{ id: products.length + 1, favorites: 0, ...newProduct }, ...products]);
          setIsAddModalOpen(false);
        }} />}

        {editProduct && <EditProductModal product={editProduct} onClose={() => setEditProduct(null)} onSave={(updated) => {
          setProducts(products.map(p => p.id === updated.id ? updated : p));
          setEditProduct(null);
        }} />}
      </main>
    </div>
  );
}
