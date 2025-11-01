import { pool } from "../config/db.js";
import nodemailer from "nodemailer";

// ✅ Create Seller Posts
export const createSeller = async (req, res) => {
  try {
    console.log("createSeller Data:", req.body);

    const {
      user_id,
      mobile,
      company,
      email,
      rocState,
      activity,
      price,
      gst,
      compliance,
      incorporation,
      notes,
      tags,
    } = req.body;

    if (!mobile || !company || !email) {
      return res.status(400).json({
        error: "Mobile, Company, and Email are required",
      });
    }

    // ✅ Insert Seller
    const sql = `
      INSERT INTO sellers 
      (user_id, mobile, company, email, roc_state, activity, price, gst, compliance, incorporation, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertRes] = await pool.execute(sql, [
      user_id,
      mobile,
      company,
      email,
      rocState,
      activity,
      price,
      gst,
      compliance,
      incorporation,
      notes,
      JSON.stringify(tags),
    ]);

    const sellerId = insertRes.insertId;

    // ✅ Email Sending
    const [userRes] = await pool.execute(
      `SELECT fullname, email FROM users WHERE id = ? LIMIT 1`,
      [user_id]
    );

    if (userRes.length > 0) {
      const { fullname, email } = userRes[0];

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "monishkhan2409@gmail.com",
          pass: "ojts svwo dsaz kjsv",
        },
      });

      await transporter.sendMail({
        from: "monishkhan2409@gmail.com",
        to: email,
        subject: "Your Seller Post is Created",
        html: `
          <p>Hello ${fullname},</p>
          <p>Your seller post has been successfully created with ID: <b>${sellerId}</b>.</p>
          <p>Status: Pending</p>
        `,
      });
    }

    res.status(201).json({
      message: "✅ Seller created",
      sellerId,
    });
  } catch (err) {
    console.error("❌ Create Seller Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get All Sellers for Admin (Pagination)
export const getAllSellersForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) as total FROM sellers"
    );

    const totalPages = Math.ceil(total / limit);

    const [sellers] = await pool.execute(
      "SELECT * FROM sellers ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    res.json({
      currentPage: page,
      totalPages,
      totalItems: total,
      data: sellers,
    });
  } catch (err) {
    console.error("❌ Admin Fetch Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get Approved Sellers for User (filters + pagination)
export const getApprovedSellersForUser = async (req, res) => {
  try {
    console.log("getApprovedSellersForUser Api called");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    let where = "status = 'approved'";
    const params = [];

    const filters = {
      searchCompany: ["company LIKE ?", "%"],
      rocState: ["roc_state LIKE ?", "%"],
      activity: ["activity LIKE ?", "%"],
      gst: ["gst LIKE ?", "%"],
      compliance: ["compliance LIKE ?", "%"],
    };

    for (const key in filters) {
      if (req.query[key]) {
        where += ` AND ${filters[key][0]}`;
        params.push(`%${req.query[key]}%`);
      }
    }

    where += " AND price BETWEEN ? AND ?";
    params.push(
      parseFloat(req.query.minPrice) || 0,
      parseFloat(req.query.maxPrice) || 1000000000
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM sellers WHERE ${where}`,
      params
    );

    const totalPages = Math.ceil(total / limit);

    const [sellers] = await pool.execute(
      `SELECT * FROM sellers WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      currentPage: page,
      totalPages,
      totalItems: total,
      data: sellers,
    });
  } catch (err) {
    console.error("❌ Approved Seller Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update Seller Status
export const updateSellerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await pool.execute(
      "UPDATE sellers SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({ message: "✅ Seller status updated", id, status });
  } catch (err) {
    console.error("❌ Status Update Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get sellers by user
export const getSellersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const [result] = await pool.execute(
      "SELECT * FROM sellers WHERE user_id = ?",
      [userId]
    );
    res.json(result);
  } catch (err) {
    console.error("❌ User Sellers Fetch Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
