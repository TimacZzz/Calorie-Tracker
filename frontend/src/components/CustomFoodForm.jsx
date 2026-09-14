import { useState } from "react";
import { inputClass, labelClass } from "./onboarding/formStyles.js";

const REQUIRED = ["description", "calories", "proteinG", "fatG", "carbsG"];

const FIELDS = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "proteinG", label: "Protein", unit: "g" },
  { key: "fatG", label: "Fat", unit: "g" },
  { key: "carbsG", label: "Carbs", unit: "g" },
  { key: "fiberG", label: "Fibre", unit: "g", optional: true },
  { key: "sugarG", label: "Sugar", unit: "g", optional: true },
  { key: "sodiumMg", label: "Sodium", unit: "mg", optional: true },
];

const EMPTY = {
  description: "",
  calories: "",
  proteinG: "",
  fatG: "",
  carbsG: "",
  fiberG: "",
  sugarG: "",
  sodiumMg: "",
};

// An empty number input reads as "". Number("") is 0, which would fabricate a
// value USDA would have left unanalysed — so blank optional fields send null.
function toPayload(form) {
  const payload = { description: form.description.trim() };
  for (const { key, optional } of FIELDS) {
    const raw = form[key];
    payload[key] = raw === "" ? (optional ? null : undefined) : Number(raw);
  }
  return payload;
}

export default function CustomFoodForm({ onSubmit, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const setField = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const canSubmit = REQUIRED.every((key) => form[key].trim() !== "");

  async function handleSubmit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(toPayload(form));
    } catch (err) {
      setError(
        !err.response || err.response.status >= 500
          ? "Could not reach the server. Try again."
          : "That food could not be saved. Check the values and try again."
      );
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass} htmlFor="cf-description">
          Description
        </label>
        <input
          id="cf-description"
          className={inputClass}
          value={form.description}
          onChange={setField("description")}
          maxLength={200}
          placeholder="Protein shake, homemade"
        />
      </div>

      <p className="text-sm text-gray-500">
        All values per 100 g. Leave fibre, sugar or sodium blank if you don't
        know them.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, unit, optional }) => (
          <div key={key}>
            <label className={labelClass} htmlFor={`cf-${key}`}>
              {label} ({unit}){optional && " — optional"}
            </label>
            <input
              id={`cf-${key}`}
              className={inputClass}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={form[key]}
              onChange={setField(key)}
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || busy}
          className="flex-1 rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Create food"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}