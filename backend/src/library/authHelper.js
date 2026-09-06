import bcrypt from "bcryptjs";
import { prisma, Prisma } from "../db/prisma.js";
import jwt from "jsonwebtoken";

const SALT_ROUNDS = 10;
const TOKEN_TTL = "7d";

const USER_SELECT = {
  id: true,
  email: true,
  profile: { select: { userId: true } },
};

function serialiseUser(user) {
  return {
    id: user.id,
    email: user.email,
    hasProfile: user.profile !== null,
  };
}

export async function registerUser({ email, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const newUser = await prisma.user.create({
      data: { email, passwordHash },
      select: USER_SELECT,
    });

    return serialiseUser(newUser);
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
  const user = await prisma.user.findUnique({ 
    where: { email },
    select: { ...USER_SELECT, passwordHash: true }, 
  });

  if (!user) {
    // Prevent timing attack
    await bcrypt.hash(password, SALT_ROUNDS);
    return null;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return serialiseUser(user);
}

export function signToken(user) {
  return jwt.sign(
    { sub: String(user.id) },
    process.env.JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

export async function getUserById(id){
  const user = await prisma.user.findUnique({ 
    where: { id }, 
    select: USER_SELECT
  });

  if (!user) return null;

  return serialiseUser(user);
}