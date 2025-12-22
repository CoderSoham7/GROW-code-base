import express from "express";
import CodingController from "../Controllers/CodingController.js";
import { Protect } from "../Middlewares/Auth.js";

const router = express.Router();

/**
 * Coding Routes
 * These routes handle the coding assessment functions
 */

// Handle coding responses and get next question
router.post("/response", Protect, CodingController.handleCodingResponse);

// Initialize a coding interview with first question
router.post("/initialize", Protect, CodingController.initializeCodingInterview);

// Add option for debugging
router.get("/test", (req, res) => {
  res.json({ status: "Coding routes working" });
});

export default router;