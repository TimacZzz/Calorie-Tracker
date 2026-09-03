import bcrypt from "bcryptjs";
import { prisma, Prisma } from "../db/prisma.js";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;
const TOKEN_TTL = "7d";

export async function registerUser({ email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const error = new Error("An account with that email already exists");
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

export async function verifyCredentials({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Prevent timing attack
    await bcrypt.hash(password, SALT_ROUNDS);
    return null;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

export function signToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export async function getUserById(id){
  return await prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
}