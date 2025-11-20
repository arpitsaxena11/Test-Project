// backend/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,                      // e.g. smtp.gmail.com
  port: Number(process.env.SMTP_PORT || 587),      // 587 for TLS, 465 for SSL
  secure: process.env.SMTP_PORT === "465",         // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER,                   // your SMTP username / email
    pass: process.env.SMTP_PASS,                   // your SMTP password / app password
  },
});

/**
 * Send OTP email to user
 * @param {string} toEmail - recipient email
 * @param {string|number} otp - OTP code to send
 */
export async function sendOtpEmail(toEmail, otp) {
  if (!toEmail || !otp) {
    console.warn("sendOtpEmail called without toEmail or otp");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: toEmail,
      subject: "Your Signup OTP",
      text: `Your OTP is: ${otp}`,
      html: `<p>Your OTP is: <b>${otp}</b></p>`,
    });

    console.log("📧 OTP email sent:", info.messageId);
  } catch (err) {
    console.error("❌ Failed to send OTP email:", err.message);
  }
}
