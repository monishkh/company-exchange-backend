import { connection } from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";

// Register user
export const registerUser = (req, res) => {
  console.log("registerUser Data", req.body);

  const { fullName, phone, email, password } = req.body;

  // 1️⃣ Validation
  if (!fullName || !phone || !password) {
    return res
      .status(400)
      .json({ error: "Full name, phone, and password are required" });
  }

  // 2️⃣ Generate Nanoid for user ID
  const id = nanoid(20);

  // 3️⃣ Check if phone or email already exists
  const checkSql = "SELECT * FROM users WHERE phone = ? OR email = ?";
  connection.query(checkSql, [phone, email || ""], (err, results) => {
    if (err) {
      console.error("❌ Error checking user:", err.message);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      let errors = {};

      // Check separately
      const phoneExists = results.some((row) => row.phone === phone);
      const emailExists = email
        ? results.some((row) => row.email === email)
        : false;

      if (phoneExists) errors.phone = "Phone number already registered";
      if (emailExists) errors.email = "Email already registered";

      return res.status(400).json({ error: errors });
    }

    // 4️⃣ Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 5️⃣ Insert into DB
    const insertSql =
      "INSERT INTO users (id, fullname, phone, email, password) VALUES (?, ?, ?, ?, ?)";
    connection.query(
      insertSql,
      [id, fullName, phone, email || null, hashedPassword],
      (err) => {
        if (err) {
          console.error("❌ Error inserting user:", err.message);
          return res.status(500).json({ error: "Database error" });
        }

        // 6️⃣ Return Nanoid as userId
        res.status(201).json({
          message: "User registered successfully",
          userId: id,
        });
      }
    );
  });
};

// Login user (phone + password only)
export const loginUser = (req, res) => {
  console.log("loginUser Data", req.body);

  const { phone, password } = req.body;

  // validation
  if (!phone || !password) {
    return res
      .status(400)
      .json({ error: "Phone number and password are required" });
  }

  // Find user by phone
  const sql = "SELECT * FROM users WHERE phone = ? LIMIT 1";
  connection.query(sql, [phone], async (err, results) => {
    if (err) {
      console.error("❌ DB error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!results || results.length === 0) {
      return res
        .status(400)
        .json({ error: "User not found with this phone number" });
    }

    const user = results[0];

    // Compare password (bcrypt.compare returns a promise)
    try {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }
    } catch (compareErr) {
      console.error("❌ Bcrypt compare error:", compareErr);
      return res.status(500).json({ error: "Server error" });
    }

    // Generate JWT token (no role, no email)
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || "REPLACE_WITH_SECURE_SECRET",
      { expiresIn: "1h" }
    );

    console.log('user res, ', user);
    
    // Response
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.fullname || user.full_name || null,
        phone: user.phone,
        role: user.role
      },
    });

    
    

  });
};

// Admin login only with email + password
export const adminLogin = (req, res) => {
  console.log("adminLogin Data", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const sql = `SELECT * FROM users WHERE email = ? AND role = 'admin' LIMIT 1`;
  connection.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (results.length === 0)
      return res.status(404).json({ error: "Admin not found" });

    const admin = results[0];
    // const isMatch = await bcrypt.compare(password, admin.password);
    // if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign({ id: admin.id, role: "admin" }, "SECRET_KEY", {
      expiresIn: "1h",
    });

    res.json({
      message: "Admin login successful",
      token,
      user: { id: admin.id, email: admin.email, role: "admin" },
    });
  });
};
