import React, { useState } from "react";
import "./wishlist.css";
import { FaTrashAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import AuthModal from "../../components/AuthModal/AuthModal";
import { useFavorites } from "../../contexts/FavoritesContext";
import { useCart, useCustomerAuth } from "../../contexts/CartContext";
import { useStorefront } from "../../contexts/StorefrontContext";
import { storePath } from "../../services/storefrontApi";
import { sizedImageUrl } from "../../services/uploadApi";

const WishlistPage = () => {
  const { slug } = useStorefront();
  const { items, toggleFavorite, refreshFavorites } = useFavorites();
  const { itemCount, addItem } = useCart();
  const { isCustomer } = useCustomerAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleToggle = async (productId) => {
    try {
      const result = await toggleFavorite(productId);
      if (result?.needsLogin) {
        setShowAuth(true);
      }
    } catch (err) {
      alert(err.message || "Failed to update wishlist");
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      const result = await addItem(productId, 1);
      if (result?.needsLogin) {
        setShowAuth(true);
      }
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  if (!isCustomer) {
    return (
      <>
        <Header cartCount={0} onRequireLogin={() => setShowAuth(true)} />
        <div className="wishlist-page">
          <div className="wishlist-container">
            <h2>My Wishlist</h2>
            <p className="empty-wishlist-text">Please log in to view your wishlist.</p>
            <button className="wishlist-action-btn" onClick={() => setShowAuth(true)}>Log In</button>
          </div>
        </div>
        <Footer />
        {showAuth && (
          <AuthModal
            mode="login"
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setShowAuth(false);
              refreshFavorites();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Header cartCount={itemCount} />

      <div className="wishlist-page">
        <div className="wishlist-container">
          <h2>My Wishlist</h2>

          {items.length === 0 ? (
            <p className="empty-wishlist-text">Your wishlist is empty.</p>
          ) : (
            <div className="wishlist-grid">
              {items.map((item) => {
                const image = sizedImageUrl(item.image, "medium") || item.image;
                return (
                  <div key={item.productId} className="wishlist-card">
                    <Link to={storePath(slug, `item/${item.productId}`)} className="wishlist-image-link">
                      {image ? (
                        <img src={image} alt={item.name} className="wishlist-image" />
                      ) : (
                        <div className="wishlist-image-placeholder" />
                      )}
                    </Link>
                    <div className="wishlist-info">
                      <h4>{item.name}</h4>
                      <p>{item.details || "—"}</p>
                      <p className="wishlist-price">${Number(item.price).toFixed(2)}</p>
                      <div className="wishlist-actions">
                        <button
                          type="button"
                          className="wishlist-action-btn"
                          onClick={() => handleAddToCart(item.productId)}
                        >
                          Add to Cart
                        </button>
                        <button
                          type="button"
                          className="wishlist-remove-btn"
                          onClick={() => handleToggle(item.productId)}
                          title="Remove from wishlist"
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {showAuth && (
        <AuthModal
          mode="login"
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            refreshFavorites();
          }}
        />
      )}
    </>
  );
};

export default WishlistPage;
