import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyOtp, generateOtp } from "../api";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();

  const { email, user_id } = location.state || {};

  const [otp, setOtp] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await verifyOtp({ user_id, otp });

      if (!res || res.error) {
        setMsg({ type: "error", text: "Server Error" });
        return;
      }

      const { retcode: code, message } = res;

      switch (code) {
        case 1:
          setMsg({ type: "success", text: "OTP Verified Successfully!" });
          setTimeout(() => navigate("/dashboard"), 800);
          break;
        case 0:
          setMsg({ type: "error", text: "Invalid OTP" });
          break;
        case -1:
          setMsg({ type: "error", text: "OTP Expired" });
          break;
        case -2:
          setMsg({ type: "error", text: "OTP Already Used" });
          break;
        case -3:
          setMsg({ type: "error", text: "Retry Limit Exceeded" });
          break;
        case -4:
          setMsg({ type: "error", text: "OTP Blocked" });
          break;
        default:
          setMsg({ type: "error", text: message || "Unknown Error" });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Server Error" });
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setMsg(null);
    try {
      await generateOtp(user_id);
      setMsg({ type: "success", text: "OTP Sent Again" });
    } catch {
      setMsg({ type: "error", text: "Failed to resend OTP" });
    }
  }

  return (
    <div
      className="container d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        background: "#f7f7f9",
        padding: "20px"
      }}
    >
      <div
        className="card shadow-sm"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "25px",
          borderRadius: "14px",
          border: "1px solid #eee"
        }}
      >
        <h3
          className="text-center fw-bold"
          style={{ fontSize: "24px", marginBottom: "10px" }}
        >
          Verify OTP
        </h3>

        <p
          className="text-center text-muted"
          style={{ fontSize: "14px", marginBottom: "20px" }}
        >
          Enter the OTP sent to your email
        </p>

        <form onSubmit={handleVerify}>
          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 600 }}>
              Email
            </label>
            <input
              type="text"
              value={email}
              disabled
              className="form-control"
              style={{
                borderRadius: "10px",
                padding: "12px",
                background: "#f0f0f0"
              }}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" style={{ fontWeight: 600 }}>
              Enter OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="form-control"
              placeholder="Enter 6-digit OTP"
              style={{ borderRadius: "10px", padding: "12px" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-100"
            style={{ padding: "12px", borderRadius: "10px" }}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <button
          onClick={resendOtp}
          className="btn btn-dark w-100"
          style={{
            marginTop: "12px",
            padding: "12px",
            borderRadius: "10px"
          }}
        >
          Resend OTP
        </button>

        {msg && (
          <div
            className={`alert ${
              msg.type === "error" ? "alert-danger" : "alert-success"
            }`}
            style={{
              marginTop: "18px",
              borderRadius: "10px",
              textAlign: "center",
              fontWeight: 500
            }}
          >
            {msg.text}
          </div>
        )}
      </div>
    </div>
  );
}
