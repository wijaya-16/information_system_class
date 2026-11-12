import express from "express";
import {
  getSubmissions,
  createSubmission,
} from "../controllers/submissionController.js";

const router = express.Router();

router.get("/", getSubmissions);
router.post("/", createSubmission);

export default router;
