import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import materialRoutes from "./routes/materialRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import photoRoutes from "./routes/photoRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import { upload } from "./middleware/upLoadMiddleware.js";
import pool from "./config/db.js";

// Pastikan tipe kolom url di galeri dan photo di members dapat menampung data gambar & video
(async () => {
  try {
    try { await pool.query("ALTER TABLE assignments ADD COLUMN file_url LONGTEXT NULL"); } catch {}
    try { await pool.query("ALTER TABLE submissions ADD COLUMN file_url LONGTEXT NULL"); } catch {}
    try { await pool.query("ALTER TABLE materials ADD COLUMN file_url LONGTEXT NULL"); } catch {}
    await pool.query("ALTER TABLE class_photos MODIFY COLUMN url LONGTEXT NOT NULL");
    await pool.query("ALTER TABLE members_list MODIFY COLUMN photo LONGTEXT NULL");
    await pool.query("ALTER TABLE materials MODIFY COLUMN file_url LONGTEXT NULL");
    await pool.query("ALTER TABLE assignments MODIFY COLUMN file_url LONGTEXT NULL");
    await pool.query("ALTER TABLE submissions MODIFY COLUMN file_url LONGTEXT NULL");
    await pool.query("ALTER TABLE submissions MODIFY COLUMN link LONGTEXT NULL");
    try {
      await pool.query("ALTER TABLE class_photos ADD COLUMN type VARCHAR(20) DEFAULT 'image'");
    } catch {
      // Abaikan jika kolom type sudah ada
    }
    // Bersihkan foto profil member agar galeri murni berisi kegiatan kelas
    await pool.query("DELETE FROM class_photos WHERE title LIKE 'Foto Profil%'");
    // Bersihkan foto mock manual unsplash agar tabel murni berisi foto hasil upload admin
    await pool.query("DELETE FROM class_photos WHERE url LIKE '%images.unsplash.com%'");
  } catch (err) {
    // Abaikan jika database belum siap
  }
})();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "./.env") });

const app = express();

app.use(cors());
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: true, limit: "150mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server MySQL Laragon Aktif" });
});

// Endpoint API Utama
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/submissions", submissionRoutes);

// Endpoint umum untuk upload berkas tunggal (Dokumen, Gambar, Video, Tugas)
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Tidak ada file yang diunggah" });
  }
  const file_url = `/uploads/${req.file.filename}`;
  res.json({
    file_url,
    url: file_url,
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server Backend MySQL berjalan di http://localhost:${PORT}`);
});
