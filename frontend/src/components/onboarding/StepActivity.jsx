import Select from "../Select";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS } from "../../constants/profileOptions";

export default function StepActivity({ form, onChange }) {
  return (
    <>
      <Select
        id="activityLevel"
        label="Activity level"
        options={ACTIVITY_OPTIONS}
        value={form.activityLevel}
        onChange={onChange}
      />
      <Select id="goal" label="Goal" options={GOAL_OPTIONS} value={form.goal} onChange={onChange} />
    </>
  );
}