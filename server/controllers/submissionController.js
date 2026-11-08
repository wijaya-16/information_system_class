import pool from "../config/db.js";

export const getSubmissions = async (req, res) => {
  try {
    const { assignment_id } = req.query;
    let query = "SELECT * FROM submissions";
    const params = [];

    if (assignment_id) {
      query += " WHERE assignment_id = ?";
      params.push(assignment_id);
    }
    query += " ORDER BY submitted_at DESC";

    const [submissions] = await pool.query(query, params);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data pengumpulan tugas",
      error: error.message,
    });
  }
};

export const createSubmission = async (req, res) => {
  const { assignmentId, nim, studentName, note, link, file_url } = req.body;

  if (!assignmentId || !nim || !studentName) {
    return res
      .status(400)
      .json({ message: "ID Tugas, NIM, dan Nama Mahasiswa wajib diisi" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO submissions (assignment_id, nim, student_name, note, file_url) 
       VALUES (?, ?, ?, ?, ?)`,
      [assignmentId, nim, studentName, note || null, link || file_url || null],
    );

    res.status(201).json({
      message: "Tugas berhasil dikumpulkan",
      id: result.insertId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengumpulkan tugas", error: error.message });
  }
};
