import { useEffect, useState } from "react";
import axios from "axios";
import { api } from "../library/api";
import { useDebounce } from "../hooks/useDebounce";

const MIN_QUERY_LENGTH = 2;

export default function FoodSearch({ onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const debouncedQuery = useDebounce(query, 300);
  const isIdle = debouncedQuery.trim().length < MIN_QUERY_LENGTH;

  useEffect(() => {
    const term = debouncedQuery.trim();

    if (term.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setHasMore(false);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    api
      .get("/api/foods/search", {
        params: { q: term, offset: 0 },
        signal: controller.signal,
      })
      .then((res) => {
        setResults(res.data.results);
        setHasMore(res.data.hasMore);
        setLoading(false);
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setError("Could not load results.");
        setResults([]);
        setHasMore(false);
        setLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const { data } = await api.get("/api/foods/search", {
        params: { q: debouncedQuery.trim(), offset: results.length },
      });
      setResults((previous) => [...previous, ...data.results]);
      setHasMore(data.hasMore);
    } catch {
      setError("Could not load more results.");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div>
      <label htmlFor="food-search" className="block text-sm mb-1">
        Search foods
      </label>
      <input
        id="food-search"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="chicken breast"
        className="w-full rounded border px-3 py-2"
      />

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {isIdle && !error && (
        <p className="mt-4 text-sm text-slate-500">
          Type at least {MIN_QUERY_LENGTH} characters to search.
        </p>
      )}

      {!isIdle && !error && !loading && results.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No foods match “{debouncedQuery.trim()}”.
        </p>
      )}

      {results.length > 0 && (
        <ul
          className={`mt-4 space-y-2 transition-opacity ${
            loading ? "opacity-50" : ""
          }`}
        >
          {results.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                onClick={() => onSelect(food)}
                className="w-full rounded border px-3 py-2 text-left hover:bg-slate-50"
              >
                <span className="block text-sm font-medium text-slate-900">
                  {food.description}
                  {food.userId !== null && (
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-normal text-slate-600">
                      Custom
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  {food.calories} kcal · P {food.proteinG} · C {food.carbsG} · F{" "}
                  {food.fatG} — per 100g
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasMore && !loading && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full rounded border px-3 py-2 text-sm disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}