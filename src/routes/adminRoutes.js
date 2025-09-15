import express from "express";
import { checkAdmin } from "../middlewares/checkAdmin.js";
import { approveSeller, approveBuyer, deleteSeller, deleteBuyer } from "../controllers/adminController.js";

const router = express.Router();

// Approve/reject seller post
router.put("/sellers/:id/status", checkAdmin, approveSeller);

// Approve/reject buyer post
router.put("/buyers/:id/status", checkAdmin, approveBuyer);

// Delete seller post
router.delete("/sellers/:id", checkAdmin, deleteSeller);

// Delete buyer post
router.delete("/buyers/:id", checkAdmin, deleteBuyer);

export default router;
