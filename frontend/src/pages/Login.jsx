import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api";

// same SHA-256 as in Signup.jsx
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
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
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    if (!form.loginId || !form.password) {
      return setMsg({ type: "error", text: "Please enter login and password" });
    }

    setLoading(true);
    try {
      const hashed = await sha256(form.password);
      const res = await login({ loginId: form.loginId, password: hashed });

      // Save token for later API calls
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>

        {msg && (
          <div
            className={`mb-4 text-sm px-3 py-2 rounded ${
              msg.type === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email or Username
            </label>
            <input
              type="text"
              name="loginId"
              value={form.loginId}
              onChange={update}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={update}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-blue-600 hover:underline"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
