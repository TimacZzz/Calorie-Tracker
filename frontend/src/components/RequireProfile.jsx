import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RequireProfile({ children }) {
  const { status, user } = useAuth();

  if (status === "loading") {
    return null;
  } 
  if (status === "authenticated" && !user.hasProfile) {
    return <Navigate to="/onboarding" replace />;
  } 
  
  return children;
}