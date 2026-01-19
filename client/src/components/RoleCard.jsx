import React from "react";
import "./RoleCard.css";

export default function RoleCard({ title, description, color }) {
  const colorMap = {
    red: "role-red",
    yellow: "role-yellow",
    blue: "role-blue",
  };

  return (
    <div className="role-card">
      <h4 className={`role-title ${colorMap[color]}`}>
        {title}
      </h4>
      <p className="role-description">{description}</p>
    </div>
  );
}