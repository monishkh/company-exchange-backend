import express from "express";
import cors from "cors";
import { pool } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import sellerRoutes from "./routes/sellerRoutes.js";
import buyerRoutes from "./routes/buyerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
app.use(express.json());

// CORS FIX
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// ⭐ THE REAL FIX (Express v5 global preflight)
app.options("/", cors(corsOptions));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/admin", adminRoutes);

// Test DB
app.get("/test-db", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT NOW() AS now");
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Test DB Error:", err);
    res.status(500).json({ error: "Database test failed" });
  }
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
