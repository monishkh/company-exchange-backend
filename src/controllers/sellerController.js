import { connection } from "../config/db.js";
import nodemailer from "nodemailer";

// ✅ Create Seller Posts
export const createSeller = (req, res) => {
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

  // Validation
  if (!mobile || !company || !email) {
    return res
      .status(400)
      .json({ error: "Mobile, Company, and Email are required" });
  }

  // ✅ Insert Seller into DB
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

      const sellerId = results.insertId;

      // ✅ Get User Email from users table
      const userSql = `SELECT fullname, email FROM users WHERE id = ? LIMIT 1`;
      connection.query(userSql, [user_id], (userErr, userRes) => {
        if (userErr || userRes.length === 0) {
          console.error("⚠️ User not found for email sending");
          return res.status(201).json({
            message: "✅ Seller created (email not sent, user not found)",
            sellerId,
          });
        }

        const fullName = userRes[0].fullname;
        const userEmail = userRes[0].email;

        // ✅ Setup Nodemailer
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "monishkhan2409@gmail.com", // apna gmail ya smtp user
            pass: "ojts svwo dsaz kjsv", // app password (not gmail login password)
          },
        });

        // ✅ Mail content
        const mailOptions = {
          from: "monishkhan2409@gmail.com",
          to: userEmail,
          subject: "Your Seller Post is Created",
          html: `
            <p>Hello ${fullName},</p>
            <p>Your seller post has been successfully created with ID: <b>${sellerId}</b>.</p>
            <p>Status: Pending</p>
            <p>Thank you for using our platform!</p>
          `,
        };

        // ✅ Send email
        transporter.sendMail(mailOptions, (mailErr, info) => {
          if (mailErr) {
            console.error("❌ Email error:", mailErr);
          } else {
            console.log("✅ Email sent:", info.response);
          }
        });

        // ✅ Final response
        res.status(201).json({
          message: "✅ Seller created",
          sellerId,
        });
      });
    }
  );
};

export const getAllSellersForAdmin = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  // Step 1: Total sellers count
  connection.query(
    "SELECT COUNT(*) as total FROM sellers",
    (err, countResult) => {
      if (err) {
        console.error("Error fetching count:", err);
        return res.status(500).json({ error: "Server error" });
      }

      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      // Step 2: Fetch sellers for current page
      connection.query(
        "SELECT * FROM sellers ORDER BY id DESC LIMIT ? OFFSET ?",
        [limit, offset],
        (err, sellers) => {
          if (err) {
            console.error("Error fetching sellers:", err);
            return res.status(500).json({ error: "Server error" });
          }

          // Step 3: Return JSON response
          res.json({
            currentPage: page,
            totalPages,
            totalItems,
            data: sellers,
          });
        }
      );
    }
  );
};

// ✅ Get only approved sellers (for users)
// export const getApprovedSellersForUser = (req, res) => {
//   // Log incoming filter values
//   console.log("Filters received from frontend:", req.query);
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 5;
//   const offset = (page - 1) * limit;

//   // Step 1: Count approved sellers
//   connection.query(
//     "SELECT COUNT(*) as total FROM sellers WHERE status = 'approved'",
//     (err, countResult) => {
//       if (err) {
//         console.error("Error fetching count:", err);
//         return res.status(500).json({ error: "Server error" });
//       }

//       const totalItems = countResult[0].total;
//       const totalPages = Math.ceil(totalItems / limit);

//       // Step 2: Fetch approved sellers for current page
//       connection.query(
//         "SELECT * FROM sellers WHERE status = 'approved' ORDER BY id DESC LIMIT ? OFFSET ?",
//         [limit, offset],
//         (err, sellers) => {
//           if (err) {
//             console.error("Error fetching sellers:", err);
//             return res.status(500).json({ error: "Server error" });
//           }

//           // Step 3: Return JSON response
//           res.json({
//             currentPage: page,
//             totalPages,
//             totalItems,
//             data: sellers,
//           });
//         }
//       );
//     }
//   );
// };

export const getApprovedSellersForUser = (req, res) => {
  console.log('getApprovedSellersForUser Api called');
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const offset = (page - 1) * limit;

  // ---------------- GET FILTER VALUES ----------------
  const searchCompany = (req.query.searchCompany || "").trim();
  const rocState = (req.query.rocState || "").trim();
  const activity = (req.query.activity || "").trim();
  const gst = (req.query.gst || "").trim().toUpperCase();
  const compliance = (req.query.compliance || "").trim().toUpperCase();
  const minPrice = parseFloat(req.query.minPrice) || 0;
  const maxPrice = parseFloat(req.query.maxPrice) || 1000000000;

  const companyAge = parseInt(req.query.companyAge) || 0;

  const documents = (req.query.document || "").trim();
  const documentList =
    documents.length > 0 ? documents.split(",").map((d) => d.trim()) : [];

  const normalizedDocList =
    documentList.length > 0 ? [...documentList].sort() : [];
  const docJson =
    normalizedDocList.length > 0 ? JSON.stringify(normalizedDocList) : "";

  // ---------------- COUNT QUERY ----------------
  let countQuery =
    "SELECT COUNT(*) as total FROM sellers WHERE status = 'approved'";
  const countParams = [];

  if (searchCompany) {
    countQuery += " AND company LIKE ?";
    countParams.push(`%${searchCompany}%`);
  }
  if (rocState) {
    countQuery += " AND roc_state LIKE ?";
    countParams.push(`%${rocState}%`);
  }
  if (activity) {
    countQuery += " AND activity LIKE ?";
    countParams.push(`%${activity}%`);
  }
  if (gst) {
    countQuery += " AND gst LIKE ?";
    countParams.push(`%${gst}%`);
  }
  if (compliance) {
    countQuery += " AND compliance LIKE ?";
    countParams.push(`%${compliance}%`);
  }
  if (companyAge > 0) {
    countQuery += " AND company_age >= ?";
    countParams.push(companyAge);
  }

  // Price filter
  countQuery += " AND price BETWEEN ? AND ?";
  countParams.push(minPrice, maxPrice);

  if (docJson) {
    countQuery += " AND JSON_LENGTH(tags) = ? AND JSON_CONTAINS(tags, ?)";
    countParams.push(normalizedDocList.length, docJson);
  }

  connection.query(countQuery, countParams, (err, countResult) => {
    if (err) {
      console.error("Error fetching count:", err);
      return res.status(500).json({ error: "Server error" });
    }

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // ---------------- DATA QUERY ----------------
    let dataQuery = "SELECT * FROM sellers WHERE status = 'approved'";
    const dataParams = [];

    if (searchCompany) {
      dataQuery += " AND company LIKE ?";
      dataParams.push(`%${searchCompany}%`);
    }
    if (rocState) {
      dataQuery += " AND roc_state LIKE ?";
      dataParams.push(`%${rocState}%`);
    }
    if (activity) {
      dataQuery += " AND activity LIKE ?";
      dataParams.push(`%${activity}%`);
    }
    if (gst) {
      dataQuery += " AND gst LIKE ?";
      dataParams.push(`%${gst}%`);
    }
    if (compliance) {
      dataQuery += " AND compliance LIKE ?";
      dataParams.push(`%${compliance}%`);
    }
    if (companyAge > 0) {
      dataQuery += " AND company_age >= ?";
      dataParams.push(companyAge);
    }

    // Price filter
    dataQuery += " AND price BETWEEN ? AND ?";
    dataParams.push(minPrice, maxPrice);

    if (docJson) {
      dataQuery += " AND JSON_LENGTH(tags) = ? AND JSON_CONTAINS(tags, ?)";
      dataParams.push(normalizedDocList.length, docJson);
    }

    dataQuery += " ORDER BY id DESC LIMIT ? OFFSET ?";
    dataParams.push(limit, offset);

    connection.query(dataQuery, dataParams, (err, sellers) => {
      if (err) {
        console.error("Error fetching sellers:", err);
        return res.status(500).json({ error: "Server error" });
      }

      res.json({
        currentPage: page,
        totalPages,
        totalItems,
        data: sellers,
      });
    });
  });
};

// ✅ Update Seller Status
export const updateSellerStatus = (req, res) => {
  const { id } = req.params; // URL me id
  const { status } = req.body; // Body me status

  if (!id || !status) {
    return res.status(400).json({ error: "Seller ID and Status are required" });
  }

  const sql = "UPDATE sellers SET status = ? WHERE id = ?";
  connection.query(sql, [status, id], (err, result) => {
    if (err) {
      console.error("❌ Error updating status:", err);
      return res.status(500).json({ error: "Failed to update status" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({ message: "✅ Seller status updated", id, status });
  });
};

// Get sellers by user
export const getSellersByUser = (req, res) => {
  const { userId } = req.params;
  connection.query(
    "SELECT * FROM sellers WHERE user_id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("❌ Error fetching sellers by user:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch sellers by user" });
      }
      res.json(results);
    }
  );
};
