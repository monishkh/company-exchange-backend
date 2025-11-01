import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { pool } from "../config/db.js";

// ✅ Register User
export const registerUser = async (req, res) => {
  console.log("registerUser Data", req.body);

  const { fullName, phone, email, password } = req.body;

  if (!fullName || !phone || !password) {
    return res
      .status(400)
      .json({ error: "Full name, phone, and password are required" });
  }

  try {
    // 1️⃣ Check if user exists by phone OR email
    const checkSql =
      "SELECT phone, email FROM users WHERE phone = ? OR email = ?";
    const [existing] = await pool.execute(checkSql, [phone, email || ""]);

    if (existing.length > 0) {
      let errors = {};
      if (existing.some((u) => u.phone === phone))
        errors.phone = "Phone number already registered";
      if (email && existing.some((u) => u.email === email))
        errors.email = "Email already registered";

      return res.status(400).json({ error: errors });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = nanoid(20);

    // 3️⃣ Save new user
    const insertSql =
      "INSERT INTO users (id, fullname, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)";
    await pool.execute(insertSql, [
      id,
      fullName,
      phone,
      email || null,
      hashedPassword,
      "user", // default role
    ]);

    return res.status(201).json({
      message: "User registered successfully",
      userId: id,
    });
  } catch (err) {
    console.error("❌ Register Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Login User
export const loginUser = async (req, res) => {
  console.log("loginUser Data", req.body);

  const { phone, password } = req.body;

  if (!phone || !password) {
    return res
      .status(400)
      .json({ error: "Phone number and password are required" });
  }

  try {
    const sql = "SELECT * FROM users WHERE phone = ? LIMIT 1";
    const [results] = await pool.execute(sql, [phone]);

    if (results.length === 0) {
      return res
        .status(400)
        .json({ error: "User not found with this phone number" });
    }

    const user = results[0];

    console.log('user_ ', user);
    

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      process.env.JWT_SECRET || "REPLACE_WITH_SECURE_SECRET",
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.fullname,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Admin Login (email + password)
export const adminLogin = async (req, res) => {
  console.log("adminLogin Data", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const sql =
      "SELECT * FROM users WHERE email = ? AND role = 'admin' LIMIT 1";
    const [results] = await pool.execute(sql, [email]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const admin = results[0];

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin.id, role: "admin" },
      process.env.JWT_SECRET || "REPLACE_WITH_SECURE_SECRET",
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Admin login successful",
      token,
      user: { id: admin.id, email: admin.email, role: "admin" },
    });
  } catch (err) {
    console.error("❌ Admin Login Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
