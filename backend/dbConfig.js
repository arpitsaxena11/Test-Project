// backend/dbConfig.js
import sql from "mssql";

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise = null;

export function getPool() {
  if (!poolPromise) {
    console.log("⏳ Connecting to MS SQL...");
    poolPromise = sql
      .connect(dbConfig)
      .then((pool) => {
        console.log("======================================");
        console.log("✅ DATABASE CONNECTED SUCCESSFULLY!");
        console.log("Server   :", process.env.DB_SERVER);
        console.log("Database :", process.env.DB_NAME);
        console.log("User     :", process.env.DB_USER);
        console.log("======================================");
        return pool;
      })
      .catch((err) => {
        console.error("❌ DB CONNECTION FAILED!");
        console.error(err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
}

export { sql };
