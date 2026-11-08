import express from "express";
import {
  getAssignments,
  createAssignment,
} from "../controllers/assignmentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getAssignments);
router.post("/", verifyToken, upload.single("file"), createAssignment);

export default router;
