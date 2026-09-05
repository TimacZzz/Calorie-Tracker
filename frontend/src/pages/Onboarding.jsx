import { useState } from "react";
import { SEX_OPTIONS, ACTIVITY_OPTIONS, GOAL_OPTIONS } from "../constants/profileOptions";

const EMPTY_FORM = {
  age: "",
  sex: "",
  heightCm: "",
  weightKg: "",
  activityLevel: "",
  goal: "",
};

export default function Onboarding() {
  const [form, setForm] = useState(EMPTY_FORM);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Set up your profile</h1>
      <p className="mt-2 text-sm text-slate-600">
        These six answers set your daily calorie and macro targets. You can change them later.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-slate-700">
            Age
          </label>
          <input
            id="age"
            name="age"
            type="number"
            inputMode="numeric"
            min="13"
            max="120"
            value={form.age}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label htmlFor="sex" className="block text-sm font-medium text-slate-700">
            Sex
          </label>
          <select
            id="sex"
            name="sex"
            value={form.sex}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Select</option>
            {SEX_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Used only in the calorie equation, which is calibrated on these two values.
          </p>
        </div>

        <div>
          <label htmlFor="heightCm" className="block text-sm font-medium text-slate-700">
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
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label htmlFor="weightKg" className="block text-sm font-medium text-slate-700">
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
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div>
          <label htmlFor="activityLevel" className="block text-sm font-medium text-slate-700">
            Activity level
          </label>
          <select
            id="activityLevel"
            name="activityLevel"
            value={form.activityLevel}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Select</option>
            {ACTIVITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-slate-700">
            Goal
          </label>
          <select
            id="goal"
            name="goal"
            value={form.goal}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          >
            <option value="">Select</option>
            {GOAL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* TODO Day 10: replace with the real submit. Numbers are strings here and
            need Number() at the post boundary, or z.coerce.number() server-side. */}
        <button
          type="button"
          onClick={() => console.log(form)}
          className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Log form state
        </button>
      </div>
    </div>
  );
}
