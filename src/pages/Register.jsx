import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Register.css";

export default function Register() {
  return (
    <div className="register-page">
      <Navbar />

      <div className="register-container">
        <form className="register-form">
          <h2 className="register-title">Register</h2>

          <input
            type="text"
            className="register-input"
            placeholder="Full Name"
          />

          <input
            type="email"
            className="register-input"
            placeholder="Email Address"
          />

          <input
            type="password"
            className="register-input"
            placeholder="Password"
          />

          <button className="register-btn">
            Register
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}
