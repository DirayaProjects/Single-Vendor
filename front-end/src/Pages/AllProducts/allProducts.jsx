import React, { useState, useEffect } from "react";
import "./allProducts.css";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { FaHeart, FaStar } from "react-icons/fa";

const generateProducts = () => {
  return [...Array(30)].map((_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: Math.floor(Math.random() * 50) + 10,
    category: i % 2 === 0 ? "Clothes" : "Accessories",
    rating: Math.floor(Math.random() * 5) + 1,
  }));
};

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hoveredRating, setHoveredRating] = useState({}); 

  useEffect(() => {
    setProducts(generateProducts());
  }, []);

  const filtered = products.filter(
    (p) =>
      (!filterCategory || p.category === filterCategory) &&
      p.price >= priceRange[0] &&
      p.price <= priceRange[1]
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === "price-asc") return a.price - b.price;
    if (sortOption === "price-desc") return b.price - a.price;
    if (sortOption === "rating-desc") return b.rating - a.rating;
    return 0;
  });

  const itemsPerPage = 8;
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addToCart = (id) => {
    if (!cart.includes(id)) setCart([...cart, id]);
  };

  const handleStarClick = (productId, starIndex) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, rating: starIndex + 1 } : p
      )
    );
  };

  const handleStarHover = (productId, starIndex) => {
    setHoveredRating({ ...hoveredRating, [productId]: starIndex + 1 });
  };

  const handleStarLeave = (productId) => {
    setHoveredRating({ ...hoveredRating, [productId]: 0 });
  };

  return (
    <div className="all-products-page">
      <Header cartCount={cart.length} />

      {/* FILTERS */}
      {/* HERO SECTION */}
    <section className="hero-section-product">
        <div className="hero-content-product">
        <h1>Discover Our Latest Collection</h1>
        <p>Shop the trendiest items, best prices, and highest quality — all in one place.</p>
        <button className="hero-btn">Shop Now</button>
      </div>

      <div className="hero-image-product"></div>
    </section>

      <div className="top-filters">
      <div className="filters">
        <div className="filter-label">
          <span>Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All</option>
            <option value="Clothes">Clothes</option>
            <option value="Accessories">Accessories</option>
          </select>
        </div>

        <div className="filter-label">
          <span>Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="">Default</option>
            <option value="price-asc">Price low → high</option>
            <option value="price-desc">Price high → low</option>
            <option value="rating-desc">Rating high → low</option>
          </select>
        </div>
        </div>
        <div className="filter-label price-filter">
          <span>Price range:</span>
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value), priceRange[1]])
            }
            placeholder="Min"
          />
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value)])
            }
            placeholder="Max"
          />
        
      </div>
      </div>
      {/* PRODUCTS GRID */}
      <section className="products">
        {paginated.map((product) => {
          const hoverValue = hoveredRating[product.id] || 0;
          return (
            <div className="product-card" key={product.id}>
              <div className="image-placeholder">
                <FaHeart
                  className={`fav-icon ${
                    favorites.includes(product.id) ? "favorited" : ""
                  }`}
                  onClick={() => toggleFavorite(product.id)}
                />
              </div>
              <div className="product-info">
                <h4>{product.name}</h4>
                <p className="price">${product.price}</p>

                <div className="stars">
                  {[...Array(5)].map((_, j) => (
                    <FaStar
                      key={j}
                      className={`star ${
                        j < (hoverValue || product.rating) ? "filled" : ""
                      }`}
                      onClick={() => handleStarClick(product.id, j)}
                      onMouseEnter={() => handleStarHover(product.id, j)}
                      onMouseLeave={() => handleStarLeave(product.id)}
                    />
                  ))}
                </div>

                {!cart.includes(product.id) && (
                  <button
                    className="add-btn"
                    onClick={() => addToCart(product.id)}
                  >
                    Add to cart
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* PAGINATION */}
      <div className="pagination">
        <button
          className="page-btn"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`page-number ${currentPage === i + 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}

        <button
          className="page-btn"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default AllProducts;
