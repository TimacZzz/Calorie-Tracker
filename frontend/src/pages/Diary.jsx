import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Diary() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="p-6">
      <p className="text-sm">Signed in as {user.email}</p>
      <button onClick={handleLogout} className="mt-4 underline text-sm">
        Log out
      </button>
    </div>
  );
}