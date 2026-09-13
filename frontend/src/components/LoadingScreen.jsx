import { useEffect, useState } from "react";

export default function LoadingScreen({ delay = 250 }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!show) return null;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900 motion-reduce:animate-none"
      />
    </div>
  );
}