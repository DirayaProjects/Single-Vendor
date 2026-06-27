import React, { useState } from "react";
import "./cart.css";
import { FaTrashAlt } from "react-icons/fa";
import Header from "../../components/Header/header.jsx";
import Footer from "../../components/Footer/footer.jsx";
import AuthModal from "../../components/AuthModal/AuthModal";
import { useCart, useCustomerAuth } from "../../contexts/CartContext";
import { sizedImageUrl } from "../../services/uploadApi";

const CartPage = () => {
  const { items, subtotal, itemCount, updateItem, removeItem, refreshCart } = useCart();
  const { isCustomer } = useCustomerAuth();
  const [showAuth, setShowAuth] = useState(false);

  const delivery = items.length > 0 ? 10 : 0;
  const total = subtotal + delivery;

  const handleQuantityChange = async (cartItemId, change, currentQty) => {
    await updateItem(cartItemId, Math.max(1, currentQty + change));
  };

  const handleRemove = async (cartItemId) => {
    await removeItem(cartItemId);
  };

  if (!isCustomer) {
    return (
      <>
        <Header cartCount={0} onRequireLogin={() => setShowAuth(true)} />
        <div className="cart-page">
          <div className="cart-container">
            <h2>Your Cart</h2>
            <p className="empty-cart-text">Please log in to view your cart.</p>
            <button className="checkout-btn" onClick={() => setShowAuth(true)}>Log In</button>
          </div>
        </div>
        <Footer />
        {showAuth && (
          <AuthModal
            mode="login"
            onClose={() => setShowAuth(false)}
            onSuccess={() => {
              setShowAuth(false);
              refreshCart();
            }}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Header cartCount={itemCount} />

      <div className="cart-page">
        <div className="cart-container">
          <h2>Your Cart</h2>

          {items.length === 0 ? (
            <p className="empty-cart-text">Your cart is empty.</p>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                {items.map((item) => {
                  const image = sizedImageUrl(item.image, "medium") || item.image;
                  return (
                    <div key={item.id} className="cart-item">
                      <div className="item-info">
                        {image ? (
                          <img src={image} alt={item.name} className="item-image-real" />
                        ) : (
                          <div className="item-image" />
                        )}
                        <div>
                          <p className="item-name">{item.name}</p>
                          <p className="item-details">{item.details || "—"}</p>
                          <p className="item-price">${Number(item.price).toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="item-actions">
                        <div className="quantity-control">
                          <button type="button" onClick={() => handleQuantityChange(item.id, -1, item.quantity)}>-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => handleQuantityChange(item.id, 1, item.quantity)}>+</button>
                        </div>
                        <FaTrashAlt
                          className="delete-icon"
                          onClick={() => handleRemove(item.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery Fee</span>
                  <span>${delivery.toFixed(2)}</span>
                </div>

                <hr />

                <div className="summary-row total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <button className="checkout-btn">Go to Checkout</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default CartPage;
