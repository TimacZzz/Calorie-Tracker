import { z } from "zod";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { createEntry, updateEntry, deleteEntry, listEntries } from "../library/entriesHelper.js";
import { DATE_RE, isRealDate } from "../library/dateHelper.js";

const entriesRouter = Router();

entriesRouter.use(requireAuth);

const mealTypes = ["BREAKFAST", "MORNING_SNACK", "LUNCH", "AFTERNOON_SNACK", "DINNER", "NIGHT_SNACK"];

const entryFields = z.object({
  foodId:    z.number().int().positive(),
  servingId: z.number().int().positive().nullable().optional(),
  quantity:  z.number().positive().max(10000),
  mealType:  z.enum(mealTypes),
  loggedOn: z.string().regex(DATE_RE).refine(isRealDate),
});

const createEntrySchema = entryFields.strict();

const updateEntrySchema = entryFields
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "empty patch");

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const listQuerySchema = z
  .object({
    date: z
      .string()
      .regex(DATE_RE)
      .refine(isRealDate),
  })
  .strict();

entriesRouter.get("/", async (req, res) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const err = new Error("Invalid query");
    err.status = 400;
    throw err;
  }

  const entries = await listEntries(req.user.id, parsed.data.date);
  res.json({ entries });
});

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