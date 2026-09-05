import { useNavigate } from "react-router-dom";

const MACROS = [
  { key: "proteinTargetG", label: "Protein" },
  { key: "carbsTargetG", label: "Carbs" },
  { key: "fatTargetG", label: "Fat" },
];

export default function TargetsSummary({ targets }) {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Your daily targets</h1>
      <p className="mt-2 text-sm text-slate-600">
        Worked out from your details. Update your profile any time and these change with it.
      </p>

      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 px-6 py-8 text-center">
        <p className="text-5xl font-semibold tracking-tight text-slate-900">
          {targets.calorieTarget.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-slate-600">calories per day</p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {MACROS.map((macro) => (
          <div key={macro.key} className="rounded-lg border border-slate-200 px-3 py-4 text-center">
            <p className="text-xl font-semibold text-slate-900">{targets[macro.key]}g</p>
            <p className="mt-1 text-sm text-slate-600">{macro.label}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-8 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
      >
        Start logging food
      </button>
    </div>
  );
}
