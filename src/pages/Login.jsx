import React, { useState } from "react";
import Navbar from "../components/Navbar";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    validateEmail(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!emailError && email && password) {
      console.log("Login Successful");
    }
  };

  return (
    <div className="login-page">
      <Navbar />

      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-title">Login</h2>

          {/* Email */}
          <input
            type="text"   // 🔥 changed here
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
          />

          {/* Invalid email message */}
          {emailError && <p className="error-text">{emailError}</p>}

          {/* Password */}
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              className="login-input"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="show-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button className="login-btn" type="submit">
            Login
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
