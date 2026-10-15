import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 1433),

  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate:
      process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },

  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

export const getPool = async () => {
  try {
    if (pool) {
      return pool;
    }

    pool = await sql.connect(dbConfig);

    console.log("SQL Server connected successfully");

    return pool;
  } catch (error) {
    console.error("SQL Server connection failed:", error);
    pool = null;
    throw error;
  }
};

export { sql };