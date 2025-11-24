// backend/routes/auth.js
import express from "express";
import { getPool, sql } from "../dbConfig.js";
import { sendOtpEmail } from "../mailer.js";
import jwt from "jsonwebtoken";

const router = express.Router();

/**
 * Verify website exists (HEAD request)
 */
router.post("/verify-website", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.json({ exists: false });

  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const resp = await fetch(normalized, { method: "HEAD" });
    res.json({ exists: resp.ok });
  } catch (err) {
    console.error("Website verify error:", err.message);
    res.json({ exists: false });
  }
});

/**
 * Get states from state_mst table
 */
// GET /api/auth/get-states
router.get("/get-states", async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .query(
        "SELECT State AS id, State_Name_EN AS name FROM state_mst WHERE Status = 'A'"
      );

    console.log("States from state_mst:", result.recordset);
    res.json(result.recordset || []);
  } catch (err) {
    console.error("State fetch error:", err);
    res.status(500).json([]);
  }
});

// GET /api/auth/get-country-codes
router.get("/get-country-codes", async (req, res) => {
  try {
    const pool = await getPool();

    // call SP get_Country_Code
    const result = await pool.request().execute("get_Country_Code");

    // Expecting columns: country_name, country_code
    console.log("Country codes:", result.recordset);
    res.json(result.recordset || []);
  } catch (err) {
    console.error("Country code fetch error:", err);
    res.status(500).json([]);
  }
});



// SignUp 

router.post("/signup", async (req, res) => {
  const form = req.body;
  console.log("SIGNUP PAYLOAD:", form);

  try {
    const pool = await getPool();
    const q = pool.request();

    // ------------ INPUT PARAMETERS -------------
    q.input("client_name", sql.NVarChar(100), form.client_name)
      .input("client_organization_name", sql.NVarChar(100), form.client_organization_name)
      .input("PrimaryContactNum", sql.BigInt, form.PrimaryContactNum)
      .input("country_code", sql.NVarChar(50), form.country_code)        // <-- FIX: send country_name
      .input("email", sql.NVarChar(50), form.email)
      .input("web_url", sql.NVarChar(300), form.web_url)
      .input("insta_url", sql.NVarChar(300), form.insta_url)
      .input("whatsappCountryCode", sql.NVarChar(50), form.whatsappCountryCode) // <-- FIX
      .input("address", sql.NVarChar(100), form.address)
      .input("postcode", sql.NVarChar(20), form.postcode)
      .input("facebook_url", sql.NVarChar(300), form.facebook_url)
      .input("paid_or_not", sql.Int, form.paid_or_not)
      .input("payment_date", sql.DateTime, form.payment_date) // must be 'YYYY-MM-DD HH:mm'
      .input("License_expiry_date", sql.DateTime, form.License_expiry_date)
      .input("payment_amount", sql.Int, form.paymount_amount)
      .input("Whatsapp_Number", sql.BigInt, form.Whatsapp_Number)
      .input("Aratai_Number", sql.BigInt, form.Aratai_Number)
      .input("Aratai_Country_Code", sql.NVarChar(50), form.Aratai_Country_code) // <-- FIX
      .input("usrname", sql.NVarChar(50), form.usrname)
      .input("passrd", sql.NVarChar(500), form.passrd)
      .input("gst_no", sql.NVarChar(50), form.gst_no)
      .input("Pan_no", sql.NVarChar(50), form.Pan_no)
      .input("state", sql.Int, form.state);

    // ------------ OUTPUT PARAMETERS -------------
    q.output("ResultCode", sql.Int);
    q.output("ResultMessage", sql.NVarChar(4000));
    q.output("NewUserId", sql.Int);

    // ------------ EXECUTE PROCEDURE -------------
    const result = await q.execute("InsertClientMasterData");

    const resultCode = result.output.ResultCode;
    const resultMessage = result.output.ResultMessage;
    const newUserId = result.output.NewUserId;

    console.log("SP OUTPUT =>", {
      resultCode,
      resultMessage,
      newUserId
    });

    // --------- DECISION BASED ON SP RESULT ---------
    if (resultCode !== 0) {
      return res.json({
        success: false,
        message: resultMessage,
        resultCode,
        newUserId: null
      });
    }

    // SUCCESS → Return userId to frontend so it can trigger OTP
    return res.json({
      success: true,
      message: resultMessage,
      resultCode,
      newUserId
    });

  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});


// Generate-otp

router.post("/generate-otp", async (req, res) => {
  const { user_id, email } = req.body;
  console.log("generate-otp => Received", { user_id, email });

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const pool = await getPool();

    const spResult = await pool
      .request()
      .input("Userid", sql.BigInt, Number(user_id))
      .execute("Generate_Insert");

    console.log("SP RESULT:", spResult.recordset);

    let otp = null;

    if (spResult.recordset?.length > 0) {
      otp = spResult.recordset[0].OTP;   // <-- EXACT FIX
    }

    console.log("📩 OTP GENERATED");
    console.log("User ID :", user_id);
    console.log("OTP      :", otp);

    if (email && otp) {
      await sendOtpEmail(email, String(otp));
      console.log("OTP sent to email:", email);
    } else {
      console.warn("⚠ No OTP found (SP returned empty)");
    }

    res.json({ success: true, otp });
  } catch (err) {
    console.error("Generate OTP Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});






// POST /api/auth/login
// body: { loginId: string (email or username), password: string (SHA-256 hash) }
router.post("/login", async (req, res) => {
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.status(400).json({ message: "loginId and password are required" });
  }

  try {
    const pool = await getPool();

    // ⚠️ VERY IMPORTANT: use correct password column name
    const result = await pool
      .request()
      .input("loginId", sql.NVarChar(100), loginId)
      .input("password", sql.NVarChar(500), password)
      .query(`
        SELECT TOP 1 
          id, 
          user_name, 
          email, 
          mobile_no, 
          is_active
        FROM user_master
        WHERE (email = @loginId OR user_name = @loginId)
          AND password = @password     
      `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.status(401).json({ message: "Invalid email/username or password" });
    }

    const user = result.recordset[0];

    if (user.is_active === 0) {
      return res.status(403).json({ message: "User is inactive. Contact support." });
    }

    const secret = process.env.JWT_SECRET || "dev-secret";
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        user_name: user.user_name,
        email: user.email,
        mobile_no: user.mobile_no,
      },
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});






/**
 * Verify OTP – calls Verify_Auth
 */
router.post("/verify-otp", async (req, res) => {
  const { user_id, otp } = req.body;
  console.log("Verifying OTP", { user_id, otp });

  if (!user_id || !otp) {
    return res
      .status(400)
      .json({ retcode: 0, msg: "Missing user_id or otp" });
  }

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("Userid", sql.BigInt, Number(user_id))
      .input("Token", sql.NVarChar(200), String(otp).trim())
      .output("RETCODE", sql.Int)
      .output("Msg", sql.NVarChar(4000))
      .execute("Verify_Auth");

    console.log("Verify_Auth raw result:", result);

    // 1. Read output params FIRST (most reliable)
    let retcode = result.output?.RETCODE;
    let msg = result.output?.Msg;

    // 2. If SP returned a recordset, use it only if not null
    if (result.recordset?.length > 0) {
      const row = result.recordset[0];
      retcode = row.retcode ?? retcode;
      msg = row.msg ?? msg;
    }

    // 3. If still missing, set defaults
    retcode = retcode ?? -99;
    msg = msg ?? "Unknown error";

    console.log("Parsed OTP result:", { retcode, msg });

    return res.json({ retcode, msg });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return res.status(500).json({ retcode: -99, msg: "Server Error" });
  }
});


export default router;
