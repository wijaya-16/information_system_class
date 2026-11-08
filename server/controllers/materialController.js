import pool from "../config/db.js";

// Ambil semua materi berdasarkan course_id
export const getMaterialsByCourse = async (req, res) => {
  const { course_id } = req.query;
  try {
    let query = "SELECT * FROM materials";
    const params = [];

    if (course_id) {
      query += " WHERE course_id = ?";
      params.push(course_id);
    }

    query += " ORDER BY created_at DESC";
    const [materials] = await pool.query(query, params);
    res.json(materials);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data materi", error: error.message });
  }
};

// Tambah materi baru (Mendukung upload file via Multer)
export const createMaterial = async (req, res) => {
  const { course_id, title, description, external_link } = req.body;
  const file_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      "INSERT INTO materials (course_id, title, description, file_url, external_link) VALUES (?, ?, ?, ?, ?)",
      [course_id, title, description, file_url, external_link],
    );
    res
      .status(201)
      .json({ message: "Materi berhasil ditambahkan", id: result.insertId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan materi", error: error.message });
  }
};
