import express from "express";
import {
  getSubmissions,
  createSubmission,
} from "../controllers/submissionController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Mahasiswa / Admin yang terautentikasi dapat melihat & mengumpulkan tugas
router.get("/", verifyToken, getSubmissions);
router.post("/", verifyToken, createSubmission);

export default router;
