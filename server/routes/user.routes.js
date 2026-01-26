import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET current user
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  });
});

export default router;
