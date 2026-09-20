import { z } from "zod";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getDailySeries } from "../library/analyticsHelper.js";
import { DATE_RE, isRealDate, daysBetween } from "../library/dateHelper.js";

const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

const MAX_RANGE_DAYS = 366;

const dateString = z.string().regex(DATE_RE).refine(isRealDate);

const dailyQuerySchema = z
  .object({ start: dateString, end: dateString })
  .strict()
  .refine((v) => v.start <= v.end, "start after end")
  .refine((v) => daysBetween(v.start, v.end) <= MAX_RANGE_DAYS, "range too long");

analyticsRouter.get("/daily", async (req, res) => {
  const parsed = dailyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const err = new Error("Invalid query");
    err.status = 400;
    throw err;
  }

  const series = await getDailySeries(req.user.id, parsed.data.start, parsed.data.end);
  res.json({ series });
});

export default analyticsRouter;
