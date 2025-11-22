// backend/dbConfig.js
import sql from "mssql";

const dbConfig = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  port: parseInt(process.env.SQL_PORT || "1433", 10),
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
        console.log("✅ DATABASE CONNECTED SUCCESSFULLY!");
        console.log("Server   :", process.env.SQL_SERVER);
        console.log("Database :", process.env.SQL_DATABASE);
        console.log("User     :", process.env.SQL_USER);
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
