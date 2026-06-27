import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import { FaUsers, FaShoppingCart, FaDollarSign, FaBoxOpen } from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { getDashboard } from "../../../services/dashboardApi";
import "./dashboard.css";

const COLORS = ["#161f55", "#ff9800", "#6366f1", "#10b981", "#f59e0b"];

const LINE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

const mapSeriesPoints = (points = []) =>
  points.map((point) => ({
    date: point.date,
    ...point.values,
  }));

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getDashboard();
        if (isMounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Failed to load dashboard");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (!dashboard?.stats) {
      return [];
    }

    const { users, ordersToday, revenue, products } = dashboard.stats;

    return [
      { title: "Users", value: users.toLocaleString(), icon: <FaUsers />, type: "users" },
      { title: "Orders Today", value: ordersToday.toLocaleString(), icon: <FaShoppingCart />, type: "orders" },
      { title: "Revenue", value: `$${revenue.toLocaleString()}`, icon: <FaDollarSign />, type: "revenue" },
      { title: "Products", value: products.toLocaleString(), icon: <FaBoxOpen />, type: "products" },
    ];
  }, [dashboard]);

  const barData = dashboard?.monthlyRevenueOrders ?? [];
  const pieData = dashboard?.orderStatusBreakdown ?? [];
  const topProductsData = useMemo(
    () => mapSeriesPoints(dashboard?.topSellingProductsOverTime),
    [dashboard]
  );
  const avgOrderData = useMemo(
    () => mapSeriesPoints(dashboard?.averageOrderValueTrend),
    [dashboard]
  );
  const categorySalesData = useMemo(
    () => mapSeriesPoints(dashboard?.categorySalesOverTime),
    [dashboard]
  );

  const topProductKeys = useMemo(() => {
    const keys = new Set();
    topProductsData.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (key !== "date") {
          keys.add(key);
        }
      });
    });
    return [...keys];
  }, [topProductsData]);

  const categoryKeys = useMemo(() => {
    const keys = new Set();
    categorySalesData.forEach((point) => {
      Object.keys(point).forEach((key) => {
        if (key !== "date") {
          keys.add(key);
        }
      });
    });
    return [...keys];
  }, [categorySalesData]);

  return (
    <div className="dashboard-wrapper">
      <Sidebar onToggle={setSidebarOpen} />
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <h2 className="dashboard-title">Admin Dashboard</h2>

        {loading && <p>Loading dashboard...</p>}
        {error && <p className="dashboard-error">{error}</p>}

        {!loading && !error && dashboard && (
          <>
            <div className="dashboard-cards">
              {stats.map((stat, idx) => (
                <div key={idx} className={`dash-card card-${stat.type}`}>
                  <div className="dash-icon">{stat.icon}</div>
                  <div className="dash-info">
                    <h3>{stat.value}</h3>
                    <p>{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="charts-container">
              <div className="chart-wrapper">
                <h3>Monthly Revenue & Orders</h3>
                {barData.length === 0 ? (
                  <p className="chart-empty">No order data for the last 30 days.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <XAxis dataKey="month" stroke="#161f55" />
                      <YAxis stroke="#161f55" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#161f55" />
                      <Bar dataKey="orders" fill="#ff9800" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-wrapper">
                <h3>Orders Status</h3>
                {pieData.length === 0 ? (
                  <p className="chart-empty">No orders to display.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        label
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-wrapper full-width-chart">
                <h3>Top Selling Products Over Time</h3>
                {topProductsData.length === 0 ? (
                  <p className="chart-empty">No product sales data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={topProductsData}>
                      <XAxis dataKey="date" stroke="#161f55" />
                      <YAxis stroke="#161f55" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      {topProductKeys.map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-wrapper full-width-chart">
                <h3>Average Order Value Trend</h3>
                {avgOrderData.length === 0 ? (
                  <p className="chart-empty">No average order value data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={avgOrderData}>
                      <defs>
                        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#352a68ff" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#0e4f6dff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#161f55" />
                      <YAxis stroke="#161f55" />
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="avg"
                        stroke="#eba337ff"
                        strokeWidth={2.5}
                        fill="url(#colorAvg)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="chart-wrapper full-width-chart">
                <h3>Category Sales Over Time</h3>
                {categorySalesData.length === 0 ? (
                  <p className="chart-empty">No category sales data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={categorySalesData}>
                      <XAxis dataKey="date" stroke="#161f55" />
                      <YAxis stroke="#161f55" />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Legend />
                      {categoryKeys.map((key, index) => (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={LINE_COLORS[index % LINE_COLORS.length]}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
