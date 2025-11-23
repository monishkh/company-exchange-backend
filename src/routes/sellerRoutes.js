import express from "express";
import { createSeller, deleteSeller, deleteSellerFile, getAllSellersForAdmin, getApprovedSellersForUser, getSellersByUser, getSingleSeller, updateSeller, updateSellerStatus } from "../controllers/sellerController.js";
import upload from "../middlewares/upload.js";

const router = express.Router();

// Create seller
router.post("/create", upload.array("documents", 10), createSeller);

router.post("/seller/:seller_id/delete-file", deleteSellerFile);


// Get single seller post
router.get("/seller/:seller_id", getSingleSeller);


// Get all sellers
router.get("/", getAllSellersForAdmin);
router.get("/getApprovedSellers", getApprovedSellersForUser);

// Get sellers by user
// router.get("/user/:userId", getSellersByUser);

// Update seller post (EDIT)
router.put("/seller/:seller_id", upload.array("documents", 10), updateSeller);

// 🔹 New Route
router.put("/seller/:id/status", updateSellerStatus);

// Delete seller
router.delete("/seller/:seller_id", deleteSeller);





export default router;