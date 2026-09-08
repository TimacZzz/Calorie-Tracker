import { prisma } from "../db/prisma.js";

const FOOD_SELECT = {
  id: true,
  description: true,
  source: true,
  calories: true,
  proteinG: true,
  fatG: true,
  carbsG: true,
  fiberG: true,
  sugarG: true,
  sodiumMg: true,
  userId: true,
};

const SERVING_SELECT = {
  id: true,
  description: true,
  gramWeight: true,
};

const num = (d) => (d == null ? null : Number(d));

const serialiseFood = (food) => ({
  ...food,
  calories: num(food.calories),
  proteinG: num(food.proteinG),
  fatG: num(food.fatG),
  carbsG: num(food.carbsG),
  fiberG: num(food.fiberG),
  sugarG: num(food.sugarG),
  sodiumMg: num(food.sodiumMg),
  servings: food.servings.map((s) => ({
    ...s,
    gramWeight: num(s.gramWeight),
  })),
});

export async function getFoodById(id, userId){
  const food = await prisma.food.findFirst({
    where: {
      id,
      OR: [{ userId: null }, { userId }],
    },
    select: {
      ...FOOD_SELECT,
      servings: {
        select: SERVING_SELECT,
        orderBy: { gramWeight: "asc" }
      }
    }
  });

  return serialiseFood(food);
}