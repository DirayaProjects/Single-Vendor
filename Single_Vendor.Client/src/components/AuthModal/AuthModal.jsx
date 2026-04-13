import React, { useState } from "react";
import "./AuthModal.css";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getApiBase } from "../../services/apiConfig";
import { setUserToken, clearUserToken } from "../../services/userAuth";
import { setAdminToken, clearAdminToken } from "../../services/adminAuth";
import { setSuperAdminToken, clearSuperAdminToken } from "../../services/superAdminAuth";

const AuthModal = ({ onClose, mode = "login", onLoggedIn }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const storeSlugFromUrl = searchParams.get("storeSlug")?.trim() || "";

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setError("");
  };
  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const base = getApiBase();

    if (isSignup) {
      if (!storeSlugFromUrl) {
        setError("Use your shop’s link to sign up, or go to Sign in on the home page and enter your store code.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${base}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            password,
            storeSlug: storeSlugFromUrl,
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
          const msg =
            (typeof data === "object" && (data.message || data.title || data.detail)) ||
            (typeof raw === "string" && raw.trim()) ||
            "Registration failed.";
          setError(msg);
          return;
        }
        if (!data.token) {
          setError("No token returned.");
          return;
        }
        clearAdminToken();
        clearSuperAdminToken();
        setUserToken(data.token);
        onLoggedIn?.({ email: data.email, roles: data.roles });
        onClose();
      navigate(`${window.location.pathname}${window.location.search}`, { replace: true });
      } catch (err) {
        setError(err.message || "Could not reach the API.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const loginBody = {
        email: email.trim(),
        password,
      };
      if (storeSlugFromUrl) {
        loginBody.storeSlug = storeSlugFromUrl;
      }

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
        const msg =
          (typeof data === "object" &&
            (data.message || data.title || data.detail)) ||
          (typeof raw === "string" && raw.trim()) ||
          "Invalid email or password.";
        setError(msg);
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
        onLoggedIn?.({ email: data.email, roles });
        onClose();
        navigate("/superadmin/dashboard", { replace: true });
        return;
      }
      const isAdmin = roles.some((r) => String(r).toLowerCase() === "admin");
      if (isAdmin) {
        clearUserToken();
        clearSuperAdminToken();
        setAdminToken(data.token);
        onLoggedIn?.({ email: data.email, roles });
        onClose();
        navigate("/admin/dashboard", { replace: true });
        return;
      }
      clearAdminToken();
      clearSuperAdminToken();
      setUserToken(data.token);
      onLoggedIn?.({ email: data.email, roles });
      onClose();
      navigate(`${window.location.pathname}${window.location.search}`, { replace: true });
    } catch (err) {
      setError(err.message || "Could not reach the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const startGoogleAuth = () => {
    setError("");
    const apiBase = getApiBase().replace(/\/$/, "");
    const craDev = window.location.port === "3000";
    /* OAuth runs on the ASP.NET host; CRA dev must use REACT_APP_API_URL, not same-origin /Identity. */
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
    if (storeSlugFromUrl) q.set("storeSlug", storeSlugFromUrl);
    window.location.assign(`${backendBase}/Identity/Account/GoogleLogin?${q.toString()}`);
  };

  const handleForgotPassword = () => {
    window.location.assign("/Identity/Account/ForgotPassword");
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button type="button" className="close-btn" onClick={onClose}>
          ×
        </button>

        <div className="auth-header">
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p>{isSignup ? "Sign up to get started" : "Log in to continue"}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && storeSlugFromUrl && (
            <p className="auth-signup-hint">
              You&apos;ll join store <strong>{storeSlugFromUrl}</strong> (change the <code>?storeSlug=</code> in the address bar for another shop).
            </p>
          )}

          <input
            type="email"
            placeholder="Email"
            className="auth-input"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="auth-input"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="password-toggle" onClick={togglePassword} role="presentation">
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {!isSignup && (
            <p className="forgot-password" onClick={handleForgotPassword} role="presentation">
              Forgot password?
            </p>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Please wait…" : isSignup ? "Create account" : "Log In"}
          </button>

          <button type="button" className="google-btn" onClick={startGoogleAuth}>
            <FaGoogle className="google-icon" /> {isSignup ? "Sign up with Google" : "Continue with Google"}
          </button>
        </form>

        <p className="toggle-text">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={toggleMode} role="presentation">
            {isSignup ? "Log in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
