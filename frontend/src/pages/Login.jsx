import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const [ue, setUE] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);

    try {
      const res = await login({ usernameOrEmail: ue, password });

      if (res.token) {
        localStorage.setItem("token", res.token);
        setMsg({ type: "success", text: "Login Successful" });
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        setMsg({ type: "error", text: res.error || "Invalid Credentials" });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Server Error" });
    }
  }

  return (
    <div className="container">
      <h2>Login</h2>

      <form onSubmit={onSubmit}>
        <div className="row">
          <label>Email / Username</label>
          <input value={ue} onChange={(e) => setUE(e.target.value)} />
        </div>

        <div className="row">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button>Login</button>

        {msg && <div className={`message ${msg.type}`}>{msg.text}</div>}
      </form>

      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <a href="/">Create Account</a>
      </div>
    </div>
  );
}
