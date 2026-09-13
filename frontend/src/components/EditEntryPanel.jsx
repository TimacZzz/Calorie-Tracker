import { useState } from "react";
import { api } from "../library/api.js";
import { MEAL_TYPES } from "../constants/mealTypes.js";
import FoodDetail, { GRAMS } from "./FoodDetails.jsx";
import { inputClass, labelClass } from "./onboarding/formStyles.js";

/**
 * Edit one diary entry. Quantity and serving stay inside FoodDetail and arrive
 * through its submit callback; this component owns meal type and delete only.
 */
export default function EditEntryPanel({ entry, onSave, onDelete, onClose }) {
  const [mealType, setMealType] = useState(entry.mealType);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit({ quantity, serving }) {
    const servingId = serving ? serving.id : null;

    // Send changed fields only. updateEntrySchema refines on non-empty, so an
    // unchanged save would 400 — close instead of asking the server.
    const patch = {};
    if (quantity !== entry.quantity) patch.quantity = quantity;
    if (servingId !== entry.servingId) patch.servingId = servingId;
    if (mealType !== entry.mealType) patch.mealType = mealType;

    if (Object.keys(patch).length === 0) return onClose();

    setBusy(true);
    setError(null);
    try {
      const res = await api.patch(`/api/entries/${entry.id}`, patch);
      onSave(res.data);
      onClose();
    } catch (err) {
      setBusy(false);
      setError(
        !err.response || err.response.status >= 500
          ? "Couldn't reach the server. Check your connection and try again."
          : err.response.status === 404
            ? "That entry no longer exists."
            : "Couldn't save this entry."
      );
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/api/entries/${entry.id}`);
      onDelete(entry.id);
      onClose();
    } catch (err) {
      setBusy(false);
      setError(
        !err.response || err.response.status >= 500
          ? "Couldn't reach the server. Check your connection and try again."
          : err.response.status === 404
            ? "That entry no longer exists."
            : "Couldn't delete this entry."
      );
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="mealType" className={labelClass}>Meal</label>
        <select
          id="mealType"
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className={inputClass}
        >
          {MEAL_TYPES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <FoodDetail
        foodId={entry.foodId}
        initialQuantity={entry.quantity}
        initialUnit={entry.servingId ?? GRAMS}
        submitLabel={busy ? "Saving…" : "Save changes"}
        onLog={handleSubmit}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="border-t border-slate-100 pt-4">
        {confirming ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-700">Delete this entry?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:bg-red-300"
              >
                {busy ? "Deleting…" : "Delete"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="rounded px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                Keep it
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-sm text-red-600 underline"
          >
            Delete entry
          </button>
        )}
      </div>
    </div>
  );
}
