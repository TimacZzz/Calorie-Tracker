import { useEffect, useState } from "react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../library/api";
import { rangeEndingToday, densifySeries } from "../library/analytics";

const RANGE_OPTIONS = [7, 30];

export default function Analytics() {
  const [days, setDays] = useState(7);

  const [series, setSeries] = useState([]);
  const [seriesStatus, setSeriesStatus] = useState("loading");

  const [calorieTarget, setCalorieTarget] = useState(null);
  const [targetStatus, setTargetStatus] = useState("loading");

  const { start, end } = rangeEndingToday(days);

  useEffect(() => {
    const controller = new AbortController();
    setSeriesStatus("loading");

    api
      .get("/api/analytics/daily", {
        params: { start, end },
        signal: controller.signal,
      })
      .then(({ data }) => {
        setSeries(data.series);
        setSeriesStatus("ready");
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setSeriesStatus("error");
      });

    return () => controller.abort();
  }, [start, end]);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/api/profile/me", { signal: controller.signal })
      .then(({ data }) => {
        setCalorieTarget(data.profile.calorieTarget);
        setTargetStatus("ready");
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setTargetStatus("error");
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Calories</h1>

        <div className="flex gap-1 rounded-md bg-slate-100 p-1">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              aria-pressed={days === option}
              className={`rounded px-3 py-1 text-sm font-medium ${
                days === option
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {option} days
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-72">
        <ChartArea
          status={seriesStatus}
          series={series}
          start={start}
          end={end}
          days={days}
          calorieTarget={targetStatus === "ready" ? calorieTarget : null}
        />
      </div>
    </div>
  );
}

function ChartArea({ status, series, start, end, days, calorieTarget }) {
  if (status === "loading") {
    return <ChartMessage>Loading…</ChartMessage>;
  }

  if (status === "error") {
    return <ChartMessage>Could not load your chart. Refresh to try again.</ChartMessage>;
  }

  if (series.length === 0) {
    return <ChartMessage>Nothing logged in the last {days} days.</ChartMessage>;
  }

  const dense = densifySeries(series, start, end);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={dense}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} fontSize={12} />
        <YAxis fontSize={12} tickCount={8} />
        <Tooltip
          formatter={(value) => [
            value == null ? "Not logged" : `${Math.round(value)} kcal`,
            "Calories",
          ]}
        />
        <Bar dataKey="calories" fill="#0f172a" radius={[4, 4, 0, 0]} minPointSize={3} />
        {calorieTarget != null && (
          <ReferenceLine
            y={calorieTarget}
            stroke="#059669"
            strokeDasharray="6 4"
            ifOverflow="extendDomain"
            label={{ value: `Target ${calorieTarget}`, position: "insideTopRight", fontSize: 12 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function ChartMessage({ children }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-300 text-sm text-slate-500">
      {children}
    </div>
  );
}