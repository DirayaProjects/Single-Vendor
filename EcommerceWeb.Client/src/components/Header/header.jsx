import React, { useState } from "react";
import "./header.css";
import { FaSearch, FaShoppingBag, FaHeart, FaBars, FaTimes } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import AuthModal from "../AuthModal/AuthModal";
import { useStorefront } from "../../contexts/StorefrontContext";
import { useCart } from "../../contexts/CartContext";
import { storePath } from "../../services/storefrontApi";
import { sizedImageUrl } from "../../services/uploadApi";

const Header = ({ cartCount = 0, onRequireLogin }) => {
  const { slug, settings, categories } = useStorefront();
  const { refreshCart } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [search, setSearch] = useState("");

  const logoImage = sizedImageUrl(settings?.logo, "thumb") || settings?.logo;
  const homeTo = storePath(slug);
  const productsTo = storePath(slug, "products");
  const cartTo = storePath(slug, "cart");

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    if (value) {
      window.location.href = `${productsTo}?categoryId=${encodeURIComponent(value)}`;
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    window.location.href = `${productsTo}?search=${encodeURIComponent(search.trim())}`;
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <Link to={homeTo} className="logo-link">
            {logoImage ? (
              <img src={logoImage} alt={settings?.logoName || "Logo"} className="logo-image" />
            ) : (
              <h1 className="logo">{settings?.logoName || "LOGO"}</h1>
            )}
          </Link>

          <div className={`nav-links ${menuOpen ? "active" : ""}`}>
            <select
              className="dropdown-select"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="">Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <Link to={productsTo} className="nav-link">All Products</Link>
          </div>
        </div>

        <div className="navbar-center">
          <form className="search-container" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FaSearch className="search-icon" />
          </form>
        </div>

        <div className="navbar-right">
          <button className="nav-btn" onClick={() => openAuthModal("login")}>
            Login
          </button>

          <button className="nav-btn sign" onClick={() => openAuthModal("signup")}>
            Sign Up
          </button>

          <Link to={cartTo} className="cart-link">
            <FaShoppingBag className="nav-icon cart" />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <FaHeart className="nav-icon" />

          <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          mode={authMode}
          redirectUrl={location.pathname + location.search}
          onSuccess={() => {
            setShowAuth(false);
            refreshCart();
            onRequireLogin?.();
          }}
        />
      )}
    </>
  );
};

export default Header;
