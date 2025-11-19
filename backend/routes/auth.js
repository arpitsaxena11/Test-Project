import express from "express";
import jwt from "jsonwebtoken";
import { sql } from "../db.js";
import { sha256Hex } from "../utils/hashPassword.js";
import { websiteExists } from "./../utils/websiteCheck.js";
import { config } from "dotenv";

const router = express.Router();

/* ============================================================
   GET STATES  (SP: get_state)
============================================================ */
router.get("/get-states", async (req, res) => {
  try {
    const pool = await sql.connect(config);

    const result = await pool.request().query(`
      SELECT 
        State AS id,
        State_Name_EN AS name
      FROM state_mst
      WHERE Status = 'A'
      ORDER BY State_Name_EN
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("State fetch error:", err);
    res.status(500).json([]);
  }
});


/* ============================================================
   VERIFY WEBSITE EXISTS
============================================================ */
router.post("/verify-website", async (req, res) => {
  const { url } = req.body;
  const exists = await websiteExists(url);
  return res.json({ exists });
});

/* ============================================================
   SIGNUP (SP: InsertClientMasterData)
============================================================ */
router.post("/signup", async (req, res) => {
  try {
    const d = req.body;
    console.log("SIGNUP payload:", d);

    const pool = await sql.connect();
    const reqSP = pool.request();

    reqSP.input("client_name", sql.NVarChar(100), d.client_name);
    reqSP.input("client_organization_name", sql.NVarChar(100), d.client_organization_name);
    reqSP.input("PrimaryContactNum", sql.Int, d.PrimaryContactNum);
    reqSP.input("country_code", sql.NVarChar(50), d.country_code);
    reqSP.input("email", sql.NVarChar(50), d.email);
    reqSP.input("web_url", sql.NVarChar(300), d.web_url);
    reqSP.input("insta_url", sql.NVarChar(300), d.insta_url);
    reqSP.input("whatsappCountryCode", sql.Int, d.whatsappCountryCode);
    reqSP.input("address", sql.NVarChar(100), d.address);
    reqSP.input("postcode", sql.NVarChar(20), d.postcode);
    reqSP.input("facebook_url", sql.NVarChar(300), d.facebook_url);
    reqSP.input("paid_or_not", sql.Int, d.paid_or_not);
    reqSP.input("payment_date", sql.DateTime, d.payment_date);
    reqSP.input("License_expiry_date", sql.DateTime, d.License_expiry_date);
    reqSP.input("paymount_amount", sql.Int, d.paymount_amount);
    reqSP.input("Whatsapp_Number", sql.Int, d.Whatsapp_Number);
    reqSP.input("Aratai_Number", sql.Int, d.Aratai_Number);
    reqSP.input("Aratai_Country_Code", sql.NVarChar(50), d.Aratai_Country_Code);
    reqSP.input("usrname", sql.NVarChar(50), d.usrname);
    reqSP.input("passrd", sql.NVarChar(500), d.passrd);

    // NEW FIELDS FROM YOUR DOCUMENT

    const result = await reqSP.execute("InsertClientMasterData");
    console.log("InsertClientMasterData result:", result.recordset);

    return res.json(result.recordset[0]); // { rid: ... }
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ rid: -1, error: err.message });
  }
});

/* ============================================================
   GENERATE OTP (SP: Generate_Insert)
============================================================ */
router.post("/generate-otp", async (req, res) => {
  try {
    const { user_id } = req.body;

    console.log("generate-otp => Received user_id:", user_id);

    const pool = await sql.connect();

    const result = await pool.request()
      .input("Userid", sql.BigInt, user_id)
      .execute("Generate_Insert");

    // The OTP is inside PasswordResets table — latest record for UserId
    const otp = result.recordset[0][""];  // Your SP returns column with no name

    console.log("====================================");
    console.log("📩 OTP GENERATED");
    console.log("User ID :", user_id);
    console.log("OTP      :", otp);
    console.log("====================================");

    return res.json({ otp });

  } catch (err) {
    console.error("Generate OTP Error:", err);
    return res.status(500).json({ error: "OTP generation failed" });
  }
});


/* ============================================================
   VERIFY OTP (SP: Verify_Auth)
============================================================ */
router.post("/verify-otp", async (req, res) => {
  try {
    const { user_id, otp } = req.body;

    console.log("Verifying OTP", { user_id, otp });

    if (!user_id || !otp) {
      return res.status(400).json({ error: "Missing user_id or otp" });
    }

    const pool = await sql.connect();

    const result = await pool
      .request()
      .input("Userid", sql.BigInt, Number(user_id)) // ✅ FIXED
      .input("Token", sql.NVarChar(400), String(otp)) // ✅ FIXED
      .execute("Verify_Auth");

    console.log("DB OTP Result:", result.recordset);

    const row = result.recordset[0];

    return res.json({
      retcode: row?.RETCODE,
      message: row?.Msg,
    });

  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});





/* ============================================================
   LOGIN (email OR username)
============================================================ */
router.post("/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const hashed = sha256Hex(password);

    const pool = await sql.connect();
    const result = await pool.request()
      .input("username", sql.NVarChar(100), usernameOrEmail)
      .input("email", sql.NVarChar(100), usernameOrEmail)
      .query(`
        SELECT TOP 1 *
        FROM user_master
        WHERE (username = @username OR email = @email)
          AND passrd = '${hashed}'
      `);

    if (result.recordset.length === 0)
      return res.json({ error: "Invalid credentials" });

    const user = result.recordset[0];

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================================================
   AUTH USER DETAILS (Dashboard)
============================================================ */
router.get("/me", async (req, res) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "No token" });

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const pool = await sql.connect();
    const result = await pool.request()
      .input("id", sql.BigInt, decoded.user_id)
      .query(`SELECT * FROM client_master_data WHERE id = @id`);

    res.json({ user: result.recordset[0] });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
