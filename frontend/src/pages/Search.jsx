import FoodSearch from "../components/FoodSearch";
import FoodDetail from "../components/FoodDetails";
import { useState } from "react";

export default function Search() {
  const [selectedId, setSelectedId] = useState(null);

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Find a food</h1>
      <FoodSearch onSelect={(food) => setSelectedId(food.id)} />
      {selectedId && (
        <FoodDetail foodId={selectedId} onLog={console.log(1)} />
      )}
    </div>
  );
}