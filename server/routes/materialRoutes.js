import express from "express";
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../controllers/materialController.js";
import { upload } from "../middleware/upLoadMiddleware.js";

const router = express.Router();

router.get("/", getMaterials);
router.post("/", upload.single("file"), createMaterial);
router.put("/:id", upload.single("file"), updateMaterial);
router.delete("/:id", deleteMaterial);

export default router;
