import pool from "../config/db.js";

export const getMaterials = async (req, res) => {
  try {
    const [materials] = await pool.query("SELECT * FROM materials ORDER BY id ASC");
    res.json(materials);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data materi",
      error: error.message,
    });
  }
};

export const createMaterial = async (req, res) => {
  const { id, title, course, type, size, date, semester, lecturer, description, file_url } = req.body;
  const matId = id || Date.now();
  const file = req.file ? `/uploads/${req.file.filename}` : (file_url || null);

  try {
    await pool.query(
      `INSERT INTO materials (id, title, course, type, size, date, semester, lecturer, description, file_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), course=VALUES(course), file_url=VALUES(file_url)`,
      [
        matId,
        title,
        course || "",
        type || "PDF",
        size || "2.5MB",
        date || new Date().toISOString().split("T")[0],
        semester || "Semester 3",
        lecturer || "",
        description || "",
        file,
      ]
    );
    res.status(201).json({
      message: "Materi berhasil ditambahkan",
      id: matId,
      title,
      course,
      file_url: file,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan materi", error: error.message });
  }
};

export const updateMaterial = async (req, res) => {
  const { id } = req.params;
  const { title, course, type, size, date, semester, lecturer, description, file_url } = req.body;
  const file = req.file ? `/uploads/${req.file.filename}` : file_url;

  try {
    const [result] = await pool.query(
      `UPDATE materials 
       SET title = COALESCE(?, title),
           course = COALESCE(?, course),
           type = COALESCE(?, type),
           size = COALESCE(?, size),
           date = COALESCE(?, date),
           semester = COALESCE(?, semester),
           lecturer = COALESCE(?, lecturer),
           description = COALESCE(?, description),
           file_url = COALESCE(?, file_url)
       WHERE id = ?`,
      [title, course, type, size, date, semester, lecturer, description, file, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Materi tidak ditemukan" });
    }
    res.json({ message: "Materi berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui materi", error: error.message });
  }
};

export const deleteMaterial = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM materials WHERE id = ?", [id]);
    res.json({ message: "Materi berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus materi", error: error.message });
  }
};
