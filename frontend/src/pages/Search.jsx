import FoodSearch from "../components/FoodSearch";
import FoodDetail from "../components/FoodDetails";
import { MEAL_TYPES } from "../constants/mealTypes";
import { useState } from "react";

export default function Search() {
  const [addingTo, setAddingTo] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <div className="flex items-baseline justify-between">
        <h2 className="font-medium">{meal.label}</h2>
        <button
          onClick={() => setAddingTo(meal.value)}
          className="text-sm underline"
        >
          Add
        </button>
      </div>
      {addingTo && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-lg p-6 rounded-t-lg sm:rounded-lg">
            <div className="flex items-baseline justify-between">
              <h2 className="font-medium">
                Add to {MEAL_TYPES.find((m) => m.value === addingTo).label}
              </h2>
              <button onClick={() => setAddingTo(null)} className="text-sm underline">
                Close
              </button>
            </div>
            <div className="mx-auto max-w-md px-4 py-10">
              <h1 className="mb-6 text-2xl font-semibold">Find a food</h1>
              <FoodSearch onSelect={(food) => setSelectedId(food.id)} />
              {selectedId && (
                <FoodDetail foodId={selectedId} onLog={console.log(1)} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}