import { connection } from "../config/db.js";

// Create a seller listing
export const createSeller = (req, res) => {
  console.log("createSeller Data", req.body);

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

  // Basic validation (backend safety)
  if (!mobile || !company || !email) {
    return res
      .status(400)
      .json({ error: "Mobile, Company, and Email are required" });
  }

  const sql = `
      INSERT INTO sellers
      (user_id, mobile, company, email, roc_state, activity, price, gst, compliance, incorporation, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  connection.query(
    sql,
    [
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
    ],
    (err, results) => {
      if (err) {
        console.error("❌ Error inserting seller:", err);
        return res.status(500).json({ error: "Failed to create seller" });
      }
      res
        .status(201)
        .json({ message: "✅ Seller created", sellerId: results.insertId });
    }
  );
};

// Get all sellers
export const getAllSellers = (req, res) => {
  connection.query("SELECT * FROM sellers", (err, results) => {
    if (err) {
      console.error("❌ Error fetching sellers:", err);
      return res.status(500).json({ error: "Failed to fetch sellers" });
    }
    // Parse tags JSON → array
    const sellers = results.map(seller => ({
      ...seller,
      tags: seller.tags ? JSON.parse(seller.tags) : [],
    }));

    res.json(sellers);
    
  });
};

// Get sellers by user
export const getSellersByUser = (req, res) => {
  const { userId } = req.params;
  connection.query("SELECT * FROM sellers WHERE user_id = ?", [userId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching sellers by user:", err);
      return res.status(500).json({ error: "Failed to fetch sellers by user" });
    }
    res.json(results);
  });
};
