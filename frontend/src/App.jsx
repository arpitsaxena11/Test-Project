import { Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup.jsx";
import VerifyOtp from "./pages/VerifyOtp.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
