import { z } from "zod";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { createEntry, updateEntry, deleteEntry } from "../library/entriesHelper.js";

const entriesRouter = Router();

entriesRouter.use(requireAuth);

const mealTypes = ["BREAKFAST", "MORNING_SNACK", "LUNCH", "AFTERNOON_SNACK", "DINNER", "NIGHT_SNACK"];

function isRealDate(s) {
  const d = new Date(`${s}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

const entryFields = z.object({
  foodId:    z.number().int().positive(),
  servingId: z.number().int().positive().nullable().optional(),
  quantity:  z.number().positive().max(10000),
  mealType:  z.enum(mealTypes),
  loggedOn:  z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isRealDate),
});

const createEntrySchema = entryFields.strict();

const updateEntrySchema = entryFields
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "empty patch");

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

entriesRouter.post("/", async (req, res) => {
  const parsed = createEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    const err = new Error("Invalid entry");
    err.status = 400;
    throw err;
  }
  const entry = await createEntry(req.user.id, parsed.data);
  res.status(201).json(entry);
});

entriesRouter.patch("/:id", async (req, res) => {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) {
    const err = new Error("Invalid entry id");
    err.status = 400;
    throw err;
  }
  const body = updateEntrySchema.safeParse(req.body);
  if (!body.success) {
    const err = new Error("Invalid patch");
    err.status = 400;
    throw err;
  }
  const entry = await updateEntry(req.user.id, params.data.id, body.data);
  res.json(entry);
});

entriesRouter.delete("/:id", async(req, res) => {
  const params = idParamSchema.safeParse(req.params);
  if (!params.success) {
    const err = new Error("Invalid entry id");
    err.status = 400;
    throw err;
  }
  
  await deleteEntry(req.user.id, params.data.id);
  res.status(204).end();
});

export default entriesRouter;