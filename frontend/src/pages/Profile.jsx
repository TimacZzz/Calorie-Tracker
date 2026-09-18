import { useState, useEffect } from "react";
import { api } from "../library/api";
import axios from "axios";
import ProfileForm from "../components/profile/ProfileForm";
import LoadingScreen from "../components/LoadingScreen";
import { fromProfile } from "../library/profile";
import { toProfilePayload } from "../library/profile";

export default function Profile() {
  const [form, setForm] = useState(null);
  const [targets, setTargets] = useState(null);
  const [status, setStatus] = useState("loading");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    api
      .get("/api/profile/me", { signal: controller.signal })
      .then(({ data }) => {
        setForm(fromProfile(data.profile));
        setTargets(data.profile);
        setStatus("ready");
      })
      .catch((err) => {
        if (axios.isCancel(err)) return;
        setStatus("error");
      });

    return () => controller.abort();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const { data } = await api.put("/api/profile/me", toProfilePayload(form));
      setTargets(data.profile);
      setForm(fromProfile(data.profile));
    } catch (err) {
      setSaveError(
        !err.response || err.response.status >= 500
          ? "Could not reach the server. Check your connection and try again."
          : "Could not save your profile. Check your details and try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") return <LoadingScreen />;

  if (status === "error") {
    return (
      <div className="mx-auto max-w-md px-4 py-10">
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          Could not load your profile. Refresh to try again.
        </p>
      </div>
    );
  }

  const complete = Object.values(form).every((value) => value !== "");

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Your profile</h1>
      <p className="mt-2 text-sm text-slate-600">
        Updating these recalculates your daily calorie and macro targets.
      </p>

      <div className="mt-6 grid grid-cols-4 gap-3 rounded-md bg-slate-50 px-4 py-3 text-center">
        <div>
          <p className="text-lg font-semibold text-slate-900">{targets.calorieTarget}</p>
          <p className="text-xs text-slate-500">kcal</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{targets.proteinTargetG}g</p>
          <p className="text-xs text-slate-500">protein</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{targets.carbsTargetG}g</p>
          <p className="text-xs text-slate-500">carbs</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-900">{targets.fatTargetG}g</p>
          <p className="text-xs text-slate-500">fat</p>
        </div>
      </div>

      <div className="mt-8">
        <ProfileForm form={form} onChange={handleChange} />
      </div>

      <button
        type="button"
        disabled={!complete || saving}
        onClick={handleSave}
        className="mt-8 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}