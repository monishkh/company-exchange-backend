import { connection } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// Register user
export const registerUser = (req, res) => {
  console.log("registerUser Data", req.body);

  const { fullName, phone, email, password, role } = req.body;

  if (!fullName || !phone || !password || !role) {
    return res
      .status(400)
      .json({ error: "All required fields must be filled" });
  }

  // 1️⃣ Check if phone already exists
  const checkSql = "SELECT * FROM users WHERE phone = ?";
  connection.query(checkSql, [phone], (err, results) => {
    if (err) {
      console.error("❌ Error checking phone:", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (results.length > 0) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    // 2️⃣ Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 3️⃣ Insert into DB
    const insertSql = `INSERT INTO users (full_name, phone, email, password, role) VALUES (?, ?, ?, ?, ?)`;
    connection.query(
      insertSql,
      [fullName, phone, email || null, hashedPassword, role],
      (err, result) => {
        if (err) {
          console.error("❌ Error inserting user:", err.message);
          return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
          message: "User registered successfully",
          userId: result.insertId,
        });
      }
    );
  });
};

// Login user
export const loginUser = (req, res) => {
    console.log('loginUser Data ', req.body);
    
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res
      .status(400)
      .json({ error: "Phone number and password are required" });
  }

  // Check if user exists
  const sql = `SELECT * FROM users WHERE phone = ? LIMIT 1`;
  connection.query(sql, [phone], async (err, results) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res
        .status(400)
        .json({ error: "User not found with this phone number" });
    }

    const user = results[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      "SECRET_KEY", // ⚠️ Replace with process.env.JWT_SECRET
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        phone: user.phone,
        email: user.email,
        role: user.role,
      },
    });
  });
};


// Admin login only with email + password
export const adminLogin = (req, res) => {
  console.log('adminLogin Data', req.body);
  
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const sql = `SELECT * FROM users WHERE email = ? AND role = 'admin' LIMIT 1`;
  connection.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length === 0) return res.status(404).json({ error: "Admin not found" });

    const admin = results[0];
    // const isMatch = await bcrypt.compare(password, admin.password);
    // if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: admin.id, role: "admin" }, "SECRET_KEY", { expiresIn: "1h" });

    res.json({ message: "Admin login successful", token, user: { id: admin.id, email: admin.email, role: "admin" } });
  });
};
