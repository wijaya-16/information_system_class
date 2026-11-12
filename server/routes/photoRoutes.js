import express from "express";
import {
  getPhotos,
  createPhoto,
  updatePhoto,
  deletePhoto,
  setHeroPhoto,
} from "../controllers/photoController.js";

const router = express.Router();

router.get("/", getPhotos);
router.post("/", createPhoto);
router.put("/:id", updatePhoto);
router.delete("/:id", deletePhoto);
router.patch("/:id/hero", setHeroPhoto);

export default router;

