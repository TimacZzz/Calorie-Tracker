import { selectClass, labelClass } from "./onboarding/formStyles.js";

export default function Select({ id, label, options, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select id={id} name={id} value={value} onChange={onChange} className={selectClass}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}