import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  // password: process.env.DB_PASS,
  database: "company_exchange",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ✅ Test database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ MySQL Pool connected successfully!");
    connection.release();
  } catch (err) {
    console.error("❌ MySQL Pool connection failed:", err.message);
  }
})();
