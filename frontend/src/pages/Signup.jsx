import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup, generateOtp, checkWebsite, getStates, getCountryCodes } from "../api";

// password hash helper (same as used earlier)
async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Signup() {
  const navigate = useNavigate();
  const [states, setStates] = useState([]);
  const [usernameSame, setUsernameSame] = useState(true);
  const [countries, setCountries] = useState([]);


  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    client_name: "",
    client_organization_name: "",
    PrimaryContactNum: "",
    country_code: "91",
    email: "",
    web_url: "",
    insta_url: "",
    whatsappCountryCode: "",
    address: "",
    postcode: "",
    facebook_url: "",
    paid_or_not: "1",
    payment_date: "",
    License_expiry_date: "",
    paymount_amount: "",
    Whatsapp_Number: "",
    Aratai_Number: "",
    Aratai_Country_Code: "91",
    usrname: "",
    passrd: "",
    gst_no: "",
    Pan_no: "",
    state: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [st, ct] = await Promise.all([
          getStates(),
          getCountryCodes(),
        ]);
        setStates(st || []);
        setCountries(ct || []);
      } catch (err) {
        console.error("Initial data load failed:", err);
      }
    })();
  }, []);





  function handleCountryChange(e) {
    const selectedName = e.target.value;
    const selected = countries.find(
      (c) => c.country_name === selectedName
    );

    if (!selected) {
      // reset if blank
      setForm((prev) => ({
        ...prev,
        country_code: "",
        whatsappCountryCode: "",
      }));
      return;
    }

    // Extracting numeric part from "+91", "+1-242", etc.
    const numericCode = (selected.country_code || "")
      .replace("+", "")
      .replace(/[^0-9]/g, "");

    setForm((prev) => ({
      ...prev,
      country_code: selected.country_name,        // <- inserting into @country_code
      whatsappCountryCode: numericCode,           // <- inserting into @whatsappCountryCode (INT)
    }));
  }




  function update(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    if (!form.client_name.trim()) return "Client Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.passrd.trim()) return "Password is required";
    if (!usernameSame && !form.usrname.trim()) return "Username is required";
    if (!form.state) return "Please select a State";
    if (!form.country_code) return "Please select a Country";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    const v = validate();
    if (v) {
      setMsg({ type: "error", text: v });
      return;
    }

    setLoading(true);

    try {
      // 1) Website exists check
      if (form.web_url) {
        const res = await checkWebsite(form.web_url);
        if (!res.exists) {
          setLoading(false);
          setMsg({
            type: "error",
            text: "Website does not exist / not reachable",
          });
          return;
        }
      }

      // 2) Build payload exactly as SP expects
      const payload = { ...form };

      // username logic
      payload.usrname = usernameSame ? payload.email : payload.usrname;

      // numeric fields
      payload.PrimaryContactNum = form.PrimaryContactNum
        ? Number(form.PrimaryContactNum)
        : null;
      payload.whatsappCountryCode = form.whatsappCountryCode
        ? Number(form.whatsappCountryCode)
        : null;
      payload.paymount_amount = form.paymount_amount
        ? Number(form.paymount_amount)
        : null;
      payload.Whatsapp_Number = form.Whatsapp_Number
        ? Number(form.Whatsapp_Number)
        : null;
      payload.Aratai_Number = form.Aratai_Number
        ? Number(form.Aratai_Number)
        : null;
      payload.state = form.state ? Number(form.state) : null;
      payload.paid_or_not = Number(form.paid_or_not);

      // encrypt password
      payload.passrd = await sha256(form.passrd);

      console.log("SIGNUP Sending:", payload);

      const res = await signup(payload);
      console.log("SIGNUP Response:", res);

      const rid = res?.rid;

      if (typeof rid !== "number") {
        setMsg({
          type: "error",
          text: "Unexpected response from server",
        });
        return;
      }

      // handle SP status codes
      if (rid === -4) {
        setMsg({
          type: "error",
          text: "Exception — Contact info@ovigroup.co.in",
        });
        return;
      }

      if (rid === -3) {
        setMsg({
          type: "error",
          text:
            "GST already exists in Merchant master. Contact info@ovigroup.co.in",
        });
        return;
      }

      if (rid === -2) {
        setMsg({
          type: "error",
          text: "This email is already registered. Redirecting to Sign In...",
        });
        setTimeout(() => {
          navigate("/login", { state: { email: payload.email } });
        }, 1000);
        return;
      }

      if (rid === -1 || rid <= 0) {
        setMsg({ type: "error", text: "Signup Error. Please try again." });
        return;
      }

      // SUCCESS
      const user_id = rid;

      // generate OTP & send email
      await generateOtp(user_id, form.email);

      setMsg({
        type: "success",
        text: "Signup successful! OTP sent to your email.",
      });

      setTimeout(() => {
        navigate("/verify-otp", {
          state: { email: form.email, user_id },
        });
      }, 600);
    } catch (err) {
      console.error("Signup error:", err);
      setMsg({ type: "error", text: "Server Error during signup" });
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
            <input
              name="client_name"
              value={form.client_name}
              onChange={update}
            />
          </label>

          <label>
            Organization Name
            <input
              name="client_organization_name"
              value={form.client_organization_name}
              onChange={update}
            />
          </label>

          <label>
            Primary Contact Number
            <input
              name="PrimaryContactNum"
              value={form.PrimaryContactNum}
              onChange={update}
            />
          </label>

          <label>
            Country *
            <select
              name="country_code"
              value={form.country_code}
              onChange={handleCountryChange}
            >
              <option value="">-- Select Country --</option>
              {countries.map((c) => (
                <option key={c.country_name} value={c.country_name}>
                  {c.country_name} ({c.country_code})
                </option>
              ))}
            </select>
          </label>


          <label>
            Email *
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={update}
            />
          </label>

          <label>
            Web URL
            <input
              name="web_url"
              value={form.web_url}
              onChange={update}
            />
          </label>

          <label>
            Instagram URL
            <input
              name="insta_url"
              value={form.insta_url}
              onChange={update}
            />
          </label>


          <label>
            WhatsApp Country Code
            <input
              name="whatsappCountryCode"
              value={form.whatsappCountryCode}
              readOnly
            />
          </label>


          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={update}
            />
          </label>

          <label>
            Postcode
            <input
              name="postcode"
              value={form.postcode}
              onChange={update}
            />
          </label>

          <label>
            Facebook URL
            <input
              name="facebook_url"
              value={form.facebook_url}
              onChange={update}
            />
          </label>

          <label>
            Paid or Not
            <select
              name="paid_or_not"
              value={form.paid_or_not}
              onChange={update}
            >
              <option value="0">Free</option>
              <option value="1">Paid</option>
            </select>
          </label>

          <label>
            Payment Date
            <input
              type="datetime-local"
              name="payment_date"
              value={form.payment_date}
              onChange={update}
            />
          </label>

          <label>
            License Expiry Date
            <input
              type="datetime-local"
              name="License_expiry_date"
              value={form.License_expiry_date}
              onChange={update}
            />
          </label>

          <label>
            Payment Amount
            <input
              name="paymount_amount"
              value={form.paymount_amount}
              onChange={update}
            />
          </label>

          <label>
            WhatsApp Number
            <input
              name="Whatsapp_Number"
              value={form.Whatsapp_Number}
              onChange={update}
            />
          </label>

          <label>
            Aratai Number
            <input
              name="Aratai_Number"
              value={form.Aratai_Number}
              onChange={update}
            />
          </label>

          <label>
            Aratai Country Code
            <input
              name="Aratai_Country_Code"
              value={form.Aratai_Country_Code}
              onChange={update}
            />
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

          <div className="full-width">
            <div className="radio-row">
              <span>Username same as Email?</span>
              <label>
                <input
                  type="radio"
                  checked={usernameSame}
                  onChange={() => setUsernameSame(true)}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  checked={!usernameSame}
                  onChange={() => setUsernameSame(false)}
                />
                No
              </label>
            </div>
          </div>

          {!usernameSame && (
            <label className="full-width">
              Username
              <input
                name="usrname"
                value={form.usrname}
                onChange={update}
              />
            </label>
          )}

          <label className="full-width">
            Password *
            <input
              type="password"
              name="passrd"
              value={form.passrd}
              onChange={update}
            />
          </label>

          <button
            className="btn primary full-width"
            type="submit"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
