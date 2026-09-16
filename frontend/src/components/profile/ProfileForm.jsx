import BasicsFields from "./BasicsFields";
import BodyFields from "./BodyFields";
import ActivityFields from "./ActivityFields";

export default function ProfileForm({ form, onChange }) {
  return (
    <div className="space-y-5">
      <BasicsFields form={form} onChange={onChange} />
      <BodyFields form={form} onChange={onChange} />
      <ActivityFields form={form} onChange={onChange} />
    </div>
  );
}