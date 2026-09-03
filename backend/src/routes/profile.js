import { z } from "zod";
import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { getProfile, upsertProfile } from "../library/profileHelper.js";

const today = new Date();
const MAX_BIRTH_DATE = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
const MIN_BIRTH_DATE = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

// These enum values duplicate schema.prisma — adding one there means adding it here.
const profileSchema = z.object({
  sex: z.enum(["MALE", "FEMALE"]),
  birthDate: z.coerce.date().min(MIN_BIRTH_DATE).max(MAX_BIRTH_DATE),
  heightCm: z.number().positive().max(260).min(50),
  weightKg: z.number().positive().max(500).min(20),
  activityLevel: z.enum(["SEDENTARY", "LIGHT", "MODERATE", "ACTIVE", "VERY_ACTIVE"]),
  goal: z.enum(["LOSE", "MAINTAIN", "GAIN"]),
});

const profileRouter = express.Router();

profileRouter.use(requireAuth);

profileRouter.get('/me', async(req, res) => {
  const profile = await getProfile(req.user.id);
  if (!profile) {
    const error = new Error("Profile not found");
    error.status = 404;
    throw error;
  }
  res.json({ profile });
});

profileRouter.put('/me', async(req, res) => {
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) {
    const error = new Error("Invalid profile parameters");
    error.status = 400;
    throw error;
  }

  const profile = await upsertProfile(req.user.id, parsed.data);
  res.json({ profile });
});

export default profileRouter;