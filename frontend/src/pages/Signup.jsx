import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { signup, generateOtp } from "../api";

export default function Signup() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [usernameSame, setUsernameSame] = useState(true);

  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    client_name: "",
    client_organization_name: "",
    PrimaryContactNum: "",
    country_code: "",
    email: "",
    web_url: "",
    insta_url: "",
    whatsappCountryCode: "",
    address: "",
    postcode: "",
    facebook_url: "",
    paid_or_not: "0",
    payment_date: "",
    License_expiry_date: "",
    paymount_amount: "",
    Whatsapp_Number: "",
    Aratai_Number: "",
    Aratai_Country_Code: "",
    usrname: "",
    passrd: "",
    gst_no: "",
    Pan_no: "",
    state: ""
  });

  useEffect(() => {
    loadStates();
  }, []);

  async function loadStates() {
    try {
      const r = await api.get("/api/auth/get-states");
      setStates(r.data || []);
    } catch (err) {
      console.error("State load failed:", err);
    }
  }

  function update(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!form.client_name) return "Client Name is required";
    if (!form.email) return "Email is required";
    if (!form.passrd) return "Password is required";
    if (!usernameSame && !form.usrname) return "Username is required";
    if (!form.state) return "Please select a State";
    return null;
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function websiteExists(url) {
    if (!url) return true;
    try {
      const r = await api.post("/api/auth/verify-website", { url });
      return r.data?.exists === true;
    } catch {
      return false;
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    const v = validate();
    if (v) return setMsg({ type: "error", text: v });

    setLoading(true);

    try {
      // Validate website
      if (form.web_url) {
        const ok = await websiteExists(form.web_url);
        if (!ok) {
          setLoading(false);
          return setMsg({
            type: "error",
            text: "Website does not exist"
          });
        }
      }

      const payload = { ...form };

      // Username rule
      payload.usrname = usernameSame ? payload.email : payload.usrname;

      // Convert empty strings to null
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });

      // Numeric conversions
      payload.PrimaryContactNum = payload.PrimaryContactNum ? Number(payload.PrimaryContactNum) : null;
      payload.whatsappCountryCode = payload.whatsappCountryCode ? Number(payload.whatsappCountryCode) : 91;
      payload.paymount_amount = payload.paymount_amount ? Number(payload.paymount_amount) : null;
      payload.Whatsapp_Number = payload.Whatsapp_Number ? Number(payload.Whatsapp_Number) : null;
      payload.Aratai_Number = payload.Aratai_Number ? Number(payload.Aratai_Number) : null;
      payload.state = payload.state ? Number(payload.state) : null;
      payload.paid_or_not = Number(payload.paid_or_not);

      // Encrypt password
      payload.passrd = await sha256(payload.passrd);

      console.log("SIGNUP Sending:", payload);

      const res = await signup(payload);
      console.log("SIGNUP Response:", res);

      // ------- SP STATUS CODE HANDLING (DOCUMENT EXACT) -------
      if (res.rid === -4) {
        return setMsg({
          type: "error",
          text: "Exception occurred — Contact info@ovigroup.co.in"
        });
      }

      if (res.rid === -3) {
        return setMsg({
          type: "error",
          text: "GST already exists — Contact info@ovigroup.co.in"
        });
      }

      if (res.rid === -2) {
        setMsg({
          type: "error",
          text: "Duplicate Email — Redirecting to Login..."
        });
        setTimeout(() => navigate("/login"), 800);
        return;
      }

      if (res.rid === -1) {
        return setMsg({
          type: "error",
          text: "Signup Error"
        });
      }

      if (!res.rid || res.rid <= 0) {
        return setMsg({
          type: "error",
          text: "Unexpected SP Response"
        });
      }

      // SUCCESS
      const user_id = res.rid;

      await generateOtp(user_id);

      navigate("/verify-otp", {
        state: { user_id, email: payload.email }
      });

    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Server Error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>Create Account</h2>

      <form onSubmit={submit}>

        {/* CLIENT NAME */}
        <div className="row">
          <label>Client Name *</label>
          <input name="client_name" value={form.client_name} onChange={update} />
        </div>

        {/* ORGANIZATION NAME */}
        <div className="row">
          <label>Organization Name</label>
          <input name="client_organization_name" value={form.client_organization_name} onChange={update} />
        </div>

        {/* PRIMARY CONTACT NUMBER */}
        <div className="row">
          <label>Primary Contact Number</label>
          <input type="number" name="PrimaryContactNum" value={form.PrimaryContactNum} onChange={update} />
        </div>

        {/* COUNTRY CODE */}
        <div className="row">
          <label>Country Code</label>
          <input name="country_code" value={form.country_code} onChange={update} />
        </div>

        {/* EMAIL */}
        <div className="row">
          <label>Email *</label>
          <input type="email" name="email" value={form.email} onChange={update} />
        </div>

        {/* USERNAME SAME AS EMAIL */}
        <div className="row">
          <label>Username same as Email?</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <label>
              <input type="radio" checked={usernameSame} onChange={() => setUsernameSame(true)} /> Yes
            </label>
            <label>
              <input type="radio" checked={!usernameSame} onChange={() => setUsernameSame(false)} /> No
            </label>
          </div>
        </div>

        {/* USERNAME TEXTBOX */}
        {!usernameSame && (
          <div className="row">
            <label>Username</label>
            <input name="usrname" value={form.usrname} onChange={update} />
          </div>
        )}

        {/* PASSWORD */}
        <div className="row">
          <label>Password *</label>
          <input type="password" name="passrd" value={form.passrd} onChange={update} />
        </div>

        {/* WEBSITE */}
        <div className="row">
          <label>Website URL</label>
          <input name="web_url" value={form.web_url} onChange={update} placeholder="https://example.com" />
        </div>

        {/* INSTAGRAM */}
        <div className="row">
          <label>Instagram URL</label>
          <input name="insta_url" value={form.insta_url} onChange={update} />
        </div>

        {/* WHATSAPP COUNTRY CODE */}
        <div className="row">
          <label>Whatsapp Country Code</label>
          <input type="number" name="whatsappCountryCode" value={form.whatsappCountryCode} onChange={update} />
        </div>

        {/* ADDRESS */}
        <div className="row">
          <label>Address</label>
          <input name="address" value={form.address} onChange={update} />
        </div>

        {/* POSTCODE */}
        <div className="row">
          <label>Postcode</label>
          <input name="postcode" value={form.postcode} onChange={update} />
        </div>

        {/* FACEBOOK */}
        <div className="row">
          <label>Facebook URL</label>
          <input name="facebook_url" value={form.facebook_url} onChange={update} />
        </div>

        {/* STATE DROPDOWN */}
        <div className="row">
          <label>State *</label>
          <select name="state" value={form.state} onChange={update}>
            <option value="">-- Select State --</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* GST */}
        <div className="row">
          <label>GST No.</label>
          <input name="gst_no" value={form.gst_no} onChange={update} />
        </div>

        {/* PAN */}
        <div className="row">
          <label>PAN No.</label>
          <input name="Pan_no" value={form.Pan_no} onChange={update} />
        </div>

        {/* PAID */}
        <div className="row">
          <label>Paid or Not</label>
          <select name="paid_or_not" value={form.paid_or_not} onChange={update}>
            <option value="0">Not Paid</option>
            <option value="1">Paid</option>
          </select>
        </div>

        {/* PAYMENT DATE */}
        <div className="row">
          <label>Payment Date</label>
          <input type="datetime-local" name="payment_date" value={form.payment_date} onChange={update} />
        </div>

        {/* LICENSE EXPIRY */}
        <div className="row">
          <label>License Expiry Date</label>
          <input type="datetime-local" name="License_expiry_date" value={form.License_expiry_date} onChange={update} />
        </div>

        {/* PAYMENT AMOUNT */}
        <div className="row">
          <label>Payment Amount</label>
          <input type="number" name="paymount_amount" value={form.paymount_amount} onChange={update} />
        </div>

        {/* WHATSAPP NUMBER */}
        <div className="row">
          <label>Whatsapp Number</label>
          <input type="number" name="Whatsapp_Number" value={form.Whatsapp_Number} onChange={update} />
        </div>

        {/* ARATAI NUMBER */}
        <div className="row">
          <label>Aratai Number</label>
          <input type="number" name="Aratai_Number" value={form.Aratai_Number} onChange={update} />
        </div>

        {/* ARATAI COUNTRY */}
        <div className="row">
          <label>Aratai Country Code</label>
          <input name="Aratai_Country_Code" value={form.Aratai_Country_Code} onChange={update} />
        </div>

        {/* SUBMIT BUTTON */}
        <button disabled={loading}>
          {loading ? "Submitting..." : "Sign Up"}
        </button>

        {msg && (
          <div className={`message ${msg.type}`}>
            {msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
