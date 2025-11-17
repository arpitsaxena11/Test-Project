import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sql, config } from "./db.js";
import authRouter from "./routes/auth.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// SHOW DB CONNECTION ON STARTUP
async function connectDB() {
    console.log("⏳ Connecting to MS SQL...");

    try {
        await sql.connect(config);

        console.log("======================================");
        console.log("✅ DATABASE CONNECTED SUCCESSFULLY!");
        console.log("Server   :", process.env.SQL_SERVER);
        console.log("Database :", process.env.SQL_DATABASE);
        console.log("User     :", process.env.SQL_USER);
        console.log("======================================");
    } catch (err) {
        console.log("❌ DB CONNECTION FAILED!");
        console.error(err);
    }
}

connectDB();

app.use("/api/auth", authRouter);

app.listen(5000, () => {
    console.log("🚀 Server running on port 5000");
});
