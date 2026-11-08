import express from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
} from "../controllers/courseController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCourses);
router.get("/:id", getCourseById);
router.post("/", verifyToken, createCourse);

export default router;
