import React, { useEffect, useMemo, useState } from "react";
import "./cart.css";
import { FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/header.jsx";
import Footer from "../../components/Footer/footer.jsx";
import AuthModal from "../../components/AuthModal/AuthModal";
import PriceDisplay from "../../components/PriceDisplay/PriceDisplay";
import { useCart, useCustomerAuth } from "../../contexts/CartContext";
import { useStorefront } from "../../contexts/StorefrontContext";
import { checkout, previewCheckout } from "../../services/checkoutApi";
import { getStorefrontDeliveryCities } from "../../services/deliveryCitiesApi";
import { storePath } from "../../services/storefrontApi";
import { sizedImageUrl } from "../../services/uploadApi";
import { formatSelectedAttributes } from "../../utils/productAttributes";

const emptyForm = {
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",
  deliveryCityId: "",
  description: "",
};

function buildPreviewPayload(session, form) {
  return {
    customerName: (form.customerName || session?.userName || "-").trim(),
    customerPhone: (form.customerPhone || "-").trim(),
    customerEmail: (form.customerEmail || session?.email || "-").trim(),
    customerAddress: (form.customerAddress || "-").trim(),
    deliveryCityId: form.deliveryCityId ? Number(form.deliveryCityId) : 0,
    description: form.description.trim() || undefined,
    applySpinWheelPrize: true,
  };
}

function isFormComplete(form) {
  return Boolean(
    form.customerName?.trim()
    && form.customerPhone?.trim()
    && form.customerEmail?.trim()
    && form.customerAddress?.trim()
    && form.deliveryCityId
  );
}

function OrderTotals({ preview, items, cities, deliveryCityId }) {
  const priceBefore = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
  const clientNet = items.reduce(
    (sum, item) => sum + Number(item.effectivePrice ?? item.price) * item.quantity,
    0
  );
  const previewSubTotal = preview?.subTotal > 0 ? preview.subTotal : clientNet;
  const spinAndFirst = (preview?.spinWheelDiscount ?? 0) + (preview?.firstOrderDiscount ?? 0);
  const totalDiscount = preview?.totalDiscount > 0
    ? preview.totalDiscount
    : Math.max(0, priceBefore - previewSubTotal) + spinAndFirst;
  const selectedCity = cities.find((c) => String(c.id) === String(deliveryCityId));
  const deliveryFee = preview?.deliveryFee ?? (selectedCity ? Number(selectedCity.deliveryFee) : 0);
  const deliveryName = preview?.deliveryCityName || selectedCity?.name || "";
  const total = preview?.total ?? Math.max(0, previewSubTotal - spinAndFirst) + deliveryFee;

  return (
    <div className="checkout-preview order-totals-card">
      <div className="summary-row">
        <span>Subtotal</span>
        <span>${priceBefore.toFixed(2)}</span>
      </div>

      {totalDiscount > 0 && (
        <div className="summary-row summary-discount">
          <span>Discounts</span>
          <span>-${totalDiscount.toFixed(2)}</span>
        </div>
      )}

      <div className="summary-row">
        <span>Delivery{deliveryName ? ` (${deliveryName})` : ""}</span>
        <span>${deliveryFee.toFixed(2)}</span>
      </div>

      <div className="summary-row total">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  );
}

const CartPage = () => {
  const { slug } = useStorefront();
  const navigate = useNavigate();
  const { items, itemCount, updateItem, removeItem, refreshCart } = useCart();
  const { isCustomer, session } = useCustomerAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [cities, setCities] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);

  const readyToOrder = useMemo(() => isFormComplete(form), [form]);

  useEffect(() => {
    if (!slug || !isCustomer) return;
    getStorefrontDeliveryCities(slug)
      .then(setCities)
      .catch(() => setCities([]));
  }, [slug, isCustomer]);

  useEffect(() => {
    if (!session) return;
    setForm((f) => ({
      ...f,
      customerEmail: f.customerEmail || session.email || "",
      customerName: f.customerName || session.userName || "",
    }));
  }, [session]);

  useEffect(() => {
    if (!session?.userId || items.length === 0) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await previewCheckout(session.userId, buildPreviewPayload(session, form));
        setPreview(data);
      } catch {
        setPreview(null);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [session?.userId, items, form]);

  const openDetailsModal = () => {
    if (session) {
      setForm((f) => ({
        ...f,
        customerEmail: f.customerEmail || session.email || "",
        customerName: f.customerName || session.userName || "",
      }));
    }
    setShowDetailsModal(true);
  };

  const handleQuantityChange = async (cartItemId, change, currentQty) => {
    await updateItem(cartItemId, Math.max(1, currentQty + change));
  };

  const handleRemove = async (cartItemId) => {
    await removeItem(cartItemId);
  };

  const handlePlaceOrder = async () => {
    if (!session?.userId || items.length === 0 || !readyToOrder) return;

    setCheckoutError("");
    setCheckingOut(true);

    try {
      await checkout(session.userId, {
        ...buildPreviewPayload(session, form),
        deliveryCityId: Number(form.deliveryCityId),
      });
      await refreshCart();
      navigate(storePath(slug, "orders"));
    } catch (err) {
      setCheckoutError(err.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  if (!isCustomer) {
    return (
      <>
        <Header cartCount={0} onRequireLogin={() => setShowAuth(true)} />
        <div className="cart-page">
          <div className="cart-container">
            <h2>Your Cart</h2>
            <p className="empty-cart-text">Please log in to view your cart.</p>
            <button className="checkout-btn" type="button" onClick={() => setShowAuth(true)}>Log In</button>
          </div>
        </div>
        <Footer />
        {showAuth && (
          <AuthModal mode="login" onClose={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); refreshCart(); }} />
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
                        {image ? <img src={image} alt={item.name} className="item-image-real" /> : <div className="item-image" />}
                        <div>
                          <p className="item-name">{item.name}</p>
                          {formatSelectedAttributes(item.selectedAttributes) && (
                            <p className="item-attributes">{formatSelectedAttributes(item.selectedAttributes)}</p>
                          )}
                          <p className="item-details">{item.details || "—"}</p>
                          <p className="item-price">
                            <PriceDisplay price={item.price} salePrice={item.salePrice} effectivePrice={item.effectivePrice} />
                          </p>
                        </div>
                      </div>
                      <div className="item-actions">
                        <div className="quantity-control">
                          <button type="button" onClick={() => handleQuantityChange(item.id, -1, item.quantity)}>-</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => handleQuantityChange(item.id, 1, item.quantity)}>+</button>
                        </div>
                        <FaTrashAlt className="delete-icon" onClick={() => handleRemove(item.id)} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="order-summary">
                <h3>Order Summary</h3>

                <label className="summary-field">
                  Delivery city
                  <select
                    value={form.deliveryCityId}
                    onChange={(e) => setForm({ ...form, deliveryCityId: e.target.value })}
                  >
                    <option value="">Select city for delivery fee</option>
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (${Number(c.deliveryFee).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </label>

                {preview?.hasUnusedSpinPrize && preview.spinWheelDiscount <= 0 && (
                  <p className="cart-discount-note">You have a spin wheel prize — it will apply to this order.</p>
                )}

                <OrderTotals
                  preview={preview}
                  items={items}
                  cities={cities}
                  deliveryCityId={form.deliveryCityId}
                />

                <button type="button" className="secondary-checkout-btn" onClick={openDetailsModal}>
                  {readyToOrder ? "Edit delivery details" : "Fill delivery details"}
                </button>

                {checkoutError && <p className="checkout-error">{checkoutError}</p>}

                <button
                  type="button"
                  className="checkout-btn place-order-btn"
                  onClick={handlePlaceOrder}
                  disabled={checkingOut || !readyToOrder || !form.deliveryCityId}
                >
                  {checkingOut ? "Placing order..." : "Place Order"}
                </button>

                {!readyToOrder && (
                  <p className="checkout-hint">Fill your delivery details and select a city to place your order.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showDetailsModal && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            <button type="button" className="checkout-close" onClick={() => setShowDetailsModal(false)}>×</button>
            <h3>Delivery details</h3>
            <p className="checkout-modal-sub">Your information is saved when you close this window.</p>
            <div className="checkout-form">
              <label>
                Full Name
                <input required value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
              </label>
              <label>
                Phone
                <input required value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
              </label>
              <label>
                Email
                <input type="email" required value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
              </label>
              <label>
                Address
                <textarea required value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />
              </label>
              <label>
                Order notes (optional)
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </label>
              <button type="button" className="checkout-btn" onClick={() => setShowDetailsModal(false)}>
                Save &amp; close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default CartPage;
