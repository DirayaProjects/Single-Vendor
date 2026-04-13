import React, { useState } from "react";
import "./cart.css";
import { FaTrashAlt } from "react-icons/fa";
import Header from "../../components/Header/header.jsx";
import Footer from "../../components/Footer/footer.jsx";
import { Link, useLocation } from "react-router-dom";
import { FaCircleCheck } from "react-icons/fa6";
import { useCart } from "../../contexts/CartContext";
import { useStorefrontSettings } from "../../contexts/StorefrontSettingsContext";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import { getUserToken } from "../../services/userAuth";
import { storefrontCheckout } from "../../services/storefrontApi";

const CartPage = () => {
  const { search } = useLocation();
  const { items, removeItem, setQuantity, itemCount, clearCart } = useCart();
  const { features } = useStorefrontSettings();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutDone, setCheckoutDone] = useState(null);

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discount = 0;
  const delivery = items.length ? 10 : 0;
  const total = subtotal - discount + delivery;
  const loggedIn = !!getUserToken();

  const handlePlaceOrder = async () => {
    setCheckoutError("");
    setCheckoutMessage("");
    setCheckoutDone(null);
    if (!features.storefrontCartCheckout) {
      setCheckoutError("Checkout is not enabled for this store.");
      return;
    }
    if (!items.length) return;
    if (!loggedIn) {
      setCheckoutError("Please sign in using Login in the header, then try again.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const res = await storefrontCheckout(items, null);
      clearCart();
      setCheckoutDone(res);
      setCheckoutMessage(`Order #${res.orderId} placed successfully.`);
    } catch (e) {
      setCheckoutError(e.message || "Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <>
      <Header />

      <div className="cart-page">
        <div className="cart-container">
          <h2>Your cart</h2>
          {!features.storefrontCartCheckout && (
            <p className="cart-empty" role="status">
              Shopping cart and checkout are not enabled for this store.
            </p>
          )}
          {features.storefrontCartCheckout && itemCount === 0 && (
            checkoutDone ? (
              <div className="cart-checkout-done-card cart-checkout-done-card--hero" role="status" aria-live="polite">
                <FaCircleCheck className="cart-checkout-done-icon" />
                <div>
                  <h4>Order placed successfully</h4>
                  <p>
                    Your order <strong>#{checkoutDone.orderId}</strong> is confirmed. Total{" "}
                    <strong>${Number(checkoutDone.total).toFixed(2)}</strong>.
                  </p>
                  <Link to={{ pathname: "/products", search }} className="cart-empty-link">
                    Continue shopping
                  </Link>
                </div>
              </div>
            ) : (
              <p className="cart-empty">
                Your cart is empty.{" "}
                <Link to={{ pathname: "/products", search }} className="cart-empty-link">
                  Browse products
                </Link>
              </p>
            )
          )}

          {features.storefrontCartCheckout && items.length > 0 && (
            <div className="cart-content">
              <div className="cart-items">
                {items.map((item) => (
                  <div key={item.itemKey || item.productId} className="cart-item">
                    <div className="item-info">
                      <div className="item-image">
                        {item.imageUrl ? (
                          <img src={resolveMediaUrl(item.imageUrl)} alt="" />
                        ) : null}
                      </div>
                      <div>
                        <p className="item-name">{item.name}</p>
                        <p className="item-details">Qty × ${Number(item.price).toFixed(2)}</p>
                        {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                          <p className="item-attrs">
                            {Object.entries(item.selectedAttributes)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="item-price">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="item-actions">
                      <div className="quantity-control">
                        <button type="button" onClick={() => setQuantity(item.itemKey || item.productId, item.quantity - 1)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => setQuantity(item.itemKey || item.productId, item.quantity + 1)}>
                          +
                        </button>
                      </div>
                      <FaTrashAlt className="delete-icon" onClick={() => removeItem(item.itemKey || item.productId)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-summary">
                <h3>Order summary</h3>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>- ${discount.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery (estimate)</span>
                  <span>${delivery.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                {checkoutError && <p className="cart-checkout-error">{checkoutError}</p>}
                {checkoutMessage && <p className="cart-checkout-success">{checkoutMessage}</p>}
                {checkoutDone && (
                  <div className="cart-checkout-done-card" role="status" aria-live="polite">
                    <FaCircleCheck className="cart-checkout-done-icon" />
                    <div>
                      <h4>Checkout completed</h4>
                      <p>
                        Order <strong>#{checkoutDone.orderId}</strong> confirmed, total{" "}
                        <strong>${Number(checkoutDone.total).toFixed(2)}</strong>.
                      </p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  className="cart-place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={checkoutLoading || !items.length}
                >
                  {checkoutLoading ? "Placing order…" : "Place order"}
                </button>
                {!loggedIn && items.length > 0 && (
                  <p className="cart-note">Sign in from the header to place an order. Your cart is saved in this browser for the current store.</p>
                )}
                {loggedIn && (
                  <p className="cart-note">Delivery fee matches checkout ($10). Stock is reserved when you place the order.</p>
                )}
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
