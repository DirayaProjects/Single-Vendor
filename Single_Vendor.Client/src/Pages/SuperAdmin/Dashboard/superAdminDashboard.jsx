import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import SuperAdminSidebar from "../../../components/SuperAdminSidebar/SuperAdminSidebar";
import { superAdminApi } from "../../../services/superAdminApi";
import { FaUserShield, FaUsers, FaUserTag } from "react-icons/fa";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import "../superAdminLayout.css";
import "./superAdminDashboard.css";

const SuperAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const s = await superAdminApi("/api/superadmin/stats");
      setStats(s);
    } catch (e) {
      setStats(null);
      setError(e.message || "Could not load stats.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    {
      title: "Store admins",
      value: stats ? String(stats.storeAdminCount) : "—",
      icon: <FaUserShield />,
    },
    {
      title: "SuperAdmins",
      value: stats ? String(stats.superAdminCount) : "—",
      icon: <FaUsers />,
    },
    {
      title: "Customers (role)",
      value: stats ? String(stats.customerCount) : "—",
      icon: <FaUserTag />,
    },
  ];
  const roleData = stats
    ? [
        { name: "Store admins", value: Number(stats.storeAdminCount) || 0 },
        { name: "Super admins", value: Number(stats.superAdminCount) || 0 },
        { name: "Customers", value: Number(stats.customerCount) || 0 },
      ]
    : [];
  const pieData = roleData.some((r) => r.value > 0) ? roleData : [{ name: "No users", value: 1 }];
  const COLORS = ["#233a9a", "#0ea5e9", "#f59e0b"];

  return (
    <div>
      <SuperAdminSidebar onToggle={setSidebarOpen} />
      <div className={`superadmin-content ${sidebarOpen ? "" : "sidebar-closed"}`}>
        <h1 className="superadmin-dashboard-title">SuperAdmin dashboard</h1>
        <p className="superadmin-dashboard-lead">
          Manage who can access the store control panel. Add <strong>Admin</strong> users on the{" "}
          <Link to="/superadmin/store-admins">Store admins</Link> page — they sign in at{" "}
          <Link to="/login">/login</Link> (no public signup).
        </p>
        {error && <div className="superadmin-dashboard-error">{error}</div>}
        <div className="superadmin-stats-grid">
          {cards.map((c) => (
            <div key={c.title} className="superadmin-stat-card">
              <h3>{c.value}</h3>
              <p>
                {c.icon} {c.title}
              </p>
            </div>
          ))}
        </div>
        <div className="superadmin-charts-grid">
          <div className="superadmin-chart-card">
            <h3>User role mix</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={90} label>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="superadmin-chart-card">
            <h3>Role distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={roleData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#233a9a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
