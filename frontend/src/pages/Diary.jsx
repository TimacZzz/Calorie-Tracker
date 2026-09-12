import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { api } from "../library/api";
import axios from "axios";
import { todayLocal } from "../library/dates";
import { groupByMeal, sumMealTotals } from "../library/diary.js";
import { MEAL_TYPES } from "../constants/mealTypes";
import { resolveGrams, nutritionFor } from "../library/nutrition";
import FoodDetail from "../components/FoodDetails";
import FoodSearch from "../components/FoodSearch";
import DailyTotals from "../components/DailyTotals";
import DateNav from "../components/DateNav";

export default function Diary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayLocal());
  const [targets, setTargets] = useState(null);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [addingTo, setAddingTo] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  

  const byMeal = groupByMeal(entries);
  const dayTotals = sumMealTotals(byMeal);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");

    api
      .get("/api/entries", { params: { date }, signal: controller.signal })
      .then((res) => {
        setEntries(res.data.entries);
        setStatus("ready");
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setStatus("error");
      });

    return () => controller.abort();
  }, [date]);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/api/profile/me", { signal: controller.signal })
      .then(({ data }) => {
        const { calorieTarget, proteinTargetG, carbsTargetG, fatTargetG } = data.profile;
        setTargets({ calorieTarget, proteinTargetG, carbsTargetG, fatTargetG });
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setTargets(null);
      });

    return () => controller.abort();
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function goToDate(next) {
    setDate(next);
    setAddingTo(null);
    setSelectedId(null);
  }

  async function handleLog({ food, quantity, serving }) {
    const res = await api.post("/api/entries", {
      foodId: food.id,
      servingId: serving ? serving.id : null,
      quantity,
      mealType: addingTo,
      loggedOn: date,
    });
    setEntries((prev) => [...prev, res.data]);
    setAddingTo(null);
    setSelectedId(null);
  }

  return (
    <div className="p-6">
      <p className="text-sm">Signed in as {user.email}</p>

      <DateNav date={date} onChange={goToDate} />

      {targets && <DailyTotals dayTotals={dayTotals} targets={targets} />}

      {status === "loading" && <p className="mt-6 text-sm">Loading…</p>}
      {status === "error" && <p className="mt-6 text-sm">Couldn't load this day.</p>}

      {status === "ready" &&
        byMeal.map((meal) => (
          <section key={meal.value} className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{meal.label}</h2>
              <button
                onClick={() => setAddingTo(meal.value)}
                className="text-sm underline"
              >
                Add
              </button>
            </div>

            {meal.items.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing logged</p>
            ) : (
              <>
                <ul className="mt-1">
                  {meal.items.map((e) => (
                    <li key={e.id} className="text-sm">
                      {e.food.description} — {Math.round(
                        nutritionFor(e.food, resolveGrams(e.quantity, e.serving)).calories
                      )} kcal
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-500">
                  {Math.round(meal.totals.calories)} kcal ·{" "}
                  {Math.round(meal.totals.proteinG)}p ·{" "}
                  {Math.round(meal.totals.carbsG)}c ·{" "}
                  {Math.round(meal.totals.fatG)}f
                </p>
              </>
            )}
          </section>
        ))}
      
      {addingTo && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg p-6 rounded-t-lg sm:rounded-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">
                Add to {MEAL_TYPES.find((m) => m.value === addingTo).label}
              </h2>
              <button 
                onClick={() => {
                  setAddingTo(null);
                  setSelectedId(null);
                }} 
                className="text-sm underline"
              >
                Close
              </button>
            </div>
            <div className="mx-auto max-w-md px-4 py-10">
              <h1 className="mb-6 text-2xl font-semibold">Find a food</h1>
              <FoodSearch onSelect={(food) => setSelectedId(food.id)} />
              {selectedId && (
                <FoodDetail foodId={selectedId} onLog={handleLog} />
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleLogout} className="mt-8 underline text-sm">
        Log out
      </button>
    </div>
  );
}