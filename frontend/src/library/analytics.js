import { todayLocal, shiftDate } from "./dates.js";

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