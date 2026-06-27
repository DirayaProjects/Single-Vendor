import React from "react";
import Input from "../RegisterInput/RegisterInput.jsx";
import "./signup.css";

const Signup = ({
  credentials,
  validateRegistration,
  setIsSignup,
  error,
  errorMessage,
  handleInputChange,
  handleSignup,
  handleSwitch,
}) => {
  return (
    <div
      id="popup-container"
      className="flex center popup-container"
      onMouseDown={(e) => {
        if (e.target.id === "popup-container") {
          setIsSignup(false);
        }
      }}
    >
      <div className="flex column align-center popup-wrapper bg-gray-col">
        <h1 className="white">Signup</h1>

        <Input
          id="username"
          placeholder={"JohnDoe"}
          label={"Username"}
          handleInputChange={handleInputChange}
          field={"username"}
          error={error.username ? true : false}
          value={credentials.username}
        />

        <Input
          id="email"
          placeholder={"john@gmail.com"}
          label={"Email"}
          handleInputChange={handleInputChange}
          field={"email"}
          error={error.email ? true : false}
          value={credentials.email}
        />

        <Input
          id="password"
          type="password"
          placeholder={"*******"}
          label={"Password"}
          handleInputChange={handleInputChange}
          field={"password"}
          error={error.password ? true : false}
          value={credentials.password}
        />

        <div className="error-div">
          <Input
            id="confirm_password"
            type="password"
            placeholder={"*******"}
            label={"Confirm Password"}
            handleInputChange={handleInputChange}
            field={"confirmPassword"}
            error={error.password ? true : false}
            value={credentials.confirmPassword}
          />

          {errorMessage && <p className="error-col">{errorMessage}</p>}
        </div>

        <button
          className="login-btn bg-primary font-bold white"
          onClick={validateRegistration}
        >
          Signup
        </button>

        <p className="white">
          Already have an account?{" "}
          <span
            className="reg-switch text-primary font-bold"
            onClick={handleSwitch}
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default Signup;
