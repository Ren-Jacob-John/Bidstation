import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { db } from "../config/db.js";

const router = express.Router();

/* =========================
   GET ALL AUCTIONS
========================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.start_price,
        a.buy_now_price,
        a.start_time,
        a.end_time,
        a.created_at,
        u.full_name AS seller
      FROM auctions a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch auctions" });
  }
});

/* =========================
   CREATE AUCTION
========================= */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      title,
      description,
      shortDescription,
      categoryId,
      startPrice,
      reservePrice,
      buyNowPrice,
      bidIncrement,
      startTime,
      endTime,
      itemCondition,
      quantity,
      shippingCost,
      shippingInfo,
      location,
      isPrivate,
      inviteCode
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO auctions
      (user_id, title, description, short_description, category_id,
       start_price, reserve_price, buy_now_price, bid_increment,
       start_time, end_time, item_condition, quantity,
       shipping_cost, shipping_info, location, is_private, invite_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        description,
        shortDescription,
        categoryId,
        startPrice,
        reservePrice,
        buyNowPrice,
        bidIncrement,
        startTime,
        endTime,
        itemCondition,
        quantity,
        shippingCost,
        shippingInfo,
        location,
        isPrivate,
        inviteCode
      ]
    );

    res.status(201).json({
      message: "Auction created successfully",
      auctionId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create auction" });
  }
});

export default router;
