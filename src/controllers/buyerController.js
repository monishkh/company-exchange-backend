import { pool } from "../config/db.js";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";

// ✅ Create Buyer
// ✅ Create Buyer (Anonymous + Future logged-in support)
export const createBuyer = async (req, res) => {
  try {
    const {
      mobile,
      name,
      email,
      rocState,
      activity,
      budget,
      gst,
      ageOfCompany,
      notes,
      tags
    } = req.body;

    console.log("createBuyer Data:", req.body);

    // Validation
    if (!mobile || !name || !email) {
      return res.status(400).json({
        error: "Name, Mobile & Email are required"
      });
    }

    // -----------------------------------
    // 1️⃣ INSERT BUYER INTO DATABASE
    // -----------------------------------
    const sql = `
      INSERT INTO buyers 
      (user_id, mobile, name, email, roc_state, activity, budget, gst, age_of_company, notes, tags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'accept')
    `;

    const params = [
      null,                         // user_id is null for now
      mobile,
      name,
      email,
      rocState,
      activity,
      budget,
      gst,
      ageOfCompany,
      notes,
      JSON.stringify(tags || [])
    ];

    const [result] = await pool.execute(sql, params);
    const buyerId = result.insertId;

    // -----------------------------------
    // 2️⃣ SEND EMAIL TO BUYER
    // -----------------------------------
    if (email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER || "monishkhan2409@gmail.com",
          pass: process.env.EMAIL_PASS || "ojts svwo dsaz kjsv"
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER || "monishkhan2409@gmail.com",
        to: email,
        subject: "Your Buyer Request is Created",
        html: `
          <p>Hello ${name},</p>
          <p>Your buyer request has been successfully created.</p>
          <p>Buyer ID: <b>${buyerId}</b></p>
          <p>Status: Accepted</p>
          <p>We will connect with you soon!</p>
        `
      });
    }

    // -----------------------------------
    // 3️⃣ RESPONSE
    // -----------------------------------
    return res.status(201).json({
      success: true,
      message: "Buyer created successfully",
      buyerId
    });

  } catch (error) {
    console.error("❌ Create Buyer Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error
    });
  }
};




// ✅ Get All Buyers (Admin) — Same format as Sellers API
export const getAllBuyersAdmin = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // Count total buyers
    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) as total FROM buyers"
    );

    const totalPages = Math.ceil(total / limit);

    // Query same style as sellers API
    const query = `
      SELECT *
      FROM buyers
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [buyers] = await pool.execute(query);

    // Parse JSON tags
    const formatted = buyers.map((b) => ({
      ...b,
      tags: b.tags ? JSON.parse(b.tags) : [],
    }));

    res.json({
      currentPage: page,
      totalPages,
      totalItems: total,
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Fetch Buyers Error:", err);
    res.status(500).json({ error: "Server error" });
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

// Get Approved Buyers for User with Filters + Pagination
export const getBuyersByUser = async (req, res) => {
  try {
    console.log("getBuyersByUser Query:", req.query);

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 5);
    const offset = (page - 1) * limit;

    // Base WHERE
    let where = "status = 'accept'";
    const params = [];

    // Filter mapping
    const filters = {
      searchCompany: "company LIKE ?",
      rocState: "roc_state LIKE ?",
      activity: "activity LIKE ?",
      gst: "gst LIKE ?",
      compliance: "compliance LIKE ?",
      tag: "tags LIKE ?",        // JSON-string tags
      document: "document LIKE ?"
    };

    // Apply filters dynamically
    for (const key in filters) {
      if (req.query[key]) {
        where += ` AND ${filters[key]}`;
        params.push(`%${req.query[key]}%`);
      }
    }

    // Price budget filter
    const minBudget = Number(req.query.minBudget) || 0;
    const maxBudget = Number(req.query.maxBudget) || 999999999;
    where += " AND budget BETWEEN ? AND ?";
    params.push(minBudget, maxBudget);

    // Debug
    console.log("WHERE:", where);
    console.log("PARAMS:", params);
    console.log("Limit/Offset:", limit, offset);

    // COUNT Query
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM buyers WHERE ${where}`,
      params
    );

    const totalPages = Math.ceil(total / limit);

    // MAIN QUERY (safe interpolation for limit/offset)
    const sql = `
      SELECT * FROM buyers
      WHERE ${where}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    const [buyers] = await pool.execute(sql, [...params, limit, offset]);

    return res.json({
      currentPage: page,
      totalPages,
      totalItems: total,
      data: buyers,
    });

  } catch (err) {
    console.error("❌ getBuyersByUser Error:", err);
    res.status(500).json({ error: "Server error" });
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


// ✅ Filtered Approved Buyers (User) — Same format as Sellers API
export const getApprovedBuyersForUser = async (req, res) => {
  try {
    // console.log("getApprovedBuyersForUser Api called");

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 5);
    const offset = (page - 1) * limit;

    let where = "status = 'accept'";
    const params = [];

    // 🔍 Filters mapping (same pattern as sellers API)
    const filters = {
      searchCompany: "name LIKE ?",
      rocState: "roc_state LIKE ?",
      activity: "activity LIKE ?",
      gst: "gst LIKE ?",
      budget: "budget LIKE ?",
      companyAge: "age_of_company LIKE ?",
      tag: "tags LIKE ?",
      compliance: "notes LIKE ?",
      document: "notes LIKE ?",
    };

    // Apply filters
    for (const key in filters) {
      if (req.query[key]) {
        where += ` AND ${filters[key]}`;
        params.push(`%${req.query[key]}%`);
      }
    }

    // 📌 Debug logs
    // console.log("WHERE:", where);
    // console.log("PARAMS BEFORE LIMIT/OFFSET:", params);

    // 📌 COUNT QUERY
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM buyers WHERE ${where}`,
      params
    );

    const totalPages = Math.ceil(total / limit);

    // 📌 MAIN QUERY (Same format as Sellers API)
    const sql = `
      SELECT *
      FROM buyers
      WHERE ${where}
      ORDER BY id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // console.log("SQL:", sql);

    const [buyers] = await pool.execute(sql, params);


    const formatted = buyers.map(b => ({
      ...b,
      tags: b.tags ? JSON.parse(b.tags) : []
    }));

    res.json({
      currentPage: page,
      totalPages,
      totalItems: total,
      data: formatted,
    });

  } catch (err) {
    console.error("❌ Filter Approved Buyers Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// ✅ Get Single Buyer 
export const getSingleBuyer = async (req, res) => {
  try {
    const { buyer_id } = req.params;

    const [rows] = await pool.execute(
      "SELECT * FROM buyers WHERE id = ?",
      [buyer_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Buyer not found" });
    }

    let buyer = rows[0];

    // Convert JSON string → array (safe)
    if (buyer.tags) {
      try {
        buyer.tags = JSON.parse(buyer.tags);
      } catch {
        buyer.tags = []; // fallback
      }
    }

    res.status(200).json({
      success: true,
      data: buyer,
    });


    console.log('buyer id ', buyer_id);

  } catch (error) {
    console.log('getSingleBuyer Error:', error);
    res.status(500).json({ error: "Server Error" });
  }
}


// ✅ Update Buyer (buyer_id from params)
export const updateBuyer = async (req, res) => {
  try {
    const { buyer_id } = req.params;

    console.log("buyer id =>", buyer_id);
    console.log("update data =>", req.body);

    const {
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

    if (!mobile || !name || !email || !rocState || !activity || !budget || !gst || !ageOfCompany) {
      return res.status(400).json({
        error: "Required fields are missing",
      });
    }

    const updateSQL = `
      UPDATE buyers SET
        mobile = ?,
        name = ?,
        email = ?,
        roc_state = ?,
        activity = ?,
        budget = ?,
        gst = ?,
        age_of_company = ?,
        notes = ?,
        tags = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await pool.execute(updateSQL, [
      mobile,
      name,
      email,
      rocState,
      activity,
      budget,
      gst,
      ageOfCompany,
      notes,
      JSON.stringify(tags || []),
      buyer_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: "Buyer not found or no update applied",
      });
    }

    res.status(200).json({
      success: true,
      message: "Buyer updated successfully",
    });

  } catch (error) {
    console.error("❌ Update Buyer Error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};




