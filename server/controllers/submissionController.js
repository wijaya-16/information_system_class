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
    query += " ORDER BY id DESC";

    const [rows] = await pool.query(query, params);
    const submissions = rows.map(r => ({
      id: r.id,
      assignmentId: r.assignment_id,
      nim: r.nim,
      studentName: r.student_name,
      note: r.note || "",
      link: r.link || r.file_url || "",
      submittedAt: r.submitted_at ? (typeof r.submitted_at === 'string' ? r.submitted_at : r.submitted_at.toISOString().split("T")[0]) : "",
    }));
    res.json(submissions);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data pengumpulan tugas",
      error: error.message,
    });
  }
};

export const createSubmission = async (req, res) => {
  const { id, assignmentId, nim, studentName, note, link, file_url, submittedAt } = req.body;

  if (!assignmentId || !nim || !studentName) {
    return res
      .status(400)
      .json({ message: "ID Tugas, NIM, dan Nama Mahasiswa wajib diisi" });
  }

  const subId = id || Date.now();
  const subDate = submittedAt || new Date().toISOString().split("T")[0];
  const fileOrLink = link || file_url || null;

  try {
    await pool.query(
      `INSERT INTO submissions (id, assignment_id, nim, student_name, note, link, file_url, submitted_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE note=VALUES(note), link=VALUES(link), file_url=VALUES(file_url), submitted_at=VALUES(submitted_at)`,
      [subId, assignmentId, nim, studentName, note || null, fileOrLink, fileOrLink, subDate]
    );

    res.status(201).json({
      message: "Tugas berhasil dikumpulkan ke MySQL",
      id: subId,
      assignmentId,
      nim,
      studentName,
      note,
      link: fileOrLink,
      submittedAt: subDate,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengumpulkan tugas", error: error.message });
  }
};
