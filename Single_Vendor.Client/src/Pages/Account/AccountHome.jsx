import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/Header/header";
import Footer from "../../components/Footer/footer";
import { clearUserToken } from "../../services/userAuth";
import { userApi } from "../../services/userApi";
import "./accountHome.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
    Number(n) || 0
  );

const AccountHome = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setOrdersError("");
    setOrdersLoading(true);
    try {
      const list = await userApi("/api/me/orders");
      setOrders(Array.isArray(list) ? list : []);
    } catch (e) {
      setOrders([]);
      setOrdersError(e.message || "Could not load orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const signOut = () => {
    clearUserToken();
    navigate("/", { replace: true });
  };

  const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const deliveredCount = orders.filter((o) => String(o.status || "").toLowerCase() === "delivered").length;

  return (
    <div className="account-page">
      <Header />
      <main className="account-main">
        <section className="account-hero">
          <div>
            <h1>My account</h1>
            <p className="account-lead">Track your orders, manage your shopping activity, and continue browsing your store.</p>
          </div>
          <div className="account-status-card">
            <h4>Account status</h4>
            <p>Signed in and ready to order</p>
          </div>
        </section>

        <section className="account-kpis" aria-label="Account overview">
          <article className="account-kpi-card">
            <h3>{orders.length}</h3>
            <p>Total orders</p>
          </article>
          <article className="account-kpi-card">
            <h3>{fmtMoney(totalSpent)}</h3>
            <p>Total spent</p>
          </article>
          <article className="account-kpi-card">
            <h3>{deliveredCount}</h3>
            <p>Delivered orders</p>
          </article>
        </section>

        <div className="account-actions">
          <Link to={{ pathname: "/products", search }} className="account-link-btn">
            Browse products
          </Link>
          <Link to={{ pathname: "/cart", search }} className="account-link-btn account-link-btn--secondary">
            View cart
          </Link>
          <button type="button" className="account-signout" onClick={signOut}>
            Sign out
          </button>
        </div>

        <section className="account-orders">
          <h2>Your orders</h2>
          {ordersLoading && <p className="account-orders-hint">Loading orders…</p>}
          {ordersError && <p className="account-orders-error">{ordersError}</p>}
          {!ordersLoading && !ordersError && orders.length === 0 && (
            <p className="account-orders-empty">No orders yet. When you place an order from your cart, it will show here.</p>
          )}
          {!ordersLoading && orders.length > 0 && (
            <div className="account-orders-table-wrap">
              <table className="account-orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Lines</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderId}>
                      <td>#{o.orderId}</td>
                      <td>{o.orderDate}</td>
                      <td>{o.lineCount}</td>
                      <td>{fmtMoney(o.total)}</td>
                      <td>{o.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AccountHome;
