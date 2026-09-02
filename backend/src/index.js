import "dotenv/config";
import express from "express";
import foodsRouter from "./routes/foods.js";
import authRouter from "./routes/auth.js";
import cookieParser from "cookie-parser";
import { requireAuth } from "./middleware/requireAuth.js";


const app = express();

app.use(express.json());
app.use(cookieParser());

// Routers
app.use("/api/foods", foodsRouter);
app.use("/api/auth", authRouter);

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error Handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
