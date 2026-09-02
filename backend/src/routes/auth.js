import express from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { registerUser, verifyCredentials, signToken } from "../library/authHelper.js";

const authRouter = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(72),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

authRouter.post("/register", authLimiter, async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password format" });
  }

  const user = await registerUser(parsed.data);
  res.cookie("token", signToken(user), COOKIE_OPTIONS);
  res.status(201).json({ user });
});

authRouter.post("/login", authLimiter, async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const user = await verifyCredentials(parsed.data);
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  res.cookie("token", signToken(user), COOKIE_OPTIONS);
  res.json({ user });
});

authRouter.post("/logout", (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(204).end();
});

export default authRouter;