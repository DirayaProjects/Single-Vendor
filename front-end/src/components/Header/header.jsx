import React, { useState } from "react";
import "./header.css";
import { FaSearch, FaShoppingBag, FaHeart, FaBars, FaTimes } from "react-icons/fa";
import AuthModal from "../AuthModal/AuthModal"; // adjust path

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState("Eng");
  const [category, setCategory] = useState("Categories");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  const handleLanguageChange = (e) => setLanguage(e.target.value);
  const handleCategoryChange = (e) => setCategory(e.target.value);

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-left">
          <h1 className="logo">LOGO</h1>

          <div className={`nav-links ${menuOpen ? "active" : ""}`}>
            <select
              className="dropdown-select"
              value={category}
              onChange={handleCategoryChange}
            >
              <option value="Categories">Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home">Home</option>
              <option value="Beauty">Beauty</option>
            </select>

            <a href="#" className="nav-link">Deals</a>
            <a href="#" className="nav-link">What’s new</a>
          </div>
        </div>

        <div className="navbar-center">
          <div className="search-container">
            <input type="text" placeholder="Search..." className="search-input" />
            <FaSearch className="search-icon" />
          </div>
        </div>

        <div className="navbar-right">
          {/* Login & Sign Up buttons */}
          <button className="nav-btn" onClick={() => openAuthModal("login")}>Login</button>
          <button className="nav-btn sign" onClick={() => openAuthModal("signup")}>Sign Up</button>

          <select
            className="dropdown-select"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="Eng">Eng</option>
            <option value="Ar">Ar</option>
          </select>

          <FaShoppingBag className="nav-icon" />
          <FaHeart className="nav-icon" />

          <img
            src="https://i.pravatar.cc/35"
            alt="User Avatar"
            className="user-avatar"
          />

          <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </div>
        </div>
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          mode={authMode}
        />
      )}
    </>
  );
};

export default Header;
