import React, { useState } from "react";
import "./landing.css";
import { FaHeart, FaStar } from "react-icons/fa";
import Header from "../../components/Header/header";
import Testimonials from "../../components/Testimonials/Testimonials";
import Footer from "../../components/Footer/footer";
import { Link } from "react-router-dom"

const LandingPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [cart, setCart] = useState([]);

  const products = [...Array(6)].map((_, i) => ({
    id: i + 1,
    name: "Item name",
    price: 40,
  }));

  const toggleFavorite = (id) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((fid) => fid !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const addToCart = (id) => {
    if (!cart.includes(id)) {
      setCart([...cart, id]);
    }
  };

  return (
    <div className="landing">
      <Header cartCount={cart.length} />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h2>Welcome to <span>{`{NAME}`}</span>!</h2>
          <p>Enjoy Shopping</p>
        </div>
        <div className="hero-image"></div>
      </section>

      {/* Promo Section */}
      <section className="promos">
        {[1, 2, 3].map((i) => (
          <div className="promo-card" key={i}>
            <h3>SALE UP TO</h3>
            <h1>50%</h1>
            <p>OFF</p>
          </div>
        ))}
      </section>


      {/* Products Section */}
      <section className="products">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <div className="image-placeholder">
              <FaHeart
                className={`fav-icon ${favorites.includes(product.id) ? "favorited" : ""}`}
                onClick={() => toggleFavorite(product.id)}
              />
            </div>
            <div className="product-info">
              <h4>{product.name}</h4>
              <p>details....</p>
              <p className="price">{product.price}$</p>
              <div className="stars">
                {[...Array(5)].map((_, j) => (
                  <FaStar key={j} className="star" />
                ))}
              </div>
              {!cart.includes(product.id) && (
                <button className="add-btn" onClick={() => addToCart(product.id)}>
                  Add to cart
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
      <div className="view-all-container">
        <Link to="/products" className="view-all-btn">
          View All Products
        </Link>
      </div>

      {/* Best Sellers */}
      <section className="featured">
        <h3>Weekly Best-sellers / Featured Products</h3>
        <div className="featured-grid">
          {[1, 2, 3].map((i) => (
            <div className="featured-card" key={i}></div>
          ))}
        </div>
      </section>

      <Testimonials />
      <Footer />
    </div>
  );
};

export default LandingPage;
