export function resolveGrams(quantity, serving){
  return serving ? quantity * serving.gramWeight : quantity;
}

const nutritionFields = [
  "calories",
  "proteinG",
  "fatG",
  "carbsG",
  "fiberG",
  "sugarG",
  "sodiumMg" 
]

const scale = (value, factor) => (value == null ? null : value * factor);

export function nutritionFor(food, grams) {
  const factor = grams / 100;
  const result = {};

  for (const key of nutritionFields) {
    result[key] = scale(food[key], factor);
  }

  return result;
}