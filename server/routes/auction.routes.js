import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================
   GET ALL AUCTIONS (MARKETPLACE)
========================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.title,
        a.name,
        a.start_price,
        a.buy_now_price,
        a.starting_budget,
        a.max_players_per_user,
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
   GET MY AUCTIONS (DASHBOARD)
========================= */
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM auctions WHERE user_id = ? ORDER BY id DESC",
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch my auctions" });
  }
});

/* =========================
   CREATE AUCTION (MERGED)
========================= */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      // SIMPLE AUCTION (Code 1)
      name,
      startingBudget,
      maxPlayersPerUser,

      // ADVANCED AUCTION (Code 2)
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
      `INSERT INTO auctions (
        user_id,
        name,
        starting_budget,
        max_players_per_user,
        title,
        description,
        short_description,
        category_id,
        start_price,
        reserve_price,
        buy_now_price,
        bid_increment,
        start_time,
        end_time,
        item_condition,
        quantity,
        shipping_cost,
        shipping_info,
        location,
        is_private,
        invite_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name || null,
        startingBudget || null,
        maxPlayersPerUser || null,
        title || null,
        description || null,
        shortDescription || null,
        categoryId || null,
        startPrice || null,
        reservePrice || null,
        buyNowPrice || null,
        bidIncrement || null,
        startTime || null,
        endTime || null,
        itemCondition || null,
        quantity || 1,
        shippingCost || 0,
        shippingInfo || null,
        location || null,
        isPrivate || false,
        inviteCode || null
      ]
    );

    res.status(201).json({
      success: true,
      message: "Auction created successfully",
      auctionId: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create auction" });
  }
});

export default router;
