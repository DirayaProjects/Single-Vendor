import React, { useState } from "react";
import "./cart.css";
import { FaTrashAlt } from "react-icons/fa";
import Header from "../../components/Header/header.jsx";
import Footer from "../../components/Footer/footer.jsx";

const CartPage = () => {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Name", details: "Details", price: 120 },
    { id: 2, name: "Name", details: "Details", price: 180 },
    { id: 3, name: "Name", details: "Details", price: 243 },
  ]);

  const [quantities, setQuantities] = useState(
    cartItems.reduce((acc, item) => ({ ...acc, [item.id]: 1 }), {})
  );

  const handleQuantityChange = (id, change) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, prev[id] + change),
    }));
  };

  const handleRemove = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.price * quantities[item.id],
    0
  );
  const discount = 11;
  const delivery = 10;
  const total = subtotal - discount + delivery;

  return (
    <>
      <Header />

      <div className="cart-page">
        <div className="cart-container">
          <h2>Your Cart</h2>

          <div className="cart-content">
            {/* Left - Cart Items */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <div className="item-image"></div>
                    <div>
                      <p className="item-name">{item.name}</p>
                      <p className="item-details">{item.details}</p>
                      <p className="item-price">{item.price}$</p>
                    </div>
                  </div>

                  <div className="item-actions">
                    <div className="quantity-control">
                      <button onClick={() => handleQuantityChange(item.id, -1)}>
                        -
                      </button>
                      <span>{quantities[item.id]}</span>
                      <button onClick={() => handleQuantityChange(item.id, 1)}>
                        +
                      </button>
                    </div>
                    <FaTrashAlt
                      className="delete-icon"
                      onClick={() => handleRemove(item.id)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right - Order Summary */}
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{subtotal}$</span>
              </div>
              <div className="summary-row">
                <span>Discount</span>
                <span className="discount">-{discount}$</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{delivery}$</span>
              </div>

              <hr />

              <div className="summary-row total">
                <span>Total</span>
                <span>{total}$</span>
              </div>

              <div className="promo-section">
                <input type="text" placeholder="promo code" />
                <button className="apply-btn">Apply</button>
              </div>

              <button className="checkout-btn">Go to Checkout</button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CartPage;
