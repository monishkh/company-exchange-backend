import mysql from "mysql2";

// Create connection
export const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "company_exchange"     // make sure this DB exists
});

// Connect
connection.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected successfully!");
  }
});
