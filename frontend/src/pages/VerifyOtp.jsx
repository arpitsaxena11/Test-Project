import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp, generateOtp } from "../api";

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const user_id = state?.user_id;
  const email = state?.email;

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const errorMessages = {
    "0": "Incorrect OTP",
    "-1": "OTP Expired",
    "-2": "Already Used",
    "-3": "Retry Limit Exceeded",
    "-4": "Blocked",
    "-99": "Error",
  };

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    const res = await verifyOtp(user_id, otp);
    const code = String(res.RETCODE);

    if (code === "1") {
      setMsg({ type: "success", text: "OTP Verified!" });
      setTimeout(() => navigate("/login"), 800);
    } else {
      setMsg({ type: "error", text: errorMessages[code] });
    }

    setLoading(false);
  }

  async function resend() {
    await generateOtp(user_id);
    setMsg({ type: "success", text: "OTP Resent!" });
  }

  return (
    <div className="container">
      <h2>Verify OTP</h2>

      <form className="card" onSubmit={submit}>
        <div className="row">
          <label>Email</label>
          <input value={email} readOnly />
        </div>

        <div className="row">
          <label>Enter OTP</label>
          <input value={otp} onChange={(e) => setOtp(e.target.value)} />
        </div>

        <button disabled={loading}>{loading ? "Checking..." : "Verify"}</button>

        <button type="button" onClick={resend}>Resend OTP</button>

        {msg && <div className={`message ${msg.type}`}>{msg.text}</div>}
      </form>
    </div>
  );
}
