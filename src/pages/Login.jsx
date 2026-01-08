import React from "react";
import Navbar from "../components/Navbar";
import "./Login.css";

export default function Login() {
  return (
    <div className="login-page">
      <Navbar />

      <div className="login-container">
        <form className="login-form">
          <h2 className="login-title">Login</h2>

          <input
            type="email"
            className="login-input"
            placeholder="Email"
          />

          <input
            type="password"
            className="login-input"
            placeholder="Password"
          />

          <button className="login-btn">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
