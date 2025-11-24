import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";

// Secure SHA-256
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");                     // <-- FIXED
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const prefilledEmail = location.state?.email || "";

  const [form, setForm] = useState({
    loginId: prefilledEmail,
    password: "",
  });

  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.loginId.trim() || !form.password.trim()) {
      return setMsg({ type: "error", text: "Please enter login and password" });
    }

    setLoading(true);

    try {
      const hashed = await sha256(form.password);

      const res = await login({
        loginId: form.loginId.trim(),
        password: hashed,
      });

      if (res.token) {
        localStorage.setItem("authToken", res.token);
      }

      setMsg({ type: "success", text: "Login successful! Redirecting..." });

      setTimeout(() => navigate("/dashboard"), 800);

    } catch (err) {
      console.error("Login failed:", err);
      const text =
        err.response?.data?.message || "Invalid email/username or password";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-md border border-gray-200">
        
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          Sign In
        </h1>

        {msg && (
          <div
            className={`mb-4 text-sm px-4 py-3 rounded-lg shadow-sm border ${
              msg.type === "error"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email or Username
            </label>
            <input
              type="text"
              name="loginId"
              value={form.loginId}
              onChange={update}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email or username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-700">Don’t have an account?</span>{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
