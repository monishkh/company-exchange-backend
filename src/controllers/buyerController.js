import { pool } from "../config/db.js";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";

// ✅ Create Buyer
export const createBuyer = async (req, res) => {
  console.log("createBuyer Data:", req.body);

  const {
    user_id,
    mobile,
    name,
    email,
    rocState,
    activity,
    budget,
    gst,
    ageOfCompany,
    notes,
    tags,
  } = req.body;

  if (!user_id || !mobile || !name) {
    return res
      .status(400)
      .json({ error: "User ID, mobile & name are required" });
  }

  try {
    const [userRows] = await pool.execute(
      "SELECT email, fullname FROM users WHERE id = ?",
      [user_id]
    );

    if (userRows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const userEmail = email || userRows[0].email || null;
    const fullName = userRows[0].fullname;
    const buyerId = nanoid(20);

    await pool.execute(
      `INSERT INTO buyers
       (id, user_id, mobile, name, email, rocState, activity, budget, gst, ageOfCompany, notes, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        buyerId,
        user_id,
        mobile,
        name,
        userEmail,
        rocState,
        activity,
        budget,
        gst,
        ageOfCompany,
        notes,
        JSON.stringify(tags || []),
      ]
    );

    return res.status(201).json({
      message: "✅ Buyer created successfully",
      buyerId,
    });
  } catch (err) {
    console.error("❌ Create Buyer Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get All Buyers (Admin)
export const getAllBuyersAdmin = async (req, res) => {
  console.log("getAllBuyersAdmin API call");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  try {
    const [[{ totalItems }]] = await pool.execute(
      "SELECT COUNT(*) as totalItems FROM buyers"
    );

    const totalPages = Math.ceil(totalItems / limit);

    const [buyers] = await pool.execute(
      "SELECT * FROM buyers ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );

    const formatted = buyers.map((b) => ({
      ...b,
      tags: b.tags ? JSON.parse(b.tags) : [],
    }));

    return res.json({
      currentPage: page,
      totalPages,
      totalItems,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Fetch Buyers Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Update Buyer Status
export const updateBuyerStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log("updateBuyerStatus", id, status);

  if (!id || !status)
    return res.status(400).json({ error: "Buyer ID & Status required" });

  try {
    const [result] = await pool.execute(
      "UPDATE buyers SET status = ? WHERE id = ?",
      [status, id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Buyer not found" });

    return res.json({ message: "✅ Status updated", id, status });
  } catch (err) {
    console.error("❌ Update Status Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Get All Buyers by User
export const getBuyersByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const [results] = await pool.execute(
      "SELECT * FROM buyers WHERE user_id = ?",
      [userId]
    );
    return res.json(results);
  } catch (err) {
    console.error("❌ Fetch Buyer by User Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Single Buyer by ID
export const getBuyerById = async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await pool.execute("SELECT * FROM buyers WHERE id = ?", [
      id,
    ]);
    if (results.length === 0)
      return res.status(404).json({ error: "Buyer not found" });

    return res.json(results[0]);
  } catch (err) {
    console.error("❌ Get Buyer Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete Buyer
export const deleteBuyer = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.execute("DELETE FROM buyers WHERE id = ?", [id]);
    return res.json({ message: "✅ Buyer deleted" });
  } catch (err) {
    console.error("❌ Delete Buyer Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

// ✅ Filtered Approved Buyers (User)
export const getApprovedBuyersForUser = async (req, res) => {
  console.log("getApprovedBuyersForUser Query", req.query);

  const { searchCompany, rocState, activity, gst, companyAge, budget, tag } =
    req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  try {
    let conditions = ["status = 'approved'"];
    let values = [];

    if (searchCompany) {
      conditions.push("name LIKE ?");
      values.push(`%${searchCompany}%`);
    }

    if (rocState) {
      conditions.push("rocState = ?");
      values.push(rocState);
    }

    if (activity) {
      conditions.push("activity = ?");
      values.push(activity);
    }

    if (companyAge) {
      conditions.push("TRIM(ageOfCompany) = ?");
      values.push(companyAge);
    }

    if (gst) {
      conditions.push("TRIM(gst) = ?");
      values.push(gst);
    }

    if (budget) {
      conditions.push("TRIM(budget) = ?");
      values.push(budget);
    }

    if (tag) {
      const tagsArray = tag.split(",").map((t) => t.trim());
      conditions.push("JSON_LENGTH(tags) = ?");
      values.push(tagsArray.length);

      const tagJson = JSON.stringify(tagsArray.sort());
      conditions.push("JSON_CONTAINS(tags, ?)");
      values.push(tagJson);
    }

    const whereClause = "WHERE " + conditions.join(" AND ");

    const [[{ totalItems }]] = await pool.execute(
      `SELECT COUNT(*) as totalItems FROM buyers ${whereClause}`,
      values
    );

    const totalPages = Math.ceil(totalItems / limit);

    const [buyers] = await pool.execute(
      `SELECT * FROM buyers ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const formatted = buyers.map((b) => ({
      ...b,
      tags: b.tags ? JSON.parse(b.tags) : [],
    }));

    return res.json({
      currentPage: page,
      totalPages,
      totalItems,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Filter Approved Buyers Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
