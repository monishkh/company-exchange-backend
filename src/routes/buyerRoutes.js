import express from "express";
import {
  createBuyer,
  getBuyersByUser,
  getBuyerById,
  deleteBuyer,
  getAllBuyers,
} from "../controllers/buyerController.js";

const router = express.Router();

// Create buyer post
router.post("/create", createBuyer);

// GET → fetch all buyers
router.get("/", getAllBuyers);

// Get all buyers by user
router.get("/user/:userId", getBuyersByUser);

// Get single buyer by ID
router.get("/:id", getBuyerById);

// Delete buyer
router.delete("/:id", deleteBuyer);

export default router;
