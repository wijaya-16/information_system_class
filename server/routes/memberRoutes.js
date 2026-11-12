import express from "express";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember,
} from "../controllers/memberController.js";

const router = express.Router();

router.get("/", getMembers);
router.post("/", createMember);
router.put("/:oldCode", updateMember);
router.delete("/:code", deleteMember);

export default router;

