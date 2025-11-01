import { pool } from "../config/db.js";

// ✅ Approve / Reject Seller Post
export const approveSeller = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accept", "reject", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const sql = "UPDATE sellers SET status = ? WHERE id = ?";
    const [result] = await pool.execute(sql, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({ message: `✅ Seller status updated to ${status}` });
  } catch (err) {
    console.error("❌ Error updating seller:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Approve / Reject Buyer Post
export const approveBuyer = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accept", "reject", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  try {
    const sql = "UPDATE buyers SET status = ? WHERE id = ?";
    const [result] = await pool.execute(sql, [status, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    res.json({ message: `✅ Buyer status updated to ${status}` });
  } catch (err) {
    console.error("❌ Error updating buyer:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete Seller Post
export const deleteSeller = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "DELETE FROM sellers WHERE id = ?";
    const [result] = await pool.execute(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Seller not found" });
    }

    res.json({ message: "🗑️ Seller deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting seller:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// ✅ Delete Buyer Post
export const deleteBuyer = async (req, res) => {
  const { id } = req.params;

  try {
    const sql = "DELETE FROM buyers WHERE id = ?";
    const [result] = await pool.execute(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    res.json({ message: "🗑️ Buyer deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting buyer:", err);
    res.status(500).json({ error: "Server error" });
  }
};
