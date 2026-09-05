// Values must match the enums in schema.prisma exactly — they are posted as-is.
// Labels are what the user reads and are never sent to the server.

export const SEX_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

export const ACTIVITY_OPTIONS = [
  { value: "SEDENTARY", label: "Sedentary — desk job, little exercise" },
  { value: "LIGHT", label: "Lightly active — exercise 1–3 days a week" },
  { value: "MODERATE", label: "Moderately active — exercise 3–5 days a week" },
  { value: "ACTIVE", label: "Very active — exercise 6–7 days a week" },
  { value: "VERY_ACTIVE", label: "Extremely active — physical job or twice-daily training" },
];

export const GOAL_OPTIONS = [
  { value: "LOSE", label: "Lose weight" },
  { value: "MAINTAIN", label: "Maintain weight" },
  { value: "GAIN", label: "Gain weight" },
];

function isoYearsAgo(years) {
  const today = new Date();
  const date = new Date(today.getFullYear() - years, today.getMonth(), today.getDate());
  return date.toLocaleDateString("en-CA");
}

// Must stay in step with MIN_BIRTH_DATE / MAX_BIRTH_DATE in the profile schema.
export const MAX_BIRTH_DATE = isoYearsAgo(13);
export const MIN_BIRTH_DATE = isoYearsAgo(120);