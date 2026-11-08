import pool from "../config/db.js";

// Ambil semua tugas
export const getAssignments = async (req, res) => {
  const { course_id } = req.query;
  try {
    let query = "SELECT * FROM assignments";
    const params = [];

    if (course_id) {
      query += " WHERE course_id = ?";
      params.push(course_id);
    }

    query += " ORDER BY deadline ASC";
    const [assignments] = await pool.query(query, params);
    res.json(assignments);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data tugas", error: error.message });
  }
};

// Tambah tugas baru
export const createAssignment = async (req, res) => {
  const { course_id, title, description, deadline } = req.body;
  const file_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const [result] = await pool.query(
      "INSERT INTO assignments (course_id, title, description, deadline, file_url) VALUES (?, ?, ?, ?, ?)",
      [course_id, title, description, deadline, file_url],
    );
    res
      .status(201)
      .json({ message: "Tugas berhasil dibuat", id: result.insertId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal membuat tugas", error: error.message });
  }
};
