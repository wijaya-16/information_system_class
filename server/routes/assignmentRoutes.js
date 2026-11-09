import express from "express";
import {
  getAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../controllers/assignmentController.js";

// ✅ Wajib '../' (dua titik di awal, TANPA slash di paling depan)
import { upload } from "./middleware/uploadMiddleware.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAssignments);
router.post("/", verifyToken, isAdmin, upload.single("file"), createAssignment);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("file"),
  updateAssignment,
);
router.delete("/:id", verifyToken, isAdmin, deleteAssignment);

export default router;
