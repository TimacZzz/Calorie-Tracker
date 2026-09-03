// Constants
const ACTIVITY_MULTIPLIERS = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const GOAL_ADJUSTMENTS = { LOSE: -500, MAINTAIN: 0, GAIN: 500 };

const MACRO_SPLIT = { protein: 0.3, carbs: 0.4, fat: 0.3 };

const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 };

// Function that calculates calorie target
export function calculateTargets({ age, sex, heightCm, weightKg, activityLevel, goal }) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  if (multiplier === undefined) {
    throw new Error(`Unknown activity level: ${activityLevel}`);
  }

  const adjustment = GOAL_ADJUSTMENTS[goal];
  if (adjustment === undefined) {
    throw new Error(`Unknown goal: ${goal}`);
  }

  let sexConstant;
  if (sex === "MALE") {
    sexConstant = 5;
  } else if (sex === "FEMALE") {
    sexConstant = -161;
  } else {
    throw new Error(`Unknown sex: ${sex}`);
  }

  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant;
  const tdee = bmr * multiplier;
  const calorieTarget = Math.round(Math.max(tdee + adjustment, bmr));

  // Macro Targets
  const proteinTargetG = Math.round(calorieTarget * MACRO_SPLIT["protein"] / KCAL_PER_G["protein"]);
  const carbsTargetG = Math.round(calorieTarget * MACRO_SPLIT["carbs"] / KCAL_PER_G["carbs"]);
  const fatTargetG = Math.round(calorieTarget * MACRO_SPLIT["fat"] / KCAL_PER_G["fat"]);

  return { calorieTarget, proteinTargetG, carbsTargetG, fatTargetG };
}