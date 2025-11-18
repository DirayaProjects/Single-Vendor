import React, { useState } from "react";
import "./item.css";
import Header from "../../components/Header/header.jsx";
import Footer from "../../components/Footer/footer.jsx";

const Item = () => {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState("red");

  const colors = ["#795757", "#D32F2F", "#000000"];

  return (
    <div className="product-page">

      <Header />

      {/* Add spacing so header doesn't overlap content */}
      <div className="product-wrapper">

        <div className="product-container">
          {/* Left section */}
          <div className="product-image-section">
            <div className="main-image"></div>

            <div className="thumbnail-row">
              <div className="thumb"></div>
              <div className="thumb"></div>
              <div className="thumb"></div>
            </div>
          </div>

          {/* Right section */}
          <div className="product-details">
            <h2>Item name</h2>
            <p className="price">40$</p>
            <p className="details">details....</p>
            <p className="stars">☆☆☆☆☆</p>

            <div className="colors">
              <p>Choose a color</p>
              <div className="color-options">
                {colors.map((c) => (
                  <span
                    key={c}
                    style={{
                      backgroundColor: c,
                      border:
                        selectedColor === c ? "2px solid #0B1E3D" : "1px solid #ccc",
                    }}
                    onClick={() => setSelectedColor(c)}
                    className="color-circle"
                  ></span>
                ))}
              </div>
            </div>

            <div className="quantity-control">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                -
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>

            <div className="buttons">
              <button className="buy-now">Buy Now</button>
              <button className="add-cart">Add to Cart</button>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
};

export default Item;
