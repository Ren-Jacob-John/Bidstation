import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import auctionRoutes from "./routes/auction.routes.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api", protectedRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auctions", auctionRoutes);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Server is Live!" });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
