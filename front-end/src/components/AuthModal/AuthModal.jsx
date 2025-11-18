import React, { useState } from "react";
import "./AuthModal.css";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";

const AuthModal = ({ onClose, mode = "login" }) => {
  const [isSignup, setIsSignup] = useState(mode === "signup");
  const [showPassword, setShowPassword] = useState(false);

  const toggleMode = () => setIsSignup(!isSignup);
  const togglePassword = () => setShowPassword(!showPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isSignup ? "Signing up..." : "Logging in...");
  };

  const handleGoogleSignup = () => {
    console.log("Sign up with Google clicked");
  };

  const handleForgotPassword = () => {
    console.log("Forgot password clicked");
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
            type="email"
            placeholder="Email"
            className="auth-input"
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="auth-input"
              required
            />
            <span className="password-toggle" onClick={togglePassword}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {!isSignup && (
            <p className="forgot-password" onClick={handleForgotPassword}>
              Forgot password?
            </p>
          )}

          <button type="submit" className="auth-submit-btn">
            {isSignup ? "Sign Up" : "Log In"}
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
