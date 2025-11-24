// frontend/src/pages/VerifyOtp.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp, generateOtp } from "../api";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, user_id } = location.state || {};

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!email || !user_id) {
    return (
      <div className="page">
        <div className="card">
          <p>Missing signup data. Please sign up again.</p>
        </div>
      </div>
    );
  }

  const messages = {
    1: "OTP verified successfully!",
    0: "Invalid OTP.",
    "-1": "OTP expired.",
    "-2": "OTP already used.",
    "-3": "Retry limit exceeded.",
    "-4": "Account blocked.",
    "-99": "Server Error.",
  };

  async function handleVerify(e) {
    e.preventDefault();
    setMsg(null);

    if (!otp.trim()) {
      return setMsg({ type: "error", text: "Please enter OTP" });
    }

    setLoading(true);

    try {
      const res = await verifyOtp({ user_id, otp });
      console.log("Verify response:", res);

      const ret = res?.retcode ?? -99;
      const text = messages[String(ret)] || "Unknown response";

      if (ret === 1) {
        // Success
        setMsg({ type: "success", text });
        setTimeout(() => navigate("/dashboard"), 800);
      } else {
        // ❗ Clear OTP for any failed attempt
        setOtp("");

        setMsg({ type: "error", text });
      }
    } catch (err) {
      console.error("Verify error:", err);
      setMsg({ type: "error", text: "Server Error" });
    } finally {
      setLoading(false);
    }
  }


  async function handleResend() {
    setMsg(null);
    try {
      await generateOtp(user_id, email);
      setMsg({
        type: "success",
        text: "OTP resent to your email.",
      });
    } catch (err) {
      console.error("Resend error:", err);
      setMsg({ type: "error", text: "Failed to resend OTP" });
    }
  }

  return (
    <div className="page">
      <div className="card small">
        <h1 className="title">Verify OTP</h1>

        {msg && (
          <div
            className={
              msg.type === "error" ? "alert alert-error" : "alert alert-ok"
            }
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleVerify}>
          <label>
            Email
            <input value={email} disabled />
          </label>

          <label>
            Enter OTP
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </label>

          <button
            className="btn primary full-width"
            disabled={loading || otp.length < 4}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

        </form>

        <button
          type="button"
          className="btn secondary full-width"
          onClick={handleResend}
        >
          Resend OTP
        </button>
      </div>
    </div>
  );
}
