import { labelClass, inputClass } from "../onboarding/formStyles";

export default function BodyFields({ form, onChange }) {
  return (
    <>
      <div>
        <label htmlFor="heightCm" className={labelClass}>
          Height (cm)
        </label>
        <input
          id="heightCm"
          name="heightCm"
          type="number"
          inputMode="decimal"
          min="100"
          max="250"
          value={form.heightCm}
          onChange={onChange}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="weightKg" className={labelClass}>
          Current weight (kg)
        </label>
        <input
          id="weightKg"
          name="weightKg"
          type="number"
          inputMode="decimal"
          min="30"
          max="400"
          step="0.1"
          value={form.weightKg}
          onChange={onChange}
          className={inputClass}
        />
      </div>
    </>
  );
}