import { todayLocal, shiftDate } from "./dates.js";

export const MACROS = [
  { key: "proteinG", label: "Protein", kcalPerGram: 4 },
  { key: "carbsG", label: "Carbs", kcalPerGram: 4 },
  { key: "fatG", label: "Fat", kcalPerGram: 9 },
];

export function macroEnergy(row) {
  const parts = MACROS.map((m) => ({
    key: m.key, label: m.label, grams: row[m.key], kcal: row[m.key] * m.kcalPerGram,
  }));
  const total = parts.reduce((sum, p) => sum + p.kcal, 0);
  return { total, parts: parts.map((p) => ({ ...p, share: total > 0 ? p.kcal / total : null })) };
}

export function rangeEndingToday(days) {
  const end = todayLocal();
  return { start: shiftDate(end, -(days - 1)), end };
}

export function densifySeries(series, start, end) {
  const byDate = new Map(series.map((row) => [row.date, row]));
  const dense = [];
  for (let date = start; date <= end; date = shiftDate(date, 1)) {
    dense.push(
      byDate.get(date) ?? {
        date,
        calories: null,
        proteinG: null,
        carbsG: null,
        fatG: null,
      }
    );
  }
  return dense;
}