import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, generateOtp } from "../api";

export default function Signup() {
  const navigate = useNavigate();

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
    passrd: ""
  });

  const [usernameSame, setUsernameSame] = useState(true);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function validate() {
    if (!form.client_name) return "Client name required";
    if (!form.email) return "Email required";
    if (!form.passrd) return "Password required";
    if (!usernameSame && !form.usrname) return "Username required";
    return null;
  }

  async function submit(e) {
    e.preventDefault();
    setMsg(null);

    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    setLoading(true);

    try {
      let payload = { ...form };

      if (usernameSame) {
    payload.usrname = payload.email;   // CORRECT
} else {
    // user typed custom username
    payload.usrname = form.usrname;
}

      // Convert empty strings to null
      Object.keys(payload).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });

      // Convert numeric fields to number
      payload.PrimaryContactNum = payload.PrimaryContactNum ? Number(payload.PrimaryContactNum) : null;
      payload.whatsappCountryCode = payload.whatsappCountryCode ? Number(payload.whatsappCountryCode) : 91;   // DEFAULT VALUE
      payload.paymount_amount = payload.paymount_amount ? Number(payload.paymount_amount) : null;
      payload.Whatsapp_Number = payload.Whatsapp_Number ? Number(payload.Whatsapp_Number) : null;
      payload.Aratai_Number = payload.Aratai_Number ? Number(payload.Aratai_Number) : null;
      payload.paid_or_not = payload.paid_or_not ? Number(payload.paid_or_not) : 0;

      console.log("Sending signup:", payload);

      const res = await signup(payload);
      console.log("Signup response:", res);

      // ---------- NEW UPDATED LOGIC ----------
  

// SP duplicate email
if (res.rid === -2) {
  setMsg({ type: "error", text: "Duplicate Email" });
  setLoading(false);
  return;
}

// SP error
if (!res.rid || res.rid < 0) {
  setMsg({ type: "error", text: "Signup failed (SP returned error)" });
  setLoading(false);
  return;
}

      // SUCCESS → rid = new inserted user ID
      const user_id = res.rid;
      console.log("Signup success USER ID:", user_id);

      // Generate OTP
      const otpRes = await generateOtp(user_id);
      console.log("Generate OTP response:", otpRes);

      // Redirect to OTP verification page
      navigate("/verify-otp", { state: { user_id, email: form.email } });

    } catch (err) {
      console.error("Signup error:", err);
      setMsg({ type: "error", text: "Server error" });
    }

    setLoading(false);
  }

  return (
    <div className="container">
      <h2>Sign Up</h2>

      <form className="card" onSubmit={submit}>

        <div className="row">
          <label>Client Name *</label>
          <input name="client_name" value={form.client_name} onChange={update} />
        </div>

        <div className="row">
          <label>Organization Name</label>
          <input name="client_organization_name" value={form.client_organization_name} onChange={update} />
        </div>

        <div className="row">
          <label>Primary Contact Number</label>
          <input type="number" name="PrimaryContactNum" value={form.PrimaryContactNum} onChange={update} />
        </div>

        <div className="row">
          <label>Country Code</label>
          <input name="country_code" value={form.country_code} onChange={update} />
        </div>

        <div className="row">
          <label>Email *</label>
          <input type="email" name="email" value={form.email} onChange={update} />
        </div>

        <div className="row">
          <label>Username same as Email?</label>
          <div>
            <label><input type="radio" checked={usernameSame} onChange={() => setUsernameSame(true)} /> Yes</label>
            <label style={{ marginLeft: "10px" }}>
              <input type="radio" checked={!usernameSame} onChange={() => setUsernameSame(false)} /> No
            </label>
          </div>
        </div>

        {!usernameSame && (
          <div className="row">
            <label>Username *</label>
            <input name="usrname" value={form.usrname} onChange={update} />
          </div>
        )}

        <div className="row">
          <label>Password *</label>
          <input name="passrd" type="password" value={form.passrd} onChange={update} />
        </div>

        <div className="row">
          <label>Website URL</label>
          <input name="web_url" value={form.web_url} onChange={update} />
        </div>

        <div className="row">
          <label>Instagram URL</label>
          <input name="insta_url" value={form.insta_url} onChange={update} />
        </div>

        <div className="row">
          <label>Whatsapp Country Code (Numbers only)</label>
          <input type="number" name="whatsappCountryCode" value={form.whatsappCountryCode} onChange={update} placeholder="91" />
        </div>

        <div className="row">
          <label>Address</label>
          <input name="address" value={form.address} onChange={update} />
        </div>

        <div className="row">
          <label>Postcode</label>
          <input name="postcode" value={form.postcode} onChange={update} />
        </div>

        <div className="row">
          <label>Facebook URL</label>
          <input name="facebook_url" value={form.facebook_url} onChange={update} />
        </div>

        <div className="row">
          <label>Paid or Not</label>
          <select name="paid_or_not" value={form.paid_or_not} onChange={update}>
            <option value="0">NO</option>
            <option value="1">YES</option>
          </select>
        </div>

        <div className="row">
          <label>Payment Date</label>
          <input type="datetime-local" name="payment_date" value={form.payment_date} onChange={update} />
        </div>

        <div className="row">
          <label>License Expiry</label>
          <input type="datetime-local" name="License_expiry_date" value={form.License_expiry_date} onChange={update} />
        </div>

        <div className="row">
          <label>Payment Amount</label>
          <input type="number" name="paymount_amount" value={form.paymount_amount} onChange={update} />
        </div>

        <div className="row">
          <label>Whatsapp Number</label>
          <input type="number" name="Whatsapp_Number" value={form.Whatsapp_Number} onChange={update} />
        </div>

        <div className="row">
          <label>Aratai Number</label>
          <input type="number" name="Aratai_Number" value={form.Aratai_Number} onChange={update} />
        </div>

        <div className="row">
          <label>Aratai Country Code</label>
          <input name="Aratai_Country_Code" value={form.Aratai_Country_Code} onChange={update} />
        </div>

        <button disabled={loading}>
          {loading ? "Submitting..." : "Sign Up"}
        </button>

        {msg && <div className={`message ${msg.type}`}>{msg.text}</div>}
      </form>
    </div>
  );
}
