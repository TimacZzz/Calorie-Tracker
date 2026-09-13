import { prisma } from "../db/prisma.js";
import { FOOD_WITH_SERVINGS_SELECT, serialiseFood } from "./getFoodById.js";
import { httpError } from "./httpError.js";

async function findOwnedFood(id, userId) {
  const food = await prisma.food.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!food) {
    throw httpError(404, "Food not found");
  }
  if (food.userId === null) {
    throw httpError(403, "Seeded foods cannot be edited");
  }
  if (food.userId !== userId) {
    throw httpError(404, "Food not found");
  }

  return food;
}

export async function createFood(data, userId) {
  const food = await prisma.food.create({
    data: { ...data, userId, source: "CUSTOM" },
    select: FOOD_WITH_SERVINGS_SELECT,
  });
  return { ...serialiseFood(food), servings: [] };
}

export async function updateFood(id, patch, userId) {
  await findOwnedFood(id, userId);

  try {
    const food = await prisma.food.update({
      where: { id },
      data: patch,
      select: FOOD_WITH_SERVINGS_SELECT
    });
    return { ...serialiseFood(food), servings: [] };
  } catch (err) {
    if (err?.code === "P2025") {
      throw httpError(404, "Food not found");
    }
    throw err;
  }
}

export async function deleteFood(id, userId) {
  await findOwnedFood(id, userId);

  try {
    await prisma.food.delete({ where: { id } });
  } catch (err) {
    if (err?.code === "P2003") {
      const count = await prisma.logEntry.count({ where: { foodId: id } });
      throw httpError(
        409,
        `This food is used by ${count} diary ${count === 1 ? "entry" : "entries"}. Delete those first.`
      );
    }
    if (err?.code === "P2025") {
      throw httpError(404, "Food not found");
    }
    throw err;
  }
}