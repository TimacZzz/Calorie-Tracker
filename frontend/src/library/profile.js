export function toProfilePayload(form) {
  return {
    ...form,
    heightCm: Number(form.heightCm),
    weightKg: Number(form.weightKg),
  };
}

export function fromProfile(profile) {
  return {
    birthDate: profile.birthDate.slice(0, 10),
    sex: profile.sex,
    heightCm: String(profile.heightCm),
    weightKg: String(profile.weightKg),
    activityLevel: profile.activityLevel,
    goal: profile.goal,
  };
}