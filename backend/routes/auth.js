import express from "express";
import { sql, config } from "../db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // if you plan to hash on server; otherwise send hashed

const router = express.Router();

/**
 * =========================================================
 * SIGNUP → InsertClientMasterData Stored Procedure
 * =========================================================
 */

router.post("/signup", async (req, res) => {
  try {
    const d = req.body;

    console.log("SIGNUP payload:", d);

    // Always declare pool FIRST
    const pool = await sql.connect(config);
    const request = pool.request();

    // Bind exact SP params
    request.input("client_name", sql.NVarChar(100), d.client_name);
request.input("client_organization_name", sql.NVarChar(100), d.client_organization_name);
request.input("PrimaryContactNum", sql.Int, Number(d.PrimaryContactNum) || null);
request.input("country_code", sql.NVarChar(50), d.country_code);
request.input("email", sql.NVarChar(50), d.email);
request.input("web_url", sql.NVarChar(300), d.web_url);
request.input("insta_url", sql.NVarChar(300), d.insta_url);
request.input("whatsappCountryCode", sql.Int, Number(d.whatsappCountryCode) || null);
request.input("address", sql.NVarChar(100), d.address);
request.input("postcode", sql.NVarChar(20), d.postcode);
request.input("facebook_url", sql.NVarChar(300), d.facebook_url);
request.input("paid_or_not", sql.Int, Number(d.paid_or_not) || 0);
request.input("payment_date", sql.DateTime, d.payment_date || null);
request.input("License_expiry_date", sql.DateTime, d.License_expiry_date || null);
request.input("paymount_amount", sql.Int, Number(d.paymount_amount) || null);
request.input("Whatsapp_Number", sql.Int, Number(d.Whatsapp_Number) || null);
request.input("Aratai_Number", sql.Int, Number(d.Aratai_Number) || null);
request.input("Aratai_Country_Code", sql.NVarChar(50), d.Aratai_Country_Code);
request.input("usrname", sql.NVarChar(50), d.usrname);
request.input("passrd", sql.NVarChar(500), d.passrd);

    // Execute the stored procedure
    const result = await request.execute("InsertClientMasterData");

    console.log("InsertClientMasterData result:", result.recordset);

    const status = result.recordset?.[0]?.Status;

    // ERROR CASES from your document
    if (status === -1) return res.json({ status: -1, message: "Error occurred" });
    if (status === -2) return res.json({ status: -2, message: "Duplicate Email" });
    if (status === -3) return res.json({ status: -3, message: "GST exists" });
    if (status === -4) return res.json({ status: -4, message: "Unexpected exception" });

    // SUCCESS → status contains new user ID
    if (status > 0) {
      return res.json({
        status: 1,
        user_id: status
      });
    }

    return res.json({ status: -99, message: "Unknown response", raw: status });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ status: -1, message: "Signup server error" });
  }
});


/**
 * =========================================================
 * GENERATE OTP → Generate_Insert Stored Procedure
 * =========================================================
 */
router.post("/generate-otp", async (req, res) => {
    try {
        const { user_id } = req.body;
        console.log("generate-otp => Received user_id:", user_id);

        if (!user_id) {
            return res.status(400).json({ error: "user_id missing" });
        }

        const pool = await sql.connect(config);
        const request = pool.request();

        request.input("UserId", sql.BigInt, user_id);

        const result = await request.execute("Generate_Insert");

        console.log("OTP RESULT:", result.recordset);

        const otp = result.recordset[0]?.OTP;

        res.json({ status: "OTP_SENT", otp });

    } catch (err) {
        console.error("Generate OTP Error:", err);
        res.status(500).json({ error: "OTP generation failed" });
    }
});

/**
 * =========================================================
 * VERIFY OTP → Verify_Auth Stored Procedure
 * =========================================================
 */
router.post("/verify-otp", async (req, res) => {
    try {
        const { user_id, otp } = req.body;

        const pool = await sql.connect(config);
        const request = pool.request();

        request.input("UserId", sql.BigInt, user_id);
        request.input("Token", sql.NVarChar, otp);

        const result = await request.execute("Verify_Auth");

        const RETCODE = result.recordset[0]?.RETCODE;

        res.json({ RETCODE });

    } catch (err) {
        console.error("Verify OTP Error:", err);
        res.status(500).json({ error: "OTP verification failed" });
    }
});

/**
 * =========================================================
 * LOGIN → user_master table
 * =========================================================
 */
router.post("/login", async (req, res) => {
    try {
        const { usernameOrEmail, password } = req.body;

        const pool = await sql.connect(config);
        const request = pool.request();

        request.input("ue", sql.NVarChar, usernameOrEmail);
        request.input("ps", sql.NVarChar, password);

        const result = await request.query(`
            SELECT * FROM user_master
            WHERE (usrname = @ue OR email = @ue)
            AND passrd = @ps
        `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const user = result.recordset[0];

        const token = jwt.sign(
            { user_id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            status: "LOGIN_SUCCESS",
            token,
            user,
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: "Login failed" });
    }
});

router.get("/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "No token" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const pool = await sql.connect(config);
        const request = pool.request();
        request.input("uid", sql.Int, decoded.user_id);

        const user = await request.query(`
            SELECT id AS user_id, email, client_name
            FROM client_master_data
            WHERE id = @uid
        `);

        res.json({ user: user.recordset[0] });

    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
});




export default router;
