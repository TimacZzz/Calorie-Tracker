export default function DailyTotals({ dayTotals, targets }) {
  const consumed = Math.round(dayTotals.calories);
  const remaining = targets.calorieTarget - consumed;
  const over = remaining < 0;
  const pct = Math.min((consumed / targets.calorieTarget) * 100, 100);

  return (
    <div className="mt-4">
      <div className="h-3 w-full rounded-full bg-gray-200">
        <div
          className={`h-3 rounded-full transition-all ${over ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-sm">
        {consumed} / {targets.calorieTarget} kcal ·{" "}
        {over ? `${Math.abs(remaining)} over` : `${remaining} left`}
      </p>
    </div>
  );
}