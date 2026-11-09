import express from "express";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: Siapa saja yang sudah login/akses web bisa melihat daftar matkul
router.get("/", getCourses);

// Admin Only: Hanya Admin yang bisa menambah, mengedit, dan menghapus matkul
router.post("/", verifyToken, isAdmin, createCourse);
router.put("/:id", verifyToken, isAdmin, updateCourse);
router.delete("/:id", verifyToken, isAdmin, deleteCourse);

export default router;
