import React, { useState } from "react";
import { login } from "../api";

export default function Login() {
  const [ue, setUE] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    try {
      const res = await login({ usernameOrEmail: ue, password });
      setMsg({ type: "success", text: "Login Successful" });

      localStorage.setItem("token", res.token);

    } catch (err) {
      setMsg({ type: "error", text: "Invalid Credentials" });
    }
  }

  return (
    <div className="container">
      <h2>Login</h2>

      <form className="card" onSubmit={submit}>
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
    </div>
  );
}
