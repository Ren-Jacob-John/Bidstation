import express from "express";
import cors from "cors";
import "dotenv/config";

import protectedRoutes from "./routes/protectedRoutes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import auctionRoutes from "./routes/auction.routes.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use("/api", protectedRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auctions", auctionRoutes);

app.get('/', (req, res) => {
  res.json("Server is Live!" );
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
