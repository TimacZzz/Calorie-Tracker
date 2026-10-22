import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { httpError } from "../library/httpError.js";
import { parseFoodText } from "../library/aiParserHelper.js";

const aiRouter = Router();

aiRouter.use(requireAuth);

// Per user, not per IP. Runs after requireAuth, so req.user is set.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  keyGenerator: (req) => String(req.user.id),
  handler: (req, res, next) =>
    next(httpError(429, "Too many AI requests, try again later")),
});

const parseBodySchema = z
  .object({
    text: z.string().trim().min(1).max(500),
  })
  .strict();

aiRouter.post("/parse", aiLimiter, async (req, res) => {
  const parsed = parseBodySchema.safeParse(req.body);
  if (!parsed.success) throw httpError(400, "Invalid request");

  const items = await parseFoodText(parsed.data.text);
  res.json({ items });
});

export default aiRouter;