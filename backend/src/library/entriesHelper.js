import { prisma } from "../db/prisma.js";

const ENTRY_INCLUDE = {
  food: {
    select: {
      id: true, description: true, calories: true, proteinG: true,
      fatG: true, carbsG: true, fiberG: true, sugarG: true, sodiumMg: true,
    },
  },
  serving: { select: { id: true, description: true, gramWeight: true } },
};

function serialiseEntry(entry) {
  return {
    ...entry,
    quantity: Number(entry.quantity),
    loggedOn: entry.loggedOn.toISOString().slice(0, 10),
    food: {
      ...entry.food,
      calories: Number(entry.food.calories),
      proteinG: Number(entry.food.proteinG),
      fatG: Number(entry.food.fatG),
      carbsG: Number(entry.food.carbsG),
      fiberG: entry.food.fiberG === null ? null : Number(entry.food.fiberG),
      sugarG: entry.food.sugarG === null ? null : Number(entry.food.sugarG),
      sodiumMg: entry.food.sodiumMg === null ? null : Number(entry.food.sodiumMg),
    },
    serving: entry.serving
      ? { ...entry.serving, gramWeight: Number(entry.serving.gramWeight) }
      : null,
  };
}

async function findOwned(userId, id) {
  const entry = await prisma.logEntry.findUnique({
    where: { id },
    select: { id: true, userId: true, foodId: true, servingId: true },
  });
  if (!entry) {
    const err = new Error("Entry not found");
    err.status = 404;
    throw err;
  }
  if (entry.userId !== userId) {
    const err = new Error("Not your entry");
    err.status = 403;
    throw err;
  }
  return entry;
}

export async function assertLoggable(foodId, servingId, userId) {
  const food = await prisma.food.findFirst({
    where: { id: foodId, OR: [{ userId: null }, { userId }] },
    select: { id: true },
  });
  if (!food) {
    const err = new Error("Food not found");
    err.status = 404;
    throw err;
  }

  if (servingId == null) return;

  const serving = await prisma.foodServing.findFirst({
    where: { id: servingId, foodId },
    select: { id: true },
  });
  if (!serving) {
    const err = new Error("Serving does not belong to that food");
    err.status = 400;
    throw err;
  }
}


export async function createEntry(userId, data){
  await assertLoggable(data.foodId, data.servingId, userId);
  const entry = await prisma.logEntry.create({
    data: {
      userId,
      foodId: data.foodId,
      servingId: data.servingId ?? null,
      quantity: data.quantity,
      mealType: data.mealType,
      loggedOn: new Date(`${data.loggedOn}T00:00:00.000Z`),
    },
    include: ENTRY_INCLUDE,
  });

  return serialiseEntry(entry);
}

export async function updateEntry(userId, id, patch) {
  const existing = await findOwned(userId, id);
  const merged = { ...existing, ...patch };
  await assertLoggable(merged.foodId, merged.servingId, userId);

  const entry = await prisma.logEntry.update({
    where: { id },
    data: {
      ...patch,
      ...(patch.loggedOn && {
        loggedOn: new Date(`${patch.loggedOn}T00:00:00.000Z`),
      }),
    },
    include: ENTRY_INCLUDE,
  });
  return serialiseEntry(entry);
}

export async function deleteEntry(userId, id) {
  await findOwned(userId, id);
  await prisma.logEntry.delete({ where: { id } });
}

export async function listEntries(userId, loggedOn) {
  const entries = await prisma.logEntry.findMany({
    where: { userId, loggedOn: new Date(`${loggedOn}T00:00:00.000Z`) },
    include: ENTRY_INCLUDE,
    orderBy: [{ mealType: "asc" }, { id: "asc" }],
  });
  return entries.map(serialiseEntry);
}