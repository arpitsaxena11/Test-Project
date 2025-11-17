import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

export const config = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

export { sql };
