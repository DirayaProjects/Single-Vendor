import React, { useState } from "react";
import "./landing.css";
import { FaHeart, FaStar } from "react-icons/fa";
import Header from "../../components/Header/header";
import Testimonials from "../../components/Testimonials/Testimonials";
import Footer from "../../components/Footer/footer";
import AuthModal from "../../components/AuthModal/AuthModal";
import { Link } from "react-router-dom";
import { useStorefront } from "../../contexts/StorefrontContext";
import { useCart } from "../../contexts/CartContext";
import { storePath } from "../../services/storefrontApi";
import { sizedImageUrl } from "../../services/uploadApi";

const LandingPage = () => {
  const { slug, settings, products } = useStorefront();
  const { itemCount, addItem } = useCart();
  const [favorites, setFavorites] = useState([]);
  const [showAuth, setShowAuth] = useState(false);
  const [addedProducts, setAddedProducts] = useState([]);

  const featuredProducts = products.slice(0, 6);
  const bestSellers = products.slice(0, 3);
  const bannerImage = sizedImageUrl(settings?.banner, "large") || settings?.banner;

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const handleAddToCart = async (productId) => {
    try {
      const result = await addItem(productId, 1);
      if (result?.needsLogin) {
        setShowAuth(true);
        return;
      }
      setAddedProducts((prev) => [...prev, productId]);
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  return (
    <div className="landing">
      <Header cartCount={itemCount} onRequireLogin={() => setShowAuth(true)} />

      <section className="hero">
        <div className="hero-text">
          <h2>
            Welcome to <span>{settings?.logoName || "Our Shop"}</span>!
          </h2>
          <p>Enjoy Shopping</p>
        </div>
        <div
          className="hero-image"
          style={bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined}
        />
      </section>

      <section className="promos">
        {categoriesPromo(products).map((promo) => (
          <div className="promo-card" key={promo.id}>
            <h3>{promo.label}</h3>
            <h1>{promo.value}</h1>
            <p>{promo.sub}</p>
          </div>
        ))}
      </section>

      <section className="products">
        {featuredProducts.length === 0 ? (
          <p className="empty-store-text">No products available yet.</p>
        ) : (
          featuredProducts.map((product) => {
            const image = sizedImageUrl(product.images?.[0], "medium") || product.images?.[0];
            return (
              <div className="product-card" key={product.id}>
                <Link to={storePath(slug, `item/${product.id}`)} className="product-image-link">
                  {image ? (
                    <img src={image} alt={product.name} className="product-thumb" />
                  ) : (
                    <div className="image-placeholder">
                      <FaHeart
                        className={`fav-icon ${favorites.includes(product.id) ? "favorited" : ""}`}
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFavorite(product.id);
                        }}
                      />
                    </div>
                  )}
                </Link>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p>{product.details || "—"}</p>
                  <p className="price">${Number(product.price).toFixed(2)}</p>
                  <div className="stars">
                    {[...Array(5)].map((_, j) => (
                      <FaStar
                        key={j}
                        className={`star ${j < Math.round(product.rating) ? "filled" : ""}`}
                      />
                    ))}
                  </div>
                  {!addedProducts.includes(product.id) && (
                    <button className="add-btn" onClick={() => handleAddToCart(product.id)}>
                      Add to cart
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {products.length > 6 && (
        <div className="view-all-container">
          <Link to={storePath(slug, "products")} className="view-all-btn">
            View All Products
          </Link>
        </div>
      )}

      <section className="featured">
        <h3>Weekly Best-sellers / Featured Products</h3>
        <div className="featured-grid">
          {bestSellers.map((product) => {
            const image = sizedImageUrl(product.images?.[0], "medium") || product.images?.[0];
            return (
              <Link
                key={product.id}
                to={storePath(slug, `item/${product.id}`)}
                className="featured-card"
                style={image ? { backgroundImage: `url(${image})`, backgroundSize: "cover" } : undefined}
              />
            );
          })}
        </div>
      </section>

      <Testimonials />
      <Footer />

      {showAuth && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
          }}
        />
      )}
    </div>
  );
};

function categoriesPromo(products) {
  if (products.length === 0) {
    return [
      { id: 1, label: "NEW", value: "—", sub: "Products coming soon" },
      { id: 2, label: "SHOP", value: "—", sub: "Browse catalog" },
      { id: 3, label: "DEALS", value: "—", sub: "Stay tuned" },
    ];
  }

  const topPrice = Math.max(...products.map((p) => Number(p.price)));
  return [
    { id: 1, label: "FROM", value: `$${Math.min(...products.map((p) => Number(p.price))).toFixed(0)}`, sub: "STARTING" },
    { id: 2, label: "TOP", value: `$${topPrice.toFixed(0)}`, sub: "PICKS" },
    { id: 3, label: "ITEMS", value: String(products.length), sub: "IN STORE" },
  ];
}

export default LandingPage;
