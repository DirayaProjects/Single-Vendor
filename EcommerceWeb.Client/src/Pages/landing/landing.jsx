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
import { useFavorites } from "../../contexts/FavoritesContext";
import { storePath } from "../../services/storefrontApi";
import { sizedImageUrl } from "../../services/uploadApi";
import PriceDisplay from "../../components/PriceDisplay/PriceDisplay";
import AddToCartModal from "../../components/AddToCartModal/AddToCartModal";
import { productHasAttributes } from "../../utils/productAttributes";
import { savePendingCartAdd } from "../../utils/pendingCartStorage";

const LandingPage = () => {
  const { slug, settings, products, promoAds } = useStorefront();
  const { itemCount, addItem, refreshCart } = useCart();
  const { isFavorite, toggleFavorite, refreshFavorites } = useFavorites();
  const [showAuth, setShowAuth] = useState(false);
  const [addedProducts, setAddedProducts] = useState([]);
  const [cartModalProduct, setCartModalProduct] = useState(null);
  const [cartModalInitial, setCartModalInitial] = useState({ quantity: 1, attributes: {} });

  const featuredProducts = products.slice(0, 6);
  const bestSellers = products.slice(0, 3);
  const bannerImage = sizedImageUrl(settings?.banner, "large") || settings?.banner;
  const landingPromos = (promoAds || []).slice(0, 3);

  const handleToggleFavorite = async (e, productId) => {
    e.preventDefault();
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
        {landingPromos.length > 0 ? (
          landingPromos.map((ad) => (
            <PromoHighlightCard key={ad.id} ad={ad} />
          ))
        ) : (
          <>
            <div className="promo-card promo-card-placeholder">
              <div className="promo-card-text">
                <h3>DEALS</h3>
                <h1>—</h1>
                <p>Coming soon</p>
              </div>
            </div>
            <div className="promo-card promo-card-placeholder">
              <div className="promo-card-text">
                <h3>SHOP</h3>
                <h1>—</h1>
                <p>Browse catalog</p>
              </div>
            </div>
            <div className="promo-card promo-card-placeholder">
              <div className="promo-card-text">
                <h3>NEW</h3>
                <h1>—</h1>
                <p>Stay tuned</p>
              </div>
            </div>
          </>
        )}
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
                    <div className="image-placeholder" />
                  )}
                  <FaHeart
                    className={`fav-icon ${isFavorite(product.id) ? "favorited" : ""}`}
                    onClick={(e) => handleToggleFavorite(e, product.id)}
                  />
                </Link>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p>{product.details || "—"}</p>
                  <p className="price">
                    <PriceDisplay price={product.price} salePrice={product.salePrice} effectivePrice={product.effectivePrice} />
                  </p>
                  <div className="stars">
                    {[...Array(5)].map((_, j) => (
                      <FaStar
                        key={j}
                        className={`star ${j < Math.round(product.rating) ? "filled" : ""}`}
                      />
                    ))}
                  </div>
                  {(!addedProducts.includes(product.id) || productHasAttributes(product.attributes)) && (
                    <button className="add-btn" onClick={() => handleAddToCart(product)}>
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

      {landingPromos.length > 0 && (
        <div className="view-all-container promos-view-all">
          <Link to={storePath(slug, "deals")} className="view-all-btn">
            View All Deals
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
            refreshFavorites();
            refreshCart();
          }}
        />
      )}
    </div>
  );
};

function PromoHighlightCard({ ad }) {
  const label = ad.subtitle || "";
  const value = ad.title || "";
  const tagline = ad.description || "";
  const promoImage = sizedImageUrl(ad.image, "medium") || ad.image;
  const hasLink = Boolean(ad.linkUrl?.trim());
  const className = `promo-card${hasLink ? " promo-card-clickable" : ""}`;

  const content = (
    <>
      {promoImage && (
        <div className="promo-card-image-wrap">
          <img src={promoImage} alt={value || label || "Promotion"} className="promo-card-image" />
        </div>
      )}
      <div className="promo-card-text">
        {label ? <h3>{label}</h3> : null}
        <h1>{value}</h1>
        {tagline ? <p>{tagline}</p> : null}
      </div>
    </>
  );

  if (!hasLink) {
    return <article className={className}>{content}</article>;
  }

  const link = ad.linkUrl.trim();
  const external = /^https?:\/\//i.test(link);
  if (external) {
    return (
      <a href={link} className={className} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <a href={link} className={className}>
      {content}
    </a>
  );
}

export default LandingPage;
