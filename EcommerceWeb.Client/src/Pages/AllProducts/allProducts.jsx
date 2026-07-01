import React, { useState, useEffect, useMemo } from "react";
import "./allProducts.css";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import AuthModal from "../../components/AuthModal/AuthModal";
import { FaHeart, FaStar } from "react-icons/fa";
import { Link, useSearchParams } from "react-router-dom";
import { useStorefront } from "../../contexts/StorefrontContext";
import { useCart } from "../../contexts/CartContext";
import { useFavorites } from "../../contexts/FavoritesContext";
import { fetchStorefrontProducts, storePath } from "../../services/storefrontApi";
import { sizedImageUrl } from "../../services/uploadApi";
import PriceDisplay from "../../components/PriceDisplay/PriceDisplay";
import AddToCartModal from "../../components/AddToCartModal/AddToCartModal";
import { productHasAttributes } from "../../utils/productAttributes";
import { savePendingCartAdd } from "../../utils/pendingCartStorage";

const AllProducts = () => {
  const { slug, products: bootstrapProducts, categories } = useStorefront();
  const { itemCount, addItem, refreshCart } = useCart();
  const { isFavorite, toggleFavorite, refreshFavorites } = useFavorites();
  const [searchParams] = useSearchParams();
  const categoryIdFromUrl = searchParams.get("categoryId");
  const searchFromUrl = searchParams.get("search");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addedProducts, setAddedProducts] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState(null);
  const [cartModalInitial, setCartModalInitial] = useState({ quantity: 1, attributes: {} });
  const [sortOption, setSortOption] = useState("");
  const [filterCategory, setFilterCategory] = useState(categoryIdFromUrl || "");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (categoryIdFromUrl || searchFromUrl) {
        try {
          setLoading(true);
          if (mounted) setProducts([]);
          const data = await fetchStorefrontProducts(slug, {
            categoryId: categoryIdFromUrl || undefined,
            search: searchFromUrl || undefined,
          });
          if (mounted) setProducts(data);
        } catch {
          if (mounted) setProducts([]);
        } finally {
          if (mounted) setLoading(false);
        }
      } else if (mounted) {
        setProducts(bootstrapProducts);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [slug, categoryIdFromUrl, searchFromUrl, bootstrapProducts]);

  useEffect(() => {
    setFilterCategory(categoryIdFromUrl || "");
    setCurrentPage(1);
  }, [categoryIdFromUrl, searchFromUrl]);

  const nameFiltered = useMemo(() => {
    if (!searchFromUrl) return products;
    const term = searchFromUrl.trim().toLowerCase();
    return products.filter((p) => p.name?.toLowerCase().includes(term));
  }, [products, searchFromUrl]);

  const maxPrice = useMemo(
    () => (nameFiltered.length ? Math.max(...nameFiltered.map((p) => Number(p.price))) : 1000),
    [nameFiltered]
  );

  useEffect(() => {
    setPriceRange([0, Math.ceil(maxPrice)]);
  }, [maxPrice, searchFromUrl, categoryIdFromUrl]);

  const filtered = nameFiltered.filter(
    (p) =>
      (!filterCategory || String(p.categoryId) === String(filterCategory)) &&
      Number(p.price) >= priceRange[0] &&
      Number(p.price) <= priceRange[1]
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortOption === "price-asc") return a.price - b.price;
    if (sortOption === "price-desc") return b.price - a.price;
    if (sortOption === "rating-desc") return b.rating - a.rating;
    return 0;
  });

  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

  const handleToggleFavorite = async (productId) => {
    try {
      const result = await toggleFavorite(productId);
      if (result?.needsLogin) {
        setShowAuth(true);
      }
    } catch (err) {
      alert(err.message || "Failed to update wishlist");
    }
  };

  const handleAddToCart = async (product) => {
    if (productHasAttributes(product.attributes)) {
      setCartModalInitial({ quantity: 1, attributes: {} });
      setCartModalProduct(product);
      return;
    }

    try {
      const result = await addItem(product.id, 1);
      if (result?.needsLogin) {
        savePendingCartAdd({
          productId: product.id,
          quantity: 1,
          selectedAttributes: {},
          product,
        });
        setShowAuth(true);
        return;
      }
      setAddedProducts((prev) => [...prev, product.id]);
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  return (
    <div className="all-products-page">
      <Header cartCount={itemCount} onRequireLogin={() => setShowAuth(true)} />

      {searchFromUrl && (
        <p className="search-results-label">
          Results for &quot;{searchFromUrl}&quot;
        </p>
      )}

      <div className="filters-section">
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <select
          value={sortOption}
          onChange={(e) => {
            setSortOption(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">Sort By</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating-desc">Rating</option>
        </select>

        <label>
          Max Price: ${priceRange[1]}
          <input
            type="range"
            min="0"
            max={maxPrice}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([0, Number(e.target.value)])}
          />
        </label>
      </div>

      {loading ? (
        <p className="loading-text">Loading products...</p>
      ) : (
        <div className="products-grid">
          {paginated.map((product) => {
            const image = sizedImageUrl(product.images?.[0], "medium") || product.images?.[0];
            return (
              <div className="product-card" key={product.id}>
                <Link to={storePath(slug, `item/${product.id}`)}>
                  {image ? (
                    <img src={image} alt={product.name} className="product-image" />
                  ) : (
                    <div className="image-placeholder" />
                  )}
                </Link>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p>{product.details || "—"}</p>
                  <p className="price">
                    <PriceDisplay price={product.price} salePrice={product.salePrice} effectivePrice={product.effectivePrice} />
                  </p>
                  <span className="category-tag">{product.category}</span>
                  <div className="stars">
                    {[...Array(5)].map((_, j) => (
                      <FaStar
                        key={j}
                        className={j < Math.round(product.rating) ? "star filled" : "star"}
                      />
                    ))}
                  </div>
                  <FaHeart
                    className={`heart-icon ${isFavorite(product.id) ? "active" : ""}`}
                    onClick={() => handleToggleFavorite(product.id)}
                  />
                  {(!addedProducts.includes(product.id) || productHasAttributes(product.attributes)) && (
                    <button className="add-btn" onClick={() => handleAddToCart(product)}>
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sorted.length === 0 && !loading && (
        <p className="empty-store-text">No products found.</p>
      )}

      <div className="pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
          Prev
        </button>
        <span>{currentPage} / {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
          Next
        </button>
      </div>

      <Footer />

      {cartModalProduct && (
        <AddToCartModal
          product={cartModalProduct}
          initialQuantity={cartModalInitial.quantity}
          initialAttributes={cartModalInitial.attributes}
          onClose={() => {
            setCartModalProduct(null);
            setCartModalInitial({ quantity: 1, attributes: {} });
          }}
          onAdded={(productId) => setAddedProducts((prev) => [...prev, productId])}
          onNeedsLogin={() => {
            setCartModalProduct(null);
            setShowAuth(true);
          }}
        />
      )}

      {showAuth && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            refreshCart();
            refreshFavorites();
          }}
        />
      )}
    </div>
  );
};

export default AllProducts;
