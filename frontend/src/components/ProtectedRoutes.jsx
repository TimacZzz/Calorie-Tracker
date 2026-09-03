import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === "loading") {
    return null;
  } 
  if (status === "anonymous") {
    return <Navigate to="/login" replace />;
  } 
  
  return children;
}