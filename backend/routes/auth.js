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




/**
 * Signup – calls InsertClientMasterData
 */
router.post("/signup", async (req, res) => {
  const form = req.body;
  console.log("SIGNUP payload:", form);

  try {
    const pool = await getPool();
    const q = pool.request();

    q.input("client_name", sql.NVarChar(100), form.client_name ?? null)
      .input(
        "client_organization_name",
        sql.NVarChar(100),
        form.client_organization_name ?? null
      )
      .input(
        "PrimaryContactNum",
        sql.Int,
        form.PrimaryContactNum ? Number(form.PrimaryContactNum) : null
      )
      .input("country_code", sql.NVarChar(50), form.country_code ?? null)
      .input("email", sql.NVarChar(50), form.email ?? null)
      .input("web_url", sql.NVarChar(300), form.web_url ?? null)
      .input("insta_url", sql.NVarChar(300), form.insta_url ?? null)
      .input(
        "whatsappCountryCode",
        sql.Int,
        form.whatsappCountryCode ? Number(form.whatsappCountryCode) : null
      )
      .input("address", sql.NVarChar(100), form.address ?? null)
      .input("postcode", sql.NVarChar(20), form.postcode ?? null)
      .input("facebook_url", sql.NVarChar(300), form.facebook_url ?? null)
      .input(
        "paid_or_not",
        sql.Int,
        typeof form.paid_or_not === "number"
          ? form.paid_or_not
          : Number(form.paid_or_not || 0)
      )
      .input("payment_date", sql.DateTime, form.payment_date ?? null)
      .input(
        "License_expiry_date",
        sql.DateTime,
        form.License_expiry_date ?? null
      )
      .input(
        "paymount_amount",
        sql.Int,
        form.paymount_amount ? Number(form.paymount_amount) : null
      )
      .input(
        "Whatsapp_Number",
        sql.Int,
        form.Whatsapp_Number ? Number(form.Whatsapp_Number) : null
      )
      .input(
        "Aratai_Number",
        sql.Int,
        form.Aratai_Number ? Number(form.Aratai_Number) : null
      )
      .input(
        "Aratai_Country_Code",
        sql.NVarChar(50),
        form.Aratai_Country_Code ?? null
      )
      .input("usrname", sql.NVarChar(50), form.usrname ?? null)
      .input("passrd", sql.NVarChar(500), form.passrd ?? null)
      .input("gst_no", sql.NVarChar(50), form.gst_no ?? null)
      .input("Pan_no", sql.VarChar(50), form.Pan_no ?? null)
      .input(
        "state",
        sql.Int,
        form.state ? Number(form.state) : null
      );

    const result = await q.execute("InsertClientMasterData");
    console.log("InsertClientMasterData result:", result.recordset);

    const rid = result.recordset?.[0]?.rid ?? null;
    res.json({ rid, email: form.email });
  } catch (err) {
    console.error("Signup Error:", err);
    // If you see "too many arguments specified" here,
    // it means the SP in SQL Server does NOT yet have @gst_no, @Pan_no, @state.
    res.status(500).json({ rid: -1, error: "Server Error" });
  }
});


/**
 * Generate OTP – calls Generate_Insert and emails OTP
 */
router.post("/generate-otp", async (req, res) => {
  const { user_id, email } = req.body;
  console.log("generate-otp => Received", { user_id, email });

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    const pool = await getPool();

    // Call stored procedure to generate OTP
    await pool
      .request()
      .input("Userid", sql.BigInt, Number(user_id))
      .execute("Generate_Insert");

    // Fetch latest OTP from PasswordResets
    const otpResult = await pool
      .request()
      .input("Userid", sql.BigInt, Number(user_id))
      .query(
        `SELECT TOP 1 ResetToken
         FROM PasswordResets
         WHERE UserId = @Userid
         ORDER BY CreatedAt DESC`
      );

    const otp = otpResult.recordset?.[0]?.ResetToken;

    console.log("====================================");
    console.log("📩 OTP GENERATED");
    console.log("User ID :", user_id);
    console.log("OTP      :", otp);
    console.log("====================================");

    if (email && otp) {
      try {
        await sendOtpEmail(email, otp);
      } catch (mailErr) {
        console.error("Failed to send OTP email:", mailErr);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Generate OTP Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});



// POST /api/auth/login
// body: { loginId: string (email or username), password: string (SHA-256 hash) }
router.post("/login", async (req, res) => {
  const { loginId, password } = req.body; // password already encrypted on frontend

  if (!loginId || !password) {
    return res.status(400).json({ message: "loginId and password are required" });
  }

  try {
    const pool = await getPool();

    const result = await pool
      .request()
      .input("loginId", sql.NVarChar(100), loginId)
      .input("password", sql.NVarChar(500), password)
      .query(`
        SELECT TOP 1 id, user_name, email, mobile_no, is_active
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
      .input("Token", sql.NVarChar(200), String(otp))
      .execute("Verify_Auth");

    const row = result.recordset?.[0] || {};
    console.log("DB OTP Result:", row);

    const retcode = row.retcode ?? -99;
    const msg = row.msg ?? "Unknown error";
    res.json({ retcode, msg });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ retcode: -99, msg: "Server Error" });
  }
});

export default router;
