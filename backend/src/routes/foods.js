import express from "express";
import { z } from "zod";
import { searchFoods } from "../library/searchFoods.js";

const foodsRouter = express.Router();

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

foodsRouter.get('/search', async(req, res, next) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid search parameters",
    });
  }

  try {
    const { results, hasMore } = await searchFoods({ ...parsed.data, userId: null });
    res.json({ results, hasMore });
  } catch (err) {
    next(err);
  }
})

export default foodsRouter