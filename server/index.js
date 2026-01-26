import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import auctionRoutes from "./routes/auction.routes.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
