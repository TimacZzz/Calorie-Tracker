import { prisma } from "../db/prisma.js";
import { calculateTargets } from "./calculateTargets.js";

// Fields returned to callers. Explicit so the hash-leak class of bug can't
// happen here either, and so adding a column doesn't silently change the API.
const PROFILE_SELECT = {
  userId: true,
  sex: true,
  birthDate: true,
  heightCm: true,
  weightKg: true,
  activityLevel: true,
  goal: true,
  calorieTarget: true,
  proteinTargetG: true,
  carbsTargetG: true,
  fatTargetG: true,
  targetsAreCustom: true,
};

// `now` is injectable so this is testable without mocking the clock.
function ageFrom(birthDate, now = new Date()) {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

// Prisma returns Decimal objects for height and weight. res.json() would
// serialise those as strings, so they're converted once here and every caller
// gets plain numbers.
function serialise(profile) {
  return {
    ...profile,
    heightCm: profile.heightCm.toNumber(),
    weightKg: profile.weightKg.toNumber(),
  };
}

export async function getProfile(userId) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: PROFILE_SELECT,
  });

  return profile ? serialise(profile) : null;
}

export async function upsertProfile(userId, input) {
  const targets = calculateTargets({
    age: ageFrom(input.birthDate),
    sex: input.sex,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    goal: input.goal,
  });

  // Same payload either way: a profile is one row per user and PUT sends the
  // whole object, so there is nothing to merge on update.
  const data = {
    sex: input.sex,
    birthDate: input.birthDate,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    goal: input.goal,
    ...targets,
    targetsAreCustom: false,
  };

  const profile = await prisma.profile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: PROFILE_SELECT,
  });

  return serialise(profile);
}