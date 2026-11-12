import pool from "../config/db.js";

export const getAssignments = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM assignments ORDER BY id ASC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data tugas",
      error: error.message,
    });
  }
};

export const createAssignment = async (req, res) => {
  const { id, title, course, deadline, description, lecturer, status, file_url } = req.body;
  const assignId = id || Date.now();

  try {
    await pool.query(
      `INSERT INTO assignments (id, title, course, deadline, description, lecturer, status, file_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), course=VALUES(course), deadline=VALUES(deadline), description=VALUES(description), lecturer=VALUES(lecturer), status=VALUES(status)`,
      [
        assignId,
        title,
        course || "",
        deadline || "",
        description || "",
        lecturer || "",
        status || "Aktif",
        file_url || null,
      ]
    );
    res.status(201).json({
      message: "Tugas berhasil ditambahkan",
      id: assignId,
      title,
      course,
      deadline,
      description,
      lecturer,
      status: status || "Aktif",
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan tugas", error: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { title, course, deadline, description, lecturer, status, file_url } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE assignments 
       SET title = COALESCE(?, title), 
           course = COALESCE(?, course), 
           deadline = COALESCE(?, deadline), 
           description = COALESCE(?, description),
           lecturer = COALESCE(?, lecturer),
           status = COALESCE(?, status),
           file_url = COALESCE(?, file_url) 
       WHERE id = ?`,
      [title, course, deadline, description, lecturer, status, file_url, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tugas tidak ditemukan" });
    }

    res.json({ message: "Tugas berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui data tugas", error: error.message });
  }
};

export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM assignments WHERE id = ?", [id]);
    res.json({ message: "Tugas berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus tugas", error: error.message });
  }
};
