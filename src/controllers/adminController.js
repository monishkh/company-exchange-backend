import { connection } from "../config/db.js";



// ✅ Approve/Reject Seller Post
export const approveSeller = (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'accept', 'reject', 'pending'

  if (!["accept", "reject", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const sql = "UPDATE sellers SET status = ? WHERE id = ?";
  connection.query(sql, [status, id], (err, results) => {
    if (err) {
      console.error("❌ Error updating seller status:", err);
      return res.status(500).json({ error: "Failed to update seller status" });
    }
    res.json({ message: `✅ Seller status updated to ${status}` });
  });
};

// ✅ Approve/Reject Buyer Post
export const approveBuyer = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accept", "reject", "pending"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const sql = "UPDATE buyers SET status = ? WHERE id = ?";
  connection.query(sql, [status, id], (err, results) => {
    if (err) {
      console.error("❌ Error updating buyer status:", err);
      return res.status(500).json({ error: "Failed to update buyer status" });
    }
    res.json({ message: `✅ Buyer status updated to ${status}` });
  });
};

// ✅ Delete Seller Post
export const deleteSeller = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM sellers WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Error deleting seller:", err);
      return res.status(500).json({ error: "Failed to delete seller" });
    }
    res.json({ message: "🗑️ Seller deleted successfully" });
  });
};

// ✅ Delete Buyer Post
export const deleteBuyer = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM buyers WHERE id = ?";
  connection.query(sql, [id], (err, results) => {
    if (err) {
      console.error("❌ Error deleting buyer:", err);
      return res.status(500).json({ error: "Failed to delete buyer" });
    }
    res.json({ message: "🗑️ Buyer deleted successfully" });
  });
};
