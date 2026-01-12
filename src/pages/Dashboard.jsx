import React from "react";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-container">
        <h1 className="dashboard-title">Dashboard</h1>

        <div className="dashboard-grid">
          <Card title="Active Auctions" value="2" color="red" />
          <Card title="Total Bids" value="34" color="yellow" />
          <Card title="Completed Auctions" value="5" color="blue" />
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, color }) {
  const colorMap = {
    red: "card-red",
    yellow: "card-yellow",
    blue: "card-blue",
  };

  return (
    <div className="card">
      <p className="card-title">{title}</p>
      <h2 className={`card-value ${colorMap[color]}`}>{value}</h2>
    </div>
  );
}
