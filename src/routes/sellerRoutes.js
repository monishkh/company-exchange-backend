import express from "express";
import { createSeller, getAllSellers, getSellersByUser } from "../controllers/sellerController.js";

const router = express.Router();

// Create seller
router.post("/create", createSeller);

// Get all sellers
router.get("/", getAllSellers);

// Get sellers by user
router.get("/user/:userId", getSellersByUser);

export default router;