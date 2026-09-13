import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { api } from "../library/api";
import axios from "axios";
import { todayLocal } from "../library/dates";
import { groupByMeal, sumMealTotals } from "../library/diary.js";
import { resolveGrams, nutritionFor } from "../library/nutrition";
import FoodDetail from "../components/FoodDetails";
import FoodSearch from "../components/FoodSearch";
import DailyTotals from "../components/DailyTotals";
import DateNav from "../components/DateNav";
import Modal from "../components/Modal.jsx";
import EditEntryPanel from "../components/EditEntryPanel.jsx";

export default function Diary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(todayLocal());
  const [targets, setTargets] = useState(null);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState("loading");
  const [panel, setPanel] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [targetsStatus, setTargetsStatus] = useState("loading");

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
        setTargetsStatus("ready");
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setTargets(null);
        setTargetsStatus("error");
      });

    return () => controller.abort();
  }, []);

  function goToDate(next) {
    setDate(next);
    closePanel();
  }

  function closePanel() {
    setPanel(null);
    setSelectedId(null);
  }

  async function handleLog({ food, quantity, serving }) {
    const mealType = panel.meal;
    const res = await api.post("/api/entries", {
      foodId: food.id,
      servingId: serving ? serving.id : null,
      quantity,
      mealType,
      loggedOn: date,
    });
    setEntries((prev) => [...prev, res.data]);
    closePanel();
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function handleUpdate(updated) {
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  function handleDelete(id) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="p-6">
      <p className="text-sm">Signed in as {user.email}</p>

      <DateNav date={date} onChange={goToDate} />

      {targetsStatus === "error" && (
        <p className="mt-6 text-sm text-red-600">Couldn't load your targets.</p>
      )}
      {targets && <DailyTotals dayTotals={dayTotals} targets={targets} />}

      {status === "loading" && <p className="mt-6 text-sm">Loading…</p>}
      {status === "error" && <p className="mt-6 text-sm">Couldn't load this day.</p>}

      {status === "ready" &&
        byMeal.map((meal) => (
          <section key={meal.value} className="mt-6">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">{meal.label}</h2>
              <button
                onClick={() => setPanel({ mode: "add", meal: meal.value, label: meal.label })}
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
                      <button
                        type="button"
                        onClick={() => setPanel({ mode: "edit", entry: e })}
                        className="w-full text-left"
                      >
                        {e.food.description} — {Math.round(
                          nutritionFor(e.food, resolveGrams(e.quantity, e.serving)).calories
                        )} kcal
                      </button>
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
      
      {panel?.mode === "add" && (
        <Modal title={`Add to ${panel.label}`} onClose={closePanel}>
          {selectedId
            ? <FoodDetail foodId={selectedId} onLog={handleLog} />
            : <FoodSearch onSelect={(food) => setSelectedId(food.id)} />}
        </Modal>
      )}

      {panel?.mode === "edit" && (
        <Modal title="Edit entry" onClose={closePanel}>
          <EditEntryPanel
            entry={panel.entry}
            onSave={handleUpdate}
            onDelete={handleDelete}
            onClose={closePanel}
          />
        </Modal>
      )}

      <button onClick={handleLogout} className="mt-8 underline text-sm">
        Log out
      </button>
    </div>
  );
}