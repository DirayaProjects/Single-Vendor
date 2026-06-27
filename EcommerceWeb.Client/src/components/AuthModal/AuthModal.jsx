import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { login, saveAuthSession } from "../../services/authApi";

const AuthModal = ({ onClose, mode = "login", redirectUrl, onSuccess }) => {
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const toggleMode = () => setIsSignup(!isSignup);
  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSignup) {
      setError("Sign up is not available yet. Please use an existing account.");
      return;
    }

    setLoading(true);

    try {
      const result = await login(userInput, passwordInput);
      saveAuthSession(result);
      onClose();

      if (onSuccess) {
        onSuccess(result);
        return;
      }

      if (result.isAdmin) {
        navigate("/admin/dashboard");
      } else if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate(result.redirectUrl || "/");
      }
    } catch (err) {
      setError(err.message || "Invalid email/username or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setError("Google sign up is not available yet.");
  };

  const handleForgotPassword = () => {
    setError("Password reset is not available yet.");
  };

  return (
    <div className="auth-overlay">
      <div className="auth-modal">
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="auth-header">
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p>{isSignup ? "Sign up to get started" : "Log in to continue"}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <input
              type="text"
              placeholder="Username"
              className="auth-input"
              required
            />
          )}

          <input
            type="text"
            placeholder={isSignup ? "Email" : "Email or Username"}
            className="auth-input"
            required
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="auth-input"
              required
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <span className="password-toggle" onClick={togglePassword}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <p className="error-text">{error}</p>}

          {!isSignup && (
            <p className="forgot-password" onClick={handleForgotPassword}>
              Forgot password?
            </p>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Please wait..." : isSignup ? "Sign Up" : "Log In"}
          </button>

          {isSignup && (
            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleSignup}
            >
              <FaGoogle className="google-icon" /> Sign up with Google
            </button>
          )}
        </form>

        <p className="toggle-text">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <span onClick={toggleMode}>
            {isSignup ? "Log in" : "Sign up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
