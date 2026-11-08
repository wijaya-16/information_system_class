import express from "express";
import {
  getMaterialsByCourse,
  createMaterial,
} from "../controllers/materialController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", getMaterialsByCourse);
router.post("/", verifyToken, upload.single("file"), createMaterial);

export default router;
