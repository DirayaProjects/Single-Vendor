import React, { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "../../../components/AdminSidebar/sidebar";
import { useAdminStore } from "../../../contexts/AdminStoreContext";
import { FaUsers, FaShoppingCart, FaDollarSign, FaBoxOpen } from "react-icons/fa";
import { adminApi } from "../../../services/adminApi";
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
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  ComposedChart,
  Line,
} from "recharts";
import "./dashboard.css";

const fmtMoney = (n) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(
    Number(n) || 0
  );

const Dashboard = () => {
  const { features } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [liveStats, setLiveStats] = useState(null);
  const [statsError, setStatsError] = useState("");
  const [charts, setCharts] = useState(null);
  const [chartsError, setChartsError] = useState("");

  const loadStats = useCallback(async () => {
    setStatsError("");
    try {
      const s = await adminApi("/api/admin/dashboard/stats");
      setLiveStats(s);
    } catch (e) {
      setLiveStats(null);
      setStatsError(e.message || "Could not load stats.");
    }
  }, []);

  const loadCharts = useCallback(async () => {
    setChartsError("");
    try {
      const c = await adminApi("/api/admin/dashboard/charts");
      setCharts(c);
    } catch (e) {
      setCharts(null);
      setChartsError(e.message || "Could not load chart data.");
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadCharts();
  }, [loadStats, loadCharts]);

  const stats = useMemo(() => {
    const all = [
      {
        title: "Users",
        value: liveStats ? String(liveStats.userCount) : "—",
        icon: <FaUsers />,
        type: "users",
      },
      {
        title: "Orders Today",
        value: liveStats ? String(liveStats.ordersToday) : "—",
        icon: <FaShoppingCart />,
        type: "orders",
      },
      {
        title: "Revenue (today)",
        value: liveStats ? fmtMoney(liveStats.revenueToday) : "—",
        icon: <FaDollarSign />,
        type: "revenue",
      },
      {
        title: "Products",
        value: liveStats ? String(liveStats.productCount) : "—",
        icon: <FaBoxOpen />,
        type: "products",
      },
    ];
    if (!features.adminSalesAnalytics)
      return all.filter((s) => s.type !== "orders" && s.type !== "revenue");
    return all;
  }, [liveStats, features.adminSalesAnalytics]);

  const revenueByDay = charts?.revenueByDay || [];
  const pieData =
    charts?.ordersByStatus?.length > 0
      ? charts.ordersByStatus
      : [{ name: "No orders", value: 1 }];
  const topProducts = charts?.topProducts || [];

  const COLORS = ["#161f55", "#ff9800", "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6"];

  return (
    <div className="dashboard-wrapper">
      <Sidebar onToggle={setSidebarOpen} />
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <h2 className="dashboard-title">Admin Dashboard</h2>
        {statsError && <p className="dashboard-stats-error">{statsError}</p>}
        {chartsError && <p className="dashboard-stats-error">{chartsError}</p>}

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


        {/* Charts */}
        {features.adminSalesAnalytics && (
        <div className="charts-container">
          <div className="chart-wrapper">
            <h3>Daily revenue &amp; orders (last 14 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={revenueByDay}>
                <XAxis dataKey="date" stroke="#161f55" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#161f55" />
                <YAxis yAxisId="right" orientation="right" stroke="#ff9800" allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="revenue" fill="#161f55" name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#ff9800" name="Orders" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper">
            <h3>Orders Status</h3>
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
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper full-width-chart">
            <h3>Top products by units sold</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 24, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="quantitySold" fill="#161f55" name="Units sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-wrapper full-width-chart">
            <h3>Average order value (14 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueByDay}>
                <defs>
                  <linearGradient id="colorAvgOrder" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#352a68" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0e4f6d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#161f55" tick={{ fontSize: 11 }} />
                <YAxis stroke="#161f55" />
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="avgOrder"
                  stroke="#eba337"
                  strokeWidth={2.5}
                  fill="url(#colorAvgOrder)"
                  name="Avg order"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
