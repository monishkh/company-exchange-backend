import express from "express";
import {
  createBuyer,
  getBuyersByUser,
  getBuyerById,
  deleteBuyer,
  getAllBuyersAdmin,
  updateBuyerStatus,
  getApprovedBuyersForUser,
} from "../controllers/buyerController.js";

const router = express.Router();

// ----------------- Buyer Routes -----------------

// Create a new buyer post
router.post("/create", createBuyer);

// Admin: Get all buyers (paginated)
router.get("/all", getAllBuyersAdmin);

// User: Get approved buyers
router.get("/approved", getApprovedBuyersForUser);

// User: Get all buyers by a specific user
router.get("/user/:userId", getBuyersByUser);

// Get single buyer by ID (dynamic route, must be last among GET routes)
router.get("/:id", getBuyerById);

// Delete buyer by ID
router.delete("/:id", deleteBuyer);

// Update buyer status
router.put("/:id/status", updateBuyerStatus);

export default router;
