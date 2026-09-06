import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      if (!err.response) {
        setError("Can't reach the server.");
      } else if (err.response.status === 429) {
        setError("Too many attempts. Try again in a few minutes.");
      } else if (err.response.status === 409) {
        setError("An account with that email already exists.");
      } else if (err.response.status === 400) {
        setError(err.response.data.message ?? "Check your details and try again.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6">Sign up</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm mb-1">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign up"}
          </button>
        </form>

        <p className="text-sm mt-4">
          Already have an account? <Link to="/login" className="underline">Login</Link>
        </p>
      </div>
    </div>
  );
}