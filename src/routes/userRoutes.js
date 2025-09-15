import express from "express";
import { adminLogin, loginUser, registerUser } from "../controllers/userController.js";

const router = express.Router();

// POST /api/users/register
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", adminLogin)

export default router;
