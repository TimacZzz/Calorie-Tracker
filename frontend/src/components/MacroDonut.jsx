import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { macroEnergy } from "../library/analytics";

// Hex, not Tailwind classes — classes do not reach SVG attributes.
const COLOURS = { proteinG: "#0ea5e9", carbsG: "#f59e0b", fatG: "#e11d48" };

function Frame({ children }) {
  return (
    <section className="mt-6 rounded-md border border-slate-200 p-4">
      <h2 className="text-sm font-medium text-slate-900">Today's macros</h2>
      {children}
    </section>
  );
}

function Message({ children }) {
  // Same height as the ring, so the card doesn't jump when data arrives.
  return (
    <div className="mt-3 flex h-56 items-center justify-center rounded-md border border-dashed border-slate-300 px-4 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

// status: the /daily fetch's status — this card reads a row already fetched.
// row:    today's row from the sparse series, or null when nothing is logged today.
export default function MacroDonut({ status, row }) {
  if (status === "loading") {
    return <Frame><Message>Loading…</Message></Frame>;
  }
  if (status === "error") {
    return <Frame><Message>Macros could not be loaded.</Message></Frame>;
  }
  if (!row) {
    return (
      <Frame>
        <Message>Nothing logged today. Add a meal in the diary to see its breakdown here.</Message>
      </Frame>
    );
  }

  const { parts, total } = macroEnergy(row);

  if (total === 0) {
    return (
      <Frame>
        <Message>Food is logged today, but none of it contains protein, carbs or fat.</Message>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        <div className="h-56 w-56 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={parts}
                dataKey="kcal"
                nameKey="label"
                innerRadius="60%"
                outerRadius="90%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {parts.map((p) => (
                  <Cell key={p.key} fill={COLOURS[p.key]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="w-full space-y-2 text-sm sm:w-auto">
          {parts.map((p) => (
            <li key={p.key} className="flex items-center gap-3">
              <span
                className="h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: COLOURS[p.key] }}
                aria-hidden="true"
              />
              <span className="w-16 text-slate-600">{p.label}</span>
              <span className="w-16 text-right font-medium text-slate-900 tabular-nums">
                {Math.round(p.grams)} g
              </span>
              <span className="w-12 text-right text-slate-500 tabular-nums">
                {Math.round(p.share * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Slices show each macro's share of calories at 4, 4 and 9 kcal per gram. That
        adds up to about {Math.round(total)} kcal, not today's{" "}
        {Math.round(row.calories)} kcal, because USDA calorie values use
        food-specific conversion factors.
      </p>
    </Frame>
  );
}
