import "dotenv/config";
import express from "express";
import foodsRouter from "./src/routes/food.js";


const app = express();
app.use(express.json());
app.use("/api/foods", foodsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
