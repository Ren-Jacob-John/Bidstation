import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import "./CreateAuction.css";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function CreateAuction() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    startPrice: "",
    reservePrice: "",
    buyNowPrice: "",
    bidIncrement: "1.00",
    startTime: "",
    endTime: "",
    itemCondition: "new",
    quantity: "1",
    shippingCost: "",
    shippingInfo: "",
    location: "",
    isPrivate: false,
    inviteCode: ""
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.startPrice || parseFloat(formData.startPrice) <= 0) {
      newErrors.startPrice = "Valid starting price is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    const now = new Date();

    if (startTime <= now) {
      newErrors.startTime = "Start time must be in the future";
    }

    if (endTime <= startTime) {
      newErrors.endTime = "End time must be after start time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("/api/auctions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create auction");
      }

      toast.success("Auction created successfully!");
      navigate(`/auction/${data.slug}`);
    } catch (error) {
      toast.error(error.message);
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-page">
      <Navbar />

      <div className="create-container">
        <form className="create-card" onSubmit={handleSubmit}>
          <h2 className="create-title">Create Auction</h2>

          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}

          {/* Title */}
          <div className="input-group">
            <input
              type="text"
              name="title"
              className={`create-input ${errors.title ? "input-error" : ""}`}
              placeholder="Auction Title"
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="input-group">
            <textarea
              name="description"
              className={`create-input create-textarea ${errors.description ? "input-error" : ""}`}
              placeholder="Auction Description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows="4"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          {/* Short Description */}
          <div className="input-group">
            <input
              type="text"
              name="shortDescription"
              className="create-input"
              placeholder="Short Description (optional)"
              value={formData.shortDescription}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div className="input-group">
            <select
              name="categoryId"
              className="create-input"
              value={formData.categoryId}
              onChange={handleChange}
              disabled={isLoading}
            >
              <option value="">Select Category</option>
              <option value="1">Electronics</option>
              <option value="2">Fashion</option>
              <option value="3">Home & Garden</option>
              <option value="4">Sports</option>
              <option value="5">Art & Collectibles</option>
            </select>
          </div>

          {/* Pricing */}
          <div className="pricing-grid">
            <div className="input-group">
              <input
                type="number"
                name="startPrice"
                className={`create-input ${errors.startPrice ? "input-error" : ""}`}
                placeholder="Starting Price"
                value={formData.startPrice}
                onChange={handleChange}
                disabled={isLoading}
                step="0.01"
                min="0"
              />
              {errors.startPrice && <span className="error-text">{errors.startPrice}</span>}
            </div>

            <div className="input-group">
              <input
                type="number"
                name="reservePrice"
                className="create-input"
                placeholder="Reserve Price (optional)"
                value={formData.reservePrice}
                onChange={handleChange}
                disabled={isLoading}
                step="0.01"
                min="0"
              />
            </div>

            <div className="input-group">
              <input
                type="number"
                name="buyNowPrice"
                className="create-input"
                placeholder="Buy Now Price (optional)"
                value={formData.buyNowPrice}
                onChange={handleChange}
                disabled={isLoading}
                step="0.01"
                min="0"
              />
            </div>

            <div className="input-group">
              <input
                type="number"
                name="bidIncrement"
                className="create-input"
                placeholder="Bid Increment"
                value={formData.bidIncrement}
                onChange={handleChange}
                disabled={isLoading}
                step="0.01"
                min="0.01"
              />
            </div>
          </div>

          {/* Timing */}
          <div className="timing-grid">
            <div className="input-group">
              <label className="input-label">Start Time</label>
              <input
                type="datetime-local"
                name="startTime"
                className={`create-input ${errors.startTime ? "input-error" : ""}`}
                value={formData.startTime}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.startTime && <span className="error-text">{errors.startTime}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">End Time</label>
              <input
                type="datetime-local"
                name="endTime"
                className={`create-input ${errors.endTime ? "input-error" : ""}`}
                value={formData.endTime}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.endTime && <span className="error-text">{errors.endTime}</span>}
            </div>
          </div>

          {/* Item Details */}
          <div className="item-grid">
            <div className="input-group">
              <select
                name="itemCondition"
                className="create-input"
                value={formData.itemCondition}
                onChange={handleChange}
                disabled={isLoading}
              >
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="input-group">
              <input
                type="number"
                name="quantity"
                className="create-input"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={handleChange}
                disabled={isLoading}
                min="1"
              />
            </div>
          </div>

          {/* Shipping */}
          <div className="shipping-grid">
            <div className="input-group">
              <input
                type="number"
                name="shippingCost"
                className="create-input"
                placeholder="Shipping Cost (optional)"
                value={formData.shippingCost}
                onChange={handleChange}
                disabled={isLoading}
                step="0.01"
                min="0"
              />
            </div>

            <div className="input-group">
              <input
                type="text"
                name="location"
                className="create-input"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Shipping Info */}
          <div className="input-group">
            <textarea
              name="shippingInfo"
              className="create-input create-textarea"
              placeholder="Shipping Information (optional)"
              value={formData.shippingInfo}
              onChange={handleChange}
              disabled={isLoading}
              rows="2"
            />
          </div>

          {/* Private Auction */}
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleChange}
                disabled={isLoading}
              />
              Private Auction
            </label>
          </div>

          {formData.isPrivate && (
            <div className="input-group">
              <input
                type="text"
                name="inviteCode"
                className="create-input"
                placeholder="Invite Code"
                value={formData.inviteCode}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          )}

          <button
            className="create-btn"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Creating Auction..." : "Create Auction"}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}