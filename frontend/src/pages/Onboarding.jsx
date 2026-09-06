import { useState } from "react";
import { api } from "../library/api";
import TargetsSummary from "../components/onboarding/TargetsSummary";
import StepBasics from "../components/onboarding/StepBasics";
import StepBody from "../components/onboarding/StepBody";
import StepActivity  from "../components/onboarding/StepActivity";
import { useAuth } from "../hooks/useAuth";

const EMPTY_FORM = {
  birthDate: "",
  sex: "",
  heightCm: "",
  weightKg: "",
  activityLevel: "",
  goal: "",
};

const STEPS = [
  { title: "About you", Fields: StepBasics, required: ["birthDate", "sex"] },
  { title: "Height and weight", Fields: StepBody, required: ["heightCm", "weightKg"] },
  { title: "Activity and goal", Fields: StepActivity, required: ["activityLevel", "goal"] },
];

export default function Onboarding() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [targets, setTargets] = useState(null);

  const { title, Fields, required } = STEPS[step];
  const isLastStep = step === STEPS.length - 1;
  const canAdvance = required.every((field) => form[field] !== "");
  const { markProfileComplete } = useAuth();

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.put("/api/profile/me", {
        ...form,
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      });
      setTargets(data.profile);
      markProfileComplete();
    } catch {
      setError("Could not save your profile. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (targets) {
    return <TargetsSummary targets={targets} />;
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <p className="text-sm text-slate-500">
        Step {step + 1} of {STEPS.length}
      </p>
      <div className="mt-2 h-1 w-full rounded-full bg-slate-200">
        <div
          className="h-1 rounded-full bg-slate-900 transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">
        These six answers set your daily calorie and macro targets. You can change them later.
      </p>

      <div className="mt-8 space-y-5">
        <Fields form={form} onChange={handleChange} />
      </div>

      {error && (
        <p className="mt-6 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Back
          </button>
        )}
        <button
          type="button"
          disabled={!canAdvance || submitting}
          onClick={() => (isLastStep ? handleSubmit() : setStep((s) => s + 1))}
          className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? "Saving…" : isLastStep ? "See my targets" : "Continue"}
        </button>
      </div>
    </div>
  );
}
