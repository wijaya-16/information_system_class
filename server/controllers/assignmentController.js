import pool from "../config/db.js";

// Ambil semua tugas
export const getAssignments = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM assignments ORDER BY id DESC",
    );
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data tugas", error: error.message });
  }
};

// Tambah tugas baru

export const createAssignment = async (req, res) => {
  const { title, course, deadline, description, file_url } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO assignments (title, course, deadline, description, file_url) VALUES (?, ?, ?, ?, ?)",
      [title, course, deadline, description || "", file_url || ""],
    );
    res.status(201).json({
      id: result.insertId,
      title,
      course,
      deadline,
      description,
      file_url,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan tugas", error: error.message });
  }
};

// UPDATE ASSIGNMENT (Memperbarui data ke MySQL)
export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const { title, course, deadline, description, file_url } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE assignments SET title = ?, course = ?, deadline = ?, description = ?, file_url = ? WHERE id = ?",
      [title, course, deadline, description || "", file_url || "", id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Tugas tidak ditemukan" });
    }

    res.json({ message: "Tugas berhasil diperbarui di MySQL" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal memperbarui data tugas", error: error.message });
  }
};

// DELETE ASSIGNMENT
export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM assignments WHERE id = ?", [id]);
    res.json({ message: "Tugas berhasil dihapus dari MySQL" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menghapus tugas", error: error.message });
  }
};
