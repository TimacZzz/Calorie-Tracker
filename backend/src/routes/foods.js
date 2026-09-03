import express from "express";
import { z } from "zod";
import { searchFoods } from "../library/searchFoods.js";
import { requireAuth } from "../middleware/requireAuth.js";

const foodsRouter = express.Router();

foodsRouter.use(requireAuth);

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

foodsRouter.get('/search', async(req, res) => {
  const parsed = searchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const error = new Error("Invalid search parameters");
    error.status = 400;
    throw error;
  }

  const { results, hasMore } = await searchFoods({ ...parsed.data, userId: req.user.id });
  res.json({ results, hasMore });
})

export default foodsRouter