import express from "express";
import { createSeller, getAllSellersForAdmin, getApprovedSellersForUser, getSellersByUser, updateSellerStatus } from "../controllers/sellerController.js";

const router = express.Router();

// Create seller
router.post("/create", createSeller);

// Get all sellers
router.get("/", getAllSellersForAdmin);
router.get("/getApprovedSellers", getApprovedSellersForUser);

// Get sellers by user
router.get("/user/:userId", getSellersByUser);

// 🔹 New Route
router.put("/seller/:id/status", updateSellerStatus);

export default router;