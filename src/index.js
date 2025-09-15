import express from "express";
import cors from "cors";
import { connection } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import sellerRoutes from './routes/sellerRoutes.js';
import buyerRoutes from "./routes/buyerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/sellers", sellerRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/admin", adminRoutes)

// Test DB route
app.get("/test-db", (req, res) => {
  connection.query("SELECT NOW() AS now", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0]);
  });
});

// Start server
app.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
