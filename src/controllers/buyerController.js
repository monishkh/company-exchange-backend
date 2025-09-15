import { connection } from "../config/db.js";

// ✅ Create Buyer Post
export const createBuyer = (req, res) => {
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

  // Check if buyer already exists with same name + user
 

    // Insert Buyer
    const sql = `
      INSERT INTO buyers
      (user_id, mobile, name, email, roc_state, activity, budget, gst, age_of_company, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      sql,
      [
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
        JSON.stringify(tags),
      ],
      (err, results) => {
        if (err) {
          console.error("❌ Error inserting buyer:", err);
          return res.status(500).json({ error: "Failed to create buyer" });
        }
        res.status(201).json({ message: "✅ Buyer created", buyerId: results.insertId });
      }
    );
};

// ✅ Get all buyers
export const getAllBuyers = (req, res) => {
  const sql = "SELECT * FROM buyers ORDER BY created_at DESC";

  connection.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching buyers:", err);
      return res.status(500).json({ error: "Failed to fetch buyers" });
    }

    // Parse tags JSON → array
    const buyers = results.map(buyer => ({
      ...buyer,
      tags: buyer.tags ? JSON.parse(buyer.tags) : [],
    }));

    res.json(buyers);
  });
};

// ✅ Get All Buyers by User
export const getBuyersByUser = (req, res) => {
  const { userId } = req.params;
  connection.query("SELECT * FROM buyers WHERE user_id = ?", [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching buyers by user:", err);
      return res.status(500).json({ error: "Failed to fetch buyers" });
    }
    res.json(results);
  });
};

// ✅ Get Single Buyer by ID
export const getBuyerById = (req, res) => {
  const { id } = req.params;
  connection.query("SELECT * FROM buyers WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("❌ Error fetching buyer:", err);
      return res.status(500).json({ error: "Failed to fetch buyer" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Buyer not found" });
    }
    res.json(results[0]);
  });
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
