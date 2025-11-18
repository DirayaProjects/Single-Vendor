import React, { useState } from "react";
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
  CartesianGrid,Area, AreaChart
} from "recharts";
import "./dashboard.css";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Cards stats
  const stats = [
    { title: "Users", value: "1,245", icon: <FaUsers />, type: "users" },
    { title: "Orders Today", value: "320", icon: <FaShoppingCart />, type: "orders" },
    { title: "Revenue", value: "$7,540", icon: <FaDollarSign />, type: "revenue" },
    { title: "Products", value: "148", icon: <FaBoxOpen />, type: "products" },
  ];

  // Bar chart data
  const barData = [
    { month: "Jan", revenue: 4000, orders: 240 },
    { month: "Feb", revenue: 3000, orders: 139 },
    { month: "Mar", revenue: 5000, orders: 320 },
    { month: "Apr", revenue: 4000, orders: 280 },
  ];

  // Pie chart data
  const pieData = [
    { name: "Completed Orders", value: 280 },
    { name: "Pending Orders", value: 40 },
  ];

  const COLORS = ["#161f55", "#ff9800"];

  // Line chart: Top Selling Products
  const topProductsData = [
    { date: "2025-11-01", "Product A": 30, "Product B": 20, "Product C": 10 },
    { date: "2025-11-02", "Product A": 25, "Product B": 28, "Product C": 15 },
    { date: "2025-11-03", "Product A": 40, "Product B": 30, "Product C": 25 },
    { date: "2025-11-04", "Product A": 35, "Product B": 25, "Product C": 20 },
  ];

  // Line chart: Average Order Value
  const avgOrderData = [
    { date: "2025-11-01", avg: 45 },
    { date: "2025-11-02", avg: 50 },
    { date: "2025-11-03", avg: 47 },
    { date: "2025-11-04", avg: 55 },
  ];

  // Line chart: Category Sales
  const categorySalesData = [
    { date: "2025-11-01", Electronics: 120, Clothing: 80, Home: 60 },
    { date: "2025-11-02", Electronics: 90, Clothing: 110, Home: 70 },
    { date: "2025-11-03", Electronics: 150, Clothing: 90, Home: 100 },
    { date: "2025-11-04", Electronics: 130, Clothing: 100, Home: 80 },
  ];

  return (
    <div className="dashboard-wrapper">
      <Sidebar onToggle={setSidebarOpen} />
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        <h2 className="dashboard-title">Admin Dashboard</h2>

        {/* CARDS */}
        
         {/* CARDS */}
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
        <div className="charts-container">
          <div className="chart-wrapper">
            <h3>Monthly Revenue & Orders</h3>
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

          {/* NEW LINE CHARTS */}
          <div className="chart-wrapper full-width-chart">
            <h3>Top Selling Products Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={topProductsData}>
                <XAxis dataKey="date" stroke="#161f55" />
                <YAxis stroke="#161f55" />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Product A" stroke="#6366f1" />
                <Line type="monotone" dataKey="Product B" stroke="#f59e0b" />
                <Line type="monotone" dataKey="Product C" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* AREA CHART – Average Order Value Trend */}
        <div className="chart-wrapper full-width-chart">
          <h3>Average Order Value Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={avgOrderData}>
      <     defs>
        <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#352a68ff" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#0e4f6dff" stopOpacity={0}/>
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
</div>


          <div className="chart-wrapper full-width-chart">
            <h3>Category Sales Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={categorySalesData}>
                <XAxis dataKey="date" stroke="#161f55" />
                <YAxis stroke="#161f55" />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Electronics" stroke="#6366f1" />
                <Line type="monotone" dataKey="Clothing" stroke="#f59e0b" />
                <Line type="monotone" dataKey="Home" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
