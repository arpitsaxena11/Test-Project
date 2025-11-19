import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

export const config = {
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: false, trustServerCertificate: true },
  connectionTimeout: 30000,
  requestTimeout: 300000
};

export async function connectDB() {
  let retries = 2;
  while (retries >= 0) {
    try {
      const pool = await sql.connect(config);
      console.log("======================================");
      console.log("✅ DATABASE CONNECTED SUCCESSFULLY!");
      console.log("Server   :", config.server);
      console.log("Database :", config.database);
      console.log("User     :", config.user);
      console.log("======================================");
      return pool;
    } catch (err) {
      console.log("Connection attempt failed:", err.message);
      retries--;
      if (retries < 0) throw err;
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}

export { sql };
