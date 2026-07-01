import React, { useEffect, useState } from "react";
import "./myOrders.css";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import AuthModal from "../../components/AuthModal/AuthModal";
import { useCart, useCustomerAuth } from "../../contexts/CartContext";
import { getMyOrders } from "../../services/myOrdersApi";

const MyOrdersPage = () => {
  const { itemCount } = useCart();
  const { isCustomer, session } = useCustomerAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    if (!isCustomer || !session?.userId) {
      setOrders([]);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getMyOrders(session.userId);
        if (mounted) setOrders(data);
      } catch {
        if (mounted) setOrders([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isCustomer, session?.userId]);

  if (!isCustomer) {
    return (
      <>
        <Header cartCount={0} onRequireLogin={() => setShowAuth(true)} />
        <div className="my-orders-page">
          <div className="my-orders-container">
            <h2>My Orders</h2>
            <p className="empty-orders-text">Please log in to view your orders.</p>
            <button className="orders-action-btn" onClick={() => setShowAuth(true)}>Log In</button>
          </div>
        </div>
        <Footer />
        {showAuth && <AuthModal mode="login" onClose={() => setShowAuth(false)} />}
      </>
    );
  }

  return (
    <>
      <Header cartCount={itemCount} />

      <div className="my-orders-page">
        <div className="my-orders-container">
          <h2>My Orders</h2>

          {loading ? (
            <p className="empty-orders-text">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="empty-orders-text">You have not placed any orders yet.</p>
          ) : (
            <div className="orders-list">
              {orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h4>Order #{order.id}</h4>
                      <p className="order-date">{order.date}</p>
                    </div>
                    <span className={`order-status status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={`${order.id}-${index}`} className="order-item-row">
                        <span>{item.productName} × {item.quantity}</span>
                        <span>${Number(item.lineTotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-totals">
                    <div className="order-total-row">
                      <span>Subtotal</span>
                      <span>${Number(order.subTotal).toFixed(2)}</span>
                    </div>
                    <div className="order-total-row">
                      <span>Delivery</span>
                      <span>${Number(order.deliveryFee).toFixed(2)}</span>
                    </div>
                    <div className="order-total-row total">
                      <span>Total</span>
                      <span>${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>

                  {order.description && (
                    <p className="order-note">Note: {order.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default MyOrdersPage;
