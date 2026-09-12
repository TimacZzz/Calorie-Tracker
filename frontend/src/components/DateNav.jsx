import { todayLocal, shiftDate } from "../library/dates";

export default function DateNav({ date, onChange }) {
  const isToday = date === todayLocal();

  return (
    <div className="mt-4 flex items-center gap-2">
      <button onClick={() => onChange(shiftDate(date, -1))} className="text-sm underline">
        ‹ Prev
      </button>
      <input
        type="date"
        value={date}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm"
      />
      <button onClick={() => onChange(shiftDate(date, 1))} className="text-sm underline">
        Next ›
      </button>
      <button
        onClick={() => onChange(todayLocal())}
        disabled={isToday}
        className="text-sm underline disabled:no-underline disabled:text-gray-400"
      >
        Today
      </button>
    </div>
  );
}