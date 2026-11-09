import express from "express";
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialController.js";
import { verifyToken, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getMaterials);
router.post("/", verifyToken, isAdmin, createMaterial);
router.put("/:id", verifyToken, isAdmin, updateMaterial);
router.delete("/:id", verifyToken, isAdmin, deleteMaterial);

export default router;
