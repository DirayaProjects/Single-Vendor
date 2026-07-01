import React, { useEffect, useState } from "react";

import "./header.css";

import { FaSearch, FaShoppingBag, FaHeart, FaBars, FaTimes } from "react-icons/fa";

import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthModal from "../AuthModal/AuthModal";

import { useStorefront } from "../../contexts/StorefrontContext";

import { useCart } from "../../contexts/CartContext";

import { useFavorites } from "../../contexts/FavoritesContext";

import { storePath } from "../../services/storefrontApi";

import { sizedImageUrl } from "../../services/uploadApi";

import { clearAuthSession, getAuthSession, AUTH_CHANGED_EVENT } from "../../services/authApi";



const Header = ({ cartCount = 0, onRequireLogin }) => {

  const { slug, settings, categories } = useStorefront();

  const { refreshCart } = useCart();

  const { count: favoriteCount, refreshFavorites } = useFavorites();

  const location = useLocation();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const [category, setCategory] = useState("");

  const [showAuth, setShowAuth] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [search, setSearch] = useState("");

  const [user, setUser] = useState(() => getAuthSession());



  const logoImage = sizedImageUrl(settings?.logo, "thumb") || settings?.logo;

  const homeTo = storePath(slug);

  const productsTo = storePath(slug, "products");

  const cartTo = storePath(slug, "cart");

  const wishlistTo = storePath(slug, "wishlist");

  const ordersTo = storePath(slug, "orders");
  const dealsTo = storePath(slug, "deals");

  const isLoggedIn = Boolean(user?.userId);



  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearch(params.get("search") || "");
  }, [location.search]);

  useEffect(() => {
    setUser(getAuthSession());
  }, [location.pathname, location.search]);

  useEffect(() => {
    const syncAuth = () => setUser(getAuthSession());
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth);
  }, []);



  const openAuthModal = (mode) => {

    setAuthMode(mode);

    setShowAuth(true);

  };



  const handleAuthSuccess = (result) => {
    setUser(result);
    setShowAuth(false);
    refreshCart();
    refreshFavorites();
  };



  const handleSignOut = () => {

    clearAuthSession();

    setUser(null);

    refreshCart();

    refreshFavorites();

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
    const term = search.trim();
    if (!term) return;
    navigate(`${productsTo}?search=${encodeURIComponent(term)}`);
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

            <Link to={dealsTo} className="nav-link">Deals</Link>

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

            <button type="submit" className="search-icon-btn" aria-label="Search">
              <FaSearch className="search-icon" />
            </button>

          </form>

        </div>



        <div className="navbar-right">

          {isLoggedIn ? (

            <>

              <Link to={ordersTo} className="nav-account-link" title={user.userName || user.email}>

                Account

              </Link>

              <button type="button" className="nav-btn" onClick={handleSignOut}>

                Sign Out

              </button>

            </>

          ) : (

            <>

              <button className="nav-btn" onClick={() => openAuthModal("login")}>

                Login

              </button>



              <button className="nav-btn sign" onClick={() => openAuthModal("signup")}>

                Sign Up

              </button>

            </>

          )}



          <Link to={cartTo} className="cart-link">

            <FaShoppingBag className="nav-icon cart" />

            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}

          </Link>



          <Link to={wishlistTo} className="cart-link" title="Wishlist">

            <FaHeart className="nav-icon" />

            {favoriteCount > 0 && <span className="cart-badge">{favoriteCount}</span>}

          </Link>



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

          onSuccess={handleAuthSuccess}

        />

      )}

    </>

  );

};



export default Header;

