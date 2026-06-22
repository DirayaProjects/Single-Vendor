import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getApiBase } from "../../../services/apiConfig";
import { setAdminToken } from "../../../services/adminAuth";
import { clearUserToken } from "../../../services/userAuth";
import { clearSuperAdminToken } from "../../../services/superAdminAuth";
import "./adminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const base = getApiBase();
      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw };
      }
      if (!res.ok) {
        setError(data.message || data.title || "Invalid email or password.");
        return;
      }
      if (!data.token) {
        setError("No token returned.");
        return;
      }
      if (!data.roles?.includes?.("Admin")) {
        setError("This account does not have the Admin role.");
        return;
      }
      clearUserToken();
      clearSuperAdminToken();
      setAdminToken(data.token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Could not reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Admin sign in</h1>
        <p className="admin-login-hint">
          Use an account that has the <strong>Admin</strong> role (see <code>Scripts/SeedIdentityRoles.sql</code>).
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="admin-login-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <Link to="/" className="admin-login-back">
          ← Back to entry
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
