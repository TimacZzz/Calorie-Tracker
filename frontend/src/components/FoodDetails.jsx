import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../library/api.js";
import { resolveGrams, nutritionFor } from "../library/nutrition.js";
import { inputClass, labelClass } from "./onboarding/formStyles.js";

const GRAMS = "grams";

const ROWS = [
  { key: "calories", label: "Calories", unit: "kCal" },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "carbsG", label: "Carbs", unit: "g" },
  { key: "fatG", label: "Fat", unit: "g" },
  { key: "fiberG", label: "Fibre", unit: "g" },
  { key: "sugarG", label: "Sugar", unit: "g" },
  { key: "sodiumMg", label: "Sodium", unit: "mg" },
];

function format(value, unit) {
  if (value == null) return "—";
  const rounded = Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}` : String(rounded);
}

export default function FoodDetail({ foodId, onLog }) {
  const [food, setFood] = useState(null);
  const [status, setStatus] = useState("loading");
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState(GRAMS);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    api
      .get(`/api/foods/${foodId}`, { signal: controller.signal })
      .then((res) => {
        setFood(res.data);
        const first = res.data.servings[0];
        setUnit(first ? String(first.id) : GRAMS);
        setQuantity(first ? "1" : "100");
        setStatus("ready");
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setStatus(err.response?.status === 404 ? "missing" : "error");
      });

    return () => controller.abort();
  }, [foodId]);

  if (status === "loading") {
    return <p className="p-4 text-slate-500">Loading food…</p>;
  }

  if (status === "missing") {
    return <p className="p-4 text-slate-600">That food is no longer available.</p>;
  }

  if (status === "error") {
    return <p className="p-4 text-red-600">Couldn’t load this food. Check your connection and try again.</p>;
  }

  const serving = food.servings.find((s) => String(s.id) === unit) ?? null;
  const parsedQuantity = Number(quantity);
  const validQuantity = quantity.trim() !== "" && Number.isFinite(parsedQuantity) && parsedQuantity > 0;

  const grams = validQuantity ? resolveGrams(parsedQuantity, serving) : null;
  const scaled = grams == null ? null : nutritionFor(food, grams);
  const per100 = nutritionFor(food, 100);

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{food.description}</h2>
        <p className="text-sm text-slate-500">{food.source}</p>
      </div>

      <div className="flex gap-3">
        <div className="w-28">
          <label htmlFor="quantity" className={labelClass}>Amount</label>
          <input
            id="quantity"
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex-1">
          <label htmlFor="unit" className={labelClass}>Unit</label>
          {food.servings.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Grams — USDA lists no serving sizes for this food.
            </p>
          ) : (
            <select
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className={inputClass}
            >
              {food.servings.map((s) => (
                <option key={s.id} value={String(s.id)} title={s.description}>
                  {s.description.length > 40 ? `${s.description.slice(0, 40)}…` : s.description}
                </option>
              ))}
              <option value={GRAMS}>grams</option>
            </select>
          )}
        </div>
      </div>

      {grams != null && serving && (
        <p className="text-sm text-slate-500">{format(grams, "g")} total</p>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-500">
            <th className="text-left font-normal py-1"></th>
            <th className="text-right font-normal py-1">This amount</th>
            <th className="text-right font-normal py-1">Per 100 g</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map(({ key, label, unit: u }) => (
            <tr key={key} className="border-t border-slate-100">
              <td className="py-2 text-slate-700">{label}</td>
              <td className="py-2 text-right font-medium text-slate-900">
                {scaled ? format(scaled[key], u) : "—"}
              </td>
              <td className="py-2 text-right text-slate-500">{format(per100[key], u)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        disabled={!validQuantity}
        onClick={() => onLog({ food, quantity: parsedQuantity, serving })}
        className="w-full rounded bg-slate-900 px-4 py-2 text-white disabled:bg-slate-300"
      >
        Add to diary
      </button>
    </div>
  );
}