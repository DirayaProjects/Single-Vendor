import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { getApiBase } from "../../services/apiConfig";
import { setUserToken, clearUserToken } from "../../services/userAuth";
import { setAdminToken, clearAdminToken } from "../../services/adminAuth";
import { setSuperAdminToken, clearSuperAdminToken } from "../../services/superAdminAuth";
import "../Admin/Login/adminLogin.css";
import "./unifiedLogin.css";

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeHint, setStoreHint] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get("storeSlug")?.trim();
    if (q) {
      setStoreHint(q);
    }
  }, [searchParams]);

  const storeSlugForRequest = () => searchParams.get("storeSlug")?.trim() || storeHint.trim() || "";

  const startGoogleAuth = () => {
    setError("");
    const apiBase = getApiBase().replace(/\/$/, "");
    const craDev = window.location.port === "3000";
    const backendBase = apiBase || (!craDev ? window.location.origin.replace(/\/$/, "") : "");
    if (!backendBase) {
      setError(
        "Set REACT_APP_API_URL in .env.development to your API URL (e.g. https://localhost:7182) so Google sign-in hits ASP.NET."
      );
      return;
    }
    const origin = window.location.origin;
    const path = `${window.location.pathname}${window.location.search}`;
    const spaReturn = `${origin}${path}`;
    const q = new URLSearchParams({ returnUrl: spaReturn });
    const slug = storeSlugForRequest();
    if (slug) q.set("storeSlug", slug);
    window.location.assign(`${backendBase}/Identity/Account/GoogleLogin?${q.toString()}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const base = getApiBase();
    const slug = storeSlugForRequest();

    if (isSignup) {
      setLoading(true);
      try {
        const res = await fetch(`${base}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            storeSlug: slug || null,
          }),
        });
        const raw = await res.text();
        let data = {};
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = { message: raw };
        }
        if (!res.ok) {
          setError(
            (typeof data === "object" && (data.message || data.title || data.detail)) ||
              (typeof raw === "string" && raw.trim()) ||
              "Registration failed."
          );
          return;
        }
        if (!data.token) {
          setError("No token returned.");
          return;
        }
        clearAdminToken();
        clearSuperAdminToken();
        setUserToken(data.token);
        navigate("/account", { replace: true });
      } catch (err) {
        setError(err.message || "Could not reach the API.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const loginBody = { email: email.trim(), password };
      if (slug) loginBody.storeSlug = slug;

      const res = await fetch(`${base}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginBody),
      });
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = { message: raw };
      }
      if (!res.ok) {
        setError(
          (typeof data === "object" && (data.message || data.title || data.detail)) ||
            (typeof raw === "string" && raw.trim()) ||
            "Invalid email or password."
        );
        return;
      }
      if (!data.token) {
        setError("No token returned.");
        return;
      }
      const roles = Array.isArray(data.roles) ? data.roles : [];
      const isSuperAdmin = roles.some((r) => String(r).toLowerCase() === "superadmin");
      if (isSuperAdmin) {
        clearUserToken();
        clearAdminToken();
        setSuperAdminToken(data.token);
        navigate("/superadmin/dashboard", { replace: true });
        return;
      }
      const isAdmin = roles.some((r) => String(r).toLowerCase() === "admin");
      if (isAdmin) {
        clearUserToken();
        clearSuperAdminToken();
        setAdminToken(data.token);
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      clearAdminToken();
      clearSuperAdminToken();
      setUserToken(data.token);
      navigate("/account", { replace: true });
    } catch (err) {
      setError(err.message || "Could not reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card unified-login-card">
        <h1>{isSignup ? "Create account" : "Sign in"}</h1>
        <p className="admin-login-hint">
          Access your account with a secure, unified sign-in for <strong>Super Admin</strong>,{" "}
          <strong>Store Admin</strong>, and <strong>customers</strong>.
        </p>

        <div className="unified-login-tabs">
          <button
            type="button"
            className={!isSignup ? "active" : ""}
            onClick={() => {
              setIsSignup(false);
              setError("");
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={isSignup ? "active" : ""}
            onClick={() => {
              setIsSignup(true);
              setError("");
            }}
          >
            Create account
          </button>
        </div>

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
            <div className="unified-password-row">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="button" className="unified-eye" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>
          {error && <div className="admin-login-error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </button>
          <button type="button" className="unified-google-btn" onClick={startGoogleAuth}>
            <FaGoogle /> {isSignup ? "Sign up with Google" : "Continue with Google"}
          </button>
        </form>
        <Link to="/" className="admin-login-back">
          ← Back to storefront
        </Link>
      </div>
    </div>
  );
};

export default UnifiedLogin;
