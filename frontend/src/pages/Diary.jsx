import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { api } from "../library/api";
import axios from "axios";
import { todayLocal } from "../library/dates";
import { MEAL_TYPES } from "../constants/mealTypes";
import { resolveGrams, nutritionFor } from "../library/nutrition";

export default function Diary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [date] = useState(todayLocal());
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const byMeal = MEAL_TYPES.map((meal) => {
    const items = entries.filter((e) => e.mealType === meal.value);
    const totals = items.reduce(
      (acc, e) => {
        const n = nutritionFor(e.food, resolveGrams(e.quantity, e.serving));
        return {
          calories: acc.calories + n.calories,
          proteinG: acc.proteinG + n.proteinG,
          carbsG: acc.carbsG + n.carbsG,
          fatG: acc.fatG + n.fatG,
        };
      },
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );
    return { ...meal, items, totals };
  });

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

  return (
  <div className="p-6">
    <p className="text-sm">Signed in as {user.email}</p>

    {status === "loading" && <p className="mt-6 text-sm">Loading…</p>}
    {status === "error" && <p className="mt-6 text-sm">Couldn't load this day.</p>}

    {status === "ready" &&
      byMeal.map((meal) => (
        <section key={meal.value} className="mt-6">
          <h2 className="font-medium">{meal.label}</h2>

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

    <button onClick={handleLogout} className="mt-8 underline text-sm">
      Log out
    </button>
  </div>
);
}