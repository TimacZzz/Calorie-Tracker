import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Diary from "./pages/Diary";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoutes";
import Onboarding from "./pages/Onboarding";
import RequireProfile from "./components/RequireProfile";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><RequireProfile><Diary /></RequireProfile></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><RequireProfile><Profile /></RequireProfile></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><RequireProfile><Analytics /></RequireProfile></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

