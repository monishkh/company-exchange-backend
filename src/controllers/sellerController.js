import path from "path";
import { pool } from "../config/db.js";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
import fs from "fs";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Create Seller Posts (Anonymous + Logged-in)
// export const createSeller = async (req, res) => {
//   try {
//     console.log("createSeller Data:", req.body);

//     const {
//       user_id,
//       name,
//       mobile,
//       company,
//       email,
//       rocState,
//       activity,
//       price,
//       gst,
//       compliance,
//       incorporation,
//       notes,
//       tags,
//     } = req.body;

//     if (!mobile || !company || !email || !name) {
//       return res.status(400).json({
//         error: "Name, Mobile, Company, and Email are required",
//       });
//     }

//     // ✅ Insert Seller
//     const sql = `
//       INSERT INTO sellers 
//       (user_id, name, mobile, company, email, roc_state, activity, price, gst, compliance, incorporation, notes, tags)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `;

//     const [insertRes] = await pool.execute(sql, [
//       user_id || null,
//       name,
//       mobile,
//       company,
//       email,
//       rocState,
//       activity,
//       price,
//       gst,
//       compliance,
//       incorporation,
//       notes,
//       JSON.stringify(tags),
//     ]);

//     const sellerId = insertRes.insertId;

//     // ✅ Email Sending
//     let recipientName = name; // default to provided name

//     if (user_id) {
//       const [userRes] = await pool.execute(
//         `SELECT fullname FROM users WHERE id = ? LIMIT 1`,
//         [user_id]
//       );
//       if (userRes.length > 0) {
//         recipientName = userRes[0].fullname;
//       }
//     }

//     // Send email to the provided email
//     if (email) {
//       const transporter = nodemailer.createTransport({
//         service: "gmail",
//         auth: {
//           user: "monishkhan2409@gmail.com",
//           pass: "ojts svwo dsaz kjsv",
//         },
//       });

//       await transporter.sendMail({
//         from: "monishkhan2409@gmail.com",
//         to: email,
//         subject: "Your Seller Post is Created",
//         html: `
//           <p>Hello ${recipientName},</p>
//           <p>Your seller post has been successfully created with ID: <b>${sellerId}</b>.</p>
//           <p>Status: Pending</p>
//         `,
//       });
//     }

//     res.status(201).json({
//       message: "✅ Seller created",
//       sellerId,
//     });
//   } catch (err) {
//     console.error("❌ Create Seller Error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

export const createSeller = async (req, res) => {
  try {
    console.log("📌 Received Seller Data:", req.body);
    console.log("📌 Uploaded Files:", req.files);

    const {
      user_id,
      name,
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

    if (!mobile || !company || !email || !name) {
      return res.status(400).json({
        error: "Name, Mobile, Company, and Email are required",
      });
    }

    const uploadedFiles = req.files?.map(file => file.filename) || [];
    const filesString = JSON.stringify(uploadedFiles);

    /// 🔹 Improved Tags Handling (Always stored as JSON Array)
    let formattedTags = tags;

    if (typeof formattedTags === "string") {
      formattedTags = formattedTags.trim();

      try {
        formattedTags = JSON.parse(formattedTags);
      } catch {
        if (formattedTags.includes(",")) {
          formattedTags = formattedTags.split(",").map(tag => tag.trim());
        } else {
          formattedTags = [formattedTags];
        }
      }
    }

    const tagsString = JSON.stringify(formattedTags);

    let finalUserId = user_id;
    if (finalUserId === "null" || !finalUserId) {
      finalUserId = null;
    } else {
      finalUserId = Number(finalUserId);
    }

    const sql = `
      INSERT INTO sellers 
      (user_id, name, mobile, company, email, roc_state, activity, price, gst, compliance, incorporation, notes, tags, documents)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [insertRes] = await pool.execute(sql, [
      finalUserId,
      name,
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
      tagsString,
      filesString,
    ]);

    const sellerId = insertRes.insertId;

    // 🔹 Email logic
    let recipientName = name;


    if (email) {
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
          <p>Hello ${recipientName},</p>
          <p>Your seller post has been successfully created with ID: <b>${sellerId}</b>.</p>
          <p>Status: Pending</p>
        `,
      });
    }

    res.status(201).json({
      message: "🎯 Seller created successfully",
      sellerId,
      files: uploadedFiles,
    });

  } catch (err) {
    console.error("❌ Create Seller Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// documents delete
export const deleteSellerFile = async (req, res) => {
  console.log("deleteSellerFile api called");
  try {
    const { seller_id } = req.params;
    const { filename } = req.body;

    if (!filename) {
      return res
        .status(400)
        .json({ success: false, message: "Filename required" });
    }

    // Fetch current files from DB
    const [rows] = await pool.execute(
      "SELECT documents FROM sellers WHERE seller_id = ?",
      [seller_id]
    );
    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });

    let documents = JSON.parse(rows[0].documents || "[]");

    // Remove file from DB list
    documents = documents.filter((doc) => doc !== filename);

    // Update DB
    await pool.execute(
      "UPDATE sellers SET documents = ? WHERE seller_id = ?",
      [JSON.stringify(documents), seller_id]
    );

    // Delete file from uploads folder
    const filePath = path.join(__dirname, "../uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      success: true,
      message: "File deleted successfully",
      documents,
    });
  } catch (err) {
    console.log("❌ Delete File Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




// ✅ Get All Sellers for Admin (Pagination)
export const getAllSellersForAdmin = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) as total FROM sellers"
    );

    const totalPages = Math.ceil(total / limit);

    const query = `
      SELECT *
      FROM sellers
      ORDER BY seller_id DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [sellers] = await pool.execute(query);

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

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 5);
    const offset = (page - 1) * limit;

    let where = "status = 'accept'";
    const params = [];

    const filters = {
      searchCompany: "company LIKE ?",
      rocState: "roc_state LIKE ?",
      activity: "activity LIKE ?",
      gst: "gst LIKE ?",
      compliance: "compliance LIKE ?",
    };

    for (const key in filters) {
      if (req.query[key]) {
        where += ` AND ${filters[key]}`;
        params.push(`%${req.query[key]}%`);
      }
    }

    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || 999999999;
    where += " AND price BETWEEN ? AND ?";
    params.push(minPrice, maxPrice);

    // Debug logs (very helpful)
    console.log('WHERE:', where);
    console.log('params BEFORE LIMIT/OFFSET:', params);
    console.log('limit, offset:', limit, offset);

    // COUNT
    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total FROM sellers WHERE ${where}`,
      params
    );

    const totalPages = Math.ceil(total / limit);

    // MAIN QUERY — interpolate limit and offset as integers (safe since we validated them)
    const sql = `SELECT * FROM sellers WHERE ${where} ORDER BY seller_id DESC LIMIT ${limit} OFFSET ${offset}`;
    console.log('SQL:', sql);
    const [sellers] = await pool.execute(sql, params);

    // ✅ FORMAT TAGS LIKE BUYERS API
    const formatted = sellers.map(s => ({
      ...s,
      tags: s.tags ? JSON.parse(s.tags) : []
    }));

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


export const getSingleSeller = async (req, res) => {
  try {
    const sellerId = req.params?.seller_id;

    const [rows] = await pool.execute(
      "SELECT * FROM sellers WHERE seller_id = ?",
      [sellerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    let seller = rows[0];

    // Convert JSON string → array (safe)
    if (seller.tags) {
      try {
        seller.tags = JSON.parse(seller.tags);
      } catch {
        seller.tags = []; // fallback
      }
    }

    res.status(200).json({
      success: true,
      data: seller,
    });

  } catch (error) {
    console.log("get single seller error", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};




// ✅ Update Seller (seller_id from params)
// export const updateSeller = async (req, res) => {
//   console.log('update seller api called');
//   console.log('seller_id ', req.params);
//   console.log('data ', req.body);
//   console.log('files', req.files);




//   try {
//     const { seller_id } = req.params; // 👈 seller ID from URL
//     const {
//       user_id,
//       name,
//       mobile,
//       company,
//       email,
//       rocState,
//       activity,
//       price,
//       gst,
//       compliance,
//       incorporation,
//       notes,
//       tags,
//       status,
//     } = req.body;

//     if (!seller_id) {
//       return res.status(400).json({ error: "Seller ID is required in params" });
//     }

//     const sql = `
//       UPDATE sellers SET
//       user_id = ?,
//       name = ?,
//       mobile = ?,
//       company = ?,
//       email = ?,
//       roc_state = ?,
//       activity = ?,
//       price = ?,
//       gst = ?,
//       compliance = ?,
//       incorporation = ?,
//       notes = ?,
//       tags = ?,
//       status = ?
//       WHERE seller_id = ?
//     `;

//     const finalUserId = null


//     const [updateRes] = await pool.execute(sql, [
//       finalUserId,
//       name,
//       mobile,
//       company,
//       email,
//       rocState,
//       activity,
//       price,
//       gst,
//       compliance,
//       incorporation,
//       notes,
//       JSON.stringify(tags), // convert to JSON string
//       status || "accept",
//       seller_id,
//     ]);

//     if (updateRes.affectedRows === 0) {
//       return res.status(404).json({ error: "Seller not found!" });
//     }

//     res.status(200).json({
//       message: "Seller Updated Successfully 🔄",
//       seller_id,
//     });

//   } catch (err) {
//     console.log("❌ Update Seller Error:", err);
//     res.status(500).json({ error: "Server Error" });
//   }
// };

export const updateSeller = async (req, res) => {
  console.log("🚀 Update Seller API Called");
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  try {
    const { seller_id } = req.params;

    if (!seller_id) {
      return res.status(400).json({ error: "Seller ID required!" });
    }

    // STEP 1: Fetch existing seller data first
    const [sellerData] = await pool.execute(
      "SELECT documents FROM sellers WHERE seller_id = ?",
      [seller_id]
    );

    if (sellerData.length === 0) {
      return res.status(404).json({ error: "Seller Not Found!" });
    }

    const oldDocuments =
      sellerData[0].documents ? JSON.parse(sellerData[0].documents) : [];

    // STEP 2: Push new documents if uploaded
    let updatedDocuments = [...oldDocuments];
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((file) => file.filename);
      updatedDocuments = [...oldDocuments, ...newFiles];
    }



    // STEP 3: Update DB query
    const sql = `
      UPDATE sellers SET
        user_id = NULL,
        name = ?,
        mobile = ?,
        company = ?,
        email = ?,
        roc_state = ?,
        activity = ?,
        price = ?,
        gst = ?,
        compliance = ?,
        incorporation = ?,
        notes = ?,
        tags = ?,
        status = ?,
        documents = ?
      WHERE seller_id = ?
    `;

    const {
      name,
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
      status,
    } = req.body;

    const [result] = await pool.execute(sql, [
      name,
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
      tags ? JSON.stringify(tags) : "[]",
      status || "accept",
      JSON.stringify(updatedDocuments),
      seller_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Seller Update Failed" });
    }

    res.status(200).json({
      message: "Seller Updated Successfully 🚀",
      seller_id,
      documents: updatedDocuments,
    });

  } catch (err) {
    console.log("❌ Update Seller Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};





// ✅ Update Seller Status
export const updateSellerStatus = async (req, res) => {
  console.log('id seller post ', req.params.id);

  try {
    const { id } = req.params;         // this is seller_id
    const { status } = req.body;

    const [result] = await pool.execute(
      "UPDATE sellers SET status = ? WHERE seller_id = ?",  // ✅ FIX HERE
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({
      message: "✅ Seller status updated successfully",
      seller_id: id,
      status,
    });
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


// ✅ Delete Buyer
export const deleteSeller = async (req, res) => {
  const { seller_id } = req.params;

  try {
    await pool.execute("DELETE FROM sellers WHERE seller_id = ?", [seller_id]);
    return res.json({ message: "✅ Seller deleted" });
  } catch (err) {
    console.log("❌ Delete Seller Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};
