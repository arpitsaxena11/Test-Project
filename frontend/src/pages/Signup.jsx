import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, generateOtp, checkWebsite, getCountryCodes, getStates } from "../api";

// SHA256 encryption
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Signup() {
  const navigate = useNavigate();

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const [usernameSame, setUsernameSame] = useState(true);

  const [form, setForm] = useState({
    client_name: "",
    client_organization_name: "",
    PrimaryContactNum: "",
    country_code: "",              // country name
    email: "",
    web_url: "",
    insta_url: "",
    whatsappCountryCode: "",       // country code
    address: "",
    postcode: "",
    facebook_url: "",
    paid_or_not: "1",
    payment_date: "",
    License_expiry_date: "",
    paymount_amount: "",
    Whatsapp_Number: "",
    Aratai_Number: "",
    Aratai_Country_Code: "",       // country name
    usrname: "",
    passrd: "",
    gst_no: "",
    Pan_no: "",
    state: "",
  });

  // Load countries from DB
  useEffect(() => {
    (async () => {
      try {
        const [countries, states] = await Promise.all([
          getCountryCodes(),
          getStates()
        ]);

        setCountries(countries);
        setStates(states);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    })();
  }, []);


  // Update form
  function update(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Format datetime-local to SQL format
  function formatDate(dt) {
    if (!dt) return null;
    return dt.replace("T", " ").slice(0, 16); // YYYY-MM-DD HH:mm
  }

  // Validate fields
  function validate() {
    if (!form.client_name.trim()) return "Client Name required";
    if (!form.email.trim()) return "Email required";
    if (!form.passrd.trim()) return "Password required";
    if (!usernameSame && !form.usrname.trim()) return "Username required";
    if (!form.country_code) return "Country required";
    if (!form.state) return "State required";
    return null;
  }

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    const v = validate();
    if (v) return setMsg({ type: "error", text: v });

    setLoading(true);

    try {
      // 1. Check Website validity
      if (form.web_url) {
        const chk = await checkWebsite(form.web_url);
        if (!chk.exists) {
          setMsg({
            type: "error",
            text: "Website URL does not exist."
          });
          setLoading(false);
          return;
        }
      }

      // 2. Build payload
      const payload = {
        ...form,
        usrname: usernameSame ? form.email : form.usrname,

        PrimaryContactNum: Number(form.PrimaryContactNum) || null,
        paymount_amount: Number(form.paymount_amount) || null,
        Whatsapp_Number: Number(form.Whatsapp_Number) || null,
        Aratai_Number: Number(form.Aratai_Number) || null,

        payment_date: formatDate(form.payment_date),
        License_expiry_date: formatDate(form.License_expiry_date),

        paid_or_not: Number(form.paid_or_not),
        state: Number(form.state),

        passrd: await sha256(form.passrd),

        country_code: form.country_code,            // country NAME
        Aratai_Country_Code: form.Aratai_Country_Code // country NAME
      };

      console.log("SIGNUP PAYLOAD:", payload);

      // 3. Call API
      const res = await signup(payload);
      console.log("SP OUTPUT =>", res);

      const { resultCode, newUserId, resultMessage } = res;

      // -----------------------------
      //  HANDLE STORED PROC RESPONSES
      // -----------------------------

      // ❌ Duplicate GST
      if (resultCode === -2) {
        setMsg({
          type: "error",
          text: "Duplicate GST number. Please check and try again."
        });
        return;
      }

      // ❌ Duplicate Email → Redirect to Login
      if (resultCode === -3) {
        setMsg({
          type: "error",
          text: "This email is already registered. Redirecting to Sign In..."
        });

        setTimeout(() => {
          navigate("/login", { state: { email: payload.email } });
        }, 1200);

        return;
      }

      // ❌ Any other failure
      if (resultCode !== 0 || !newUserId) {
        setMsg({
          type: "error",
          text: resultMessage || "Signup failed."
        });
        return;
      }

      // -----------------------------
      //  SUCCESS: CREATE USER + OTP
      // -----------------------------
      await generateOtp(newUserId, form.email);

      setMsg({
        type: "success",
        text: "Signup successful! OTP sent to your email."
      });

      setTimeout(() => {
        navigate("/verify-otp", {
          state: {
            user_id: newUserId,
            email: form.email
          },
        });
      }, 800);

    } catch (err) {
      console.error("Signup error:", err);
      setMsg({ type: "error", text: "Server Error" });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="page">
      <div className="card">
        <h1 className="title">Client Sign Up</h1>

        {msg && (
          <div
            className={
              msg.type === "error" ? "alert alert-error" : "alert alert-ok"
            }
          >
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">

          <label>
            Client Name *
            <input name="client_name" value={form.client_name} onChange={update} />
          </label>

          <label>
            Organization Name
            <input name="client_organization_name" value={form.client_organization_name} onChange={update} />
          </label>

          <label>
            Primary Contact Number
            <input name="PrimaryContactNum" value={form.PrimaryContactNum} onChange={update} />
          </label>

          {/* COUNTRY DROPDOWN */}
          <label>
            Country *
            <select name="country_code" value={form.country_code} onChange={update}>
              <option value="">-- Select Country --</option>
              {countries.map((c) => (
                <option key={c.country_code} value={c.country_name}>
                  {c.country_name} ({c.country_code})
                </option>
              ))}
            </select>
          </label>

          <label>
            Email *
            <input type="email" name="email" value={form.email} onChange={update} />
          </label>

          <label>
            Web URL
            <input name="web_url" value={form.web_url} onChange={update} />
          </label>

          <label>
            Instagram URL
            <input name="insta_url" value={form.insta_url} onChange={update} />
          </label>

          <label>
            WhatsApp Country Code
            <input
              name="whatsappCountryCode"
              value={form.whatsappCountryCode}
              placeholder="91"
              onChange={update}
            />
          </label>

          <label>
            Address
            <input name="address" value={form.address} onChange={update} />
          </label>

          <label>
            Postcode
            <input name="postcode" value={form.postcode} onChange={update} />
          </label>

          <label>
            Facebook URL
            <input name="facebook_url" value={form.facebook_url} onChange={update} />
          </label>

          <label>
            Paid or Not
            <select name="paid_or_not" value={form.paid_or_not} onChange={update}>
              <option value="0">Not Paid</option>
              <option value="1">Paid</option>
            </select>
          </label>

          <label>
            Payment Date
            <input type="datetime-local" name="payment_date" value={form.payment_date} onChange={update} />
          </label>

          <label>
            License Expiry Date
            <input type="datetime-local" name="License_expiry_date" value={form.License_expiry_date} onChange={update} />
          </label>

          <label>
            Payment Amount
            <input name="paymount_amount" value={form.paymount_amount} onChange={update} />
          </label>

          <label>
            WhatsApp Number
            <input name="Whatsapp_Number" value={form.Whatsapp_Number} onChange={update} />
          </label>

          <label>
            Aratai Number
            <input name="Aratai_Number" value={form.Aratai_Number} onChange={update} />
          </label>

          <label>
            Aratai Country Code
            <select
              name="Aratai_Country_Code"
              value={form.Aratai_Country_Code}
              onChange={update}
            >
              <option value="">-- Select Country --</option>
              {countries.map((c) => (
                <option key={c.country_code} value={c.country_name}>
                  {c.country_name} ({c.country_code})
                </option>
              ))}
            </select>
          </label>

          <label>
            GST No
            <input name="gst_no" value={form.gst_no} onChange={update} />
          </label>

          <label>
            PAN No
            <input name="Pan_no" value={form.Pan_no} onChange={update} />
          </label>

          <label>
            State *
            <select name="state" value={form.state} onChange={update}>
              <option value="">-- Select State --</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          {/* Username Radio */}
          <div className="full-width">
            <div className="radio-row">
              <span>Username same as Email?</span>
              <label>
                <input type="radio" checked={usernameSame} onChange={() => setUsernameSame(true)} />
                Yes
              </label>
              <label>
                <input type="radio" checked={!usernameSame} onChange={() => setUsernameSame(false)} />
                No
              </label>
            </div>
          </div>

          {!usernameSame && (
            <label className="full-width">
              Username
              <input name="usrname" value={form.usrname} onChange={update} />
            </label>
          )}

          {/* Password */}
          <label className="full-width">
            Password *
            <input type="password" name="passrd" value={form.passrd} onChange={update} />
          </label>

          <button className="btn primary full-width" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
