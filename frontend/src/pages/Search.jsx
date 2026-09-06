import FoodSearch from "../components/FoodSearch";

export default function Search() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Find a food</h1>
      <FoodSearch onSelect={(food) => console.log(food)} />
    </div>
  );
}