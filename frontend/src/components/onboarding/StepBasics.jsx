import Select from "../Select";
import { SEX_OPTIONS } from "../../constants/profileOptions";
import { MAX_BIRTH_DATE, MIN_BIRTH_DATE } from "../../constants/profileOptions";
import { labelClass, inputClass } from "./formStyles";

export default function StepBasics({ form, onChange }) {
  return (
    <>
      <div>
        <label htmlFor="birthDate" className={labelClass}>
          Birth Date
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          min={MIN_BIRTH_DATE}
          max={MAX_BIRTH_DATE}
          value={form.birthDate}
          onChange={onChange}
          className={inputClass}
        />
      </div>
      <Select id="sex" label="Sex" options={SEX_OPTIONS} value={form.sex} onChange={onChange} />
      <p className="text-xs text-slate-500">
        Both are used in the equation that estimates how many calories you burn at rest.
      </p>
    </>
  );
}