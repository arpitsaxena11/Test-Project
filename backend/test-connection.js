import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testConnection() {
    console.log("⏳ Attempting to connect to MS SQL...");

    try {
        const pool = await sql.connect(config);

        console.log("✅ Connected Successfully!");
        console.log("-----------------------------------------");
        console.log("Connected DB:", process.env.SQL_DATABASE);
        console.log("SQL Server:", process.env.SQL_SERVER);
        console.log("-----------------------------------------");

        const result = await pool.request().query("SELECT TOP 1 * FROM client_master_data");
        console.log("🎉 Query Success:", result.recordset);
    } catch (err) {
        console.log("❌ Connection Failed!");
        console.error(err);
    }
}

testConnection();
