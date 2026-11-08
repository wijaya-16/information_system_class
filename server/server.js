import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import { upload } from "./middleware/uploadMiddleware.js"; // <-- Impor upload middleware

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "./.env") });

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Endpoint API Utama
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/submissions", submissionRoutes);

// Endpoint umum untuk unggah berkas tunggal (Mandiri)
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Tidak ada file yang diunggah" });
  }
  const file_url = `/uploads/${req.file.filename}`;
  res.json({ file_url });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server berjalan di http://localhost:${PORT}`),
);
