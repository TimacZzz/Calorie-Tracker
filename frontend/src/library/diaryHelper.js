import { MEAL_TYPES } from "../constants/mealTypes";
import { resolveGrams, nutritionFor } from "./nutrition";

export function groupByMeal(entries) {
  return MEAL_TYPES.map((meal) => {
    const items = entries.filter((e) => e.mealType === meal.value);
    const totals = items.reduce(
      (acc, e) => {
        const n = nutritionFor(e.food, resolveGrams(e.quantity, e.serving));
        return {
          calories: acc.calories + n.calories,
          proteinG: acc.proteinG + n.proteinG,
          carbsG: acc.carbsG + n.carbsG,
          fatG: acc.fatG + n.fatG,
        };
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
    return { ...meal, items, totals };
  });
}