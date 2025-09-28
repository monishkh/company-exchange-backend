import { connection } from "../config/db.js";
import { nanoid } from "nanoid";
import nodemailer from "nodemailer";

export const createBuyer = (req, res) => {
  console.log("createBuyer Data:", req.body);

  const {
    user_id,
    mobile,
    name,
    email, // optional, could be empty, but backend will use user's signup email
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
      .json({ error: "User ID, mobile, and name are required" });
  }

  // 1️⃣ Get user's email from users table (signup email)
  const getUserEmailSql = "SELECT email, fullname FROM users WHERE id = ?";
  connection.query(getUserEmailSql, [user_id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching user email:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const userEmail = results[0].email;
    const fullName = results[0].full_name;

    // 2️⃣ Generate Nanoid for buyer post
    const buyerId = nanoid(20);

    // 3️⃣ Insert Buyer post into buyers table
    const insertSql = `
      INSERT INTO buyers
      (id, user_id, mobile, name, email, rocState, activity, budget, gst, ageOfCompany, notes, tags, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    connection.query(
      insertSql,
      [
        buyerId,
        user_id,
        mobile,
        name,
        email || userEmail || null,
        rocState,
        activity,
        budget,
        gst,
        ageOfCompany,
        notes,
        JSON.stringify(tags),
      ],
      (err, result) => {
        if (err) {
          console.error("❌ Error inserting buyer:", err);
          return res.status(500).json({ error: "Failed to create buyer" });
        }

        // 4️⃣ Send email if user email exists
        if (userEmail) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: "monishkhan2409@gmail.com",
              pass: "ojts svwo dsaz kjsv",
            },
          });

          const mailOptions = {
            from: "monishkhan2409@gmail.com",
            to: userEmail,
            subject: "Your Buyer Post is Created",
            html: `
              <p>Hello ${fullName},</p>
              <p>Your buyer post has been successfully created with ID: <b>${buyerId}</b>.</p>
              <p>Status: Pending</p>
              <p>Thank you for using our platform!</p>
            `,
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err) console.error("❌ Email error:", err);
            else console.log("✅ Email sent:", info.response);
          });
        }

        // 5️⃣ Return API response
        res.status(201).json({
          message: "✅ Buyer created",
          buyerId,
        });
      }
    );
  });
};

// ✅ Get all buyers with pagination
export const getAllBuyersAdmin = (req, res) => {
  console.log("getAllBuyersAdmin Api call");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  // Step 1: Total buyers count
  connection.query(
    "SELECT COUNT(*) as total FROM buyers",
    (err, countResult) => {
      if (err) {
        console.error("Error fetching count:", err);
        return res.status(500).json({ error: "Server error" });
      }

      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      // Step 2: Fetch buyers for current page
      connection.query(
        "SELECT * FROM buyers ORDER BY id DESC LIMIT ? OFFSET ?",
        [limit, offset],
        (err, buyers) => {
          if (err) {
            console.error("Error fetching buyers:", err);
            return res.status(500).json({ error: "Server error" });
          }

          // Step 3: Parse tags JSON → array
          const formattedBuyers = buyers.map((buyer) => ({
            ...buyer,
            tags: buyer.tags ? JSON.parse(buyer.tags) : [],
          }));

          // Step 4: Return JSON response
          res.json({
            currentPage: page,
            totalPages,
            totalItems,
            data: formattedBuyers,
          });
        }
      );
    }
  );
};

// ✅ Update Buyer Status
export const updateBuyerStatus = (req, res) => {
  const { id } = req.params; // URL me id
  const { status } = req.body; // Body me status
  console.log("updateBuyerStatus ", id, status);

  if (!id || !status) {
    return res.status(400).json({ error: "Buyer ID and Status are required" });
  }

  const sql = "UPDATE buyers SET status = ? WHERE id = ?";
  connection.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("❌ Error updating buyer status:", err);
      return res.status(500).json({ error: "Failed to update status" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    res.json({ message: "✅ Buyer status updated", id, status });
  });
};

// ✅ Get All Buyers by User
export const getBuyersByUser = (req, res) => {
  const { userId } = req.params;
  connection.query(
    "SELECT * FROM buyers WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching buyers by user:", err);
        return res.status(500).json({ error: "Failed to fetch buyers" });
      }
      res.json(results);
    }
  );
};

// ✅ Get Single Buyer by ID
export const getBuyerById = (req, res) => {
  const { id } = req.params;
  connection.query(
    "SELECT * FROM buyers WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching buyer:", err);
        return res.status(500).json({ error: "Failed to fetch buyer" });
      }
      if (results.length === 0) {
        return res.status(404).json({ error: "Buyer not found" });
      }
      res.json(results[0]);
    }
  );
};

// ✅ Delete Buyer
export const deleteBuyer = (req, res) => {
  const { id } = req.params;
  connection.query("DELETE FROM buyers WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("❌ Error deleting buyer:", err);
      return res.status(500).json({ error: "Failed to delete buyer" });
    }
    res.json({ message: "✅ Buyer deleted" });
  });
};

// user's routes
export const getApprovedBuyersForUser = (req, res) => {
  console.log("getApprovedBuyersForUser Api call");
  console.log("getApprovedBuyersForUser Query ", req.query);

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  const { searchCompany, rocState, activity, gst, companyAge, budget, tag } =
    req.query;

  let conditions = ["status = 'approved'"];
  let values = [];

  // Name filter
  if (searchCompany) {
    conditions.push("name LIKE ?");
    values.push(`%${searchCompany}%`);
  }

  // rocState filter
  if (rocState) {
    conditions.push("rocState = ?");
    values.push(rocState);
  }

  // activity filter
  if (activity) {
    conditions.push("activity = ?");
    values.push(activity);
  }

  // companyAge filter
  if (companyAge) {
    conditions.push("TRIM(ageOfCompany) = ?");
    values.push(companyAge);
  }

  // gst filter
  if (gst) {
    conditions.push("TRIM(gst) = ?");
    values.push(gst);
  }

  // budget filter
  if (budget) {
    conditions.push("TRIM(budget) = ?");
    values.push(budget);
  }

  // Tags filter (match exact number of tags and exact content)
  if (tag) {
    const tagsArray = tag.split(",").map((t) => t.trim());
    conditions.push("JSON_LENGTH(tags) = ?");
    values.push(tagsArray.length);

    const tagJson = JSON.stringify(tagsArray.sort()); // sort to normalize
    conditions.push("JSON_CONTAINS(tags, ?)");
    values.push(tagJson);
  }

  const whereClause = conditions.length
    ? "WHERE " + conditions.join(" AND ")
    : "";

  // Step 1: Count total items
  connection.query(
    `SELECT COUNT(*) as total FROM buyers ${whereClause}`,
    values,
    (err, countResult) => {
      if (err) {
        console.error("Error fetching count:", err);
        return res.status(500).json({ error: "Server error" });
      }

      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      // Step 2: Fetch paginated data
      connection.query(
        `SELECT * FROM buyers ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...values, limit, offset],
        (err, buyers) => {
          if (err) {
            console.error("Error fetching buyers:", err);
            return res.status(500).json({ error: "Server error" });
          }

          // Parse tags JSON → array
          const formattedBuyers = buyers.map((b) => ({
            ...b,
            tags: b.tags ? JSON.parse(b.tags) : [],
          }));

          res.json({
            currentPage: page,
            totalPages,
            totalItems,
            data: formattedBuyers,
          });
        }
      );
    }
  );
};
