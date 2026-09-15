import express from "express";
import { z } from "zod";
import { searchFoods } from "../library/searchFoods.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { getFoodById } from "../library/getFoodById.js";
import { createFood, updateFood, deleteFood } from "../library/customFoodHelper.js";

const foodsRouter = express.Router();

foodsRouter.use(requireAuth);

const optionalNutrient = (max) =>
  z.number().nonnegative().max(max).nullable().optional();

const foodFields = z.object({
  description: z.string().trim().min(2).max(200),
  calories:    z.number().nonnegative().max(900),
  proteinG:    z.number().nonnegative().max(100),
  fatG:        z.number().nonnegative().max(100),
  carbsG:      z.number().nonnegative().max(100),
  fiberG:      optionalNutrient(100),
  sugarG:      optionalNutrient(100),
  sodiumMg:    optionalNutrient(40000),
});

const createFoodSchema = foodFields.strict();
const updateFoodSchema = foodFields
  .partial()
  .strict()
  .refine((patch) => Object.keys(patch).length > 0, {
    message: "at least one field is required",
  });

const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
}).strict();

const foodIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
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

foodsRouter.get("/:id", async (req, res) => {
  const parsed = foodIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const error = new Error("Invalid food id");
    error.status = 400;
    throw error;
  }

  const food = await getFoodById(parsed.data.id, req.user.id);
  if (!food) {
    const error = new Error("Food not found");
    error.status = 404;
    throw error;
  }

  res.json(food);
});

foodsRouter.post("/", async (req, res) => {
  const parsed = createFoodSchema.safeParse(req.body);
  if (!parsed.success) {
    const error = new Error("Invalid food format");
    error.status = 400;
    throw error;
  }

  const food = await createFood(parsed.data, req.user.id);
  res.status(201).json(food);
});

foodsRouter.patch("/:id", async (req, res) => {
  const parsed = updateFoodSchema.safeParse(req.body);
  const paramsParsed = foodIdParamSchema.safeParse(req.params);
  if (!parsed.success || !paramsParsed.success) {
    const error = new Error("Invalid food format");
    error.status = 400;
    throw error;
  }

  const food = await updateFood(paramsParsed.data.id, parsed.data, req.user.id);
  res.json(food);
});

foodsRouter.delete("/:id", async (req, res) => {
  const parsed = foodIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    const error = new Error("Invalid food id");
    error.status = 400;
    throw error;
  }

  await deleteFood(parsed.data.id, req.user.id);
  res.status(204).end();
})

export default foodsRouter