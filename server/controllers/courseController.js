import pool from "../config/db.js";

export const getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query("SELECT * FROM courses ORDER BY id ASC");
    res.json(courses);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data mata kuliah",
      error: error.message,
    });
  }
};

export const getCourseById = async (req, res) => {
  const { id } = req.params;
  try {
    const [courses] = await pool.query("SELECT * FROM courses WHERE id = ?", [id]);
    if (courses.length === 0) {
      return res.status(404).json({ message: "Mata kuliah tidak ditemukan" });
    }
    res.json(courses[0]);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil detail mata kuliah",
      error: error.message,
    });
  }
};

export const createCourse = async (req, res) => {
  const { id, name, lecturer, credits, category, color, code, semester, description } = req.body;
  try {
    const courseId = id || Date.now();
    await pool.query(
      `INSERT INTO courses (id, code, name, lecturer, credits, semester, category, color, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), lecturer=VALUES(lecturer), credits=VALUES(credits), category=VALUES(category), color=VALUES(color)`,
      [
        courseId,
        code || null,
        name,
        lecturer || "",
        credits || 3,
        semester || "Semester 3",
        category || "Teori",
        color || "bg-blue-500",
        description || "",
      ]
    );
    res.status(201).json({
      message: "Mata kuliah berhasil ditambahkan",
      id: courseId,
      name,
      lecturer,
      credits,
      category,
      color,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan mata kuliah", error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { name, lecturer, credits, category, color, description } = req.body;
  try {
    const [result] = await pool.query(
      `UPDATE courses 
       SET name = COALESCE(?, name), 
           lecturer = COALESCE(?, lecturer), 
           credits = COALESCE(?, credits), 
           category = COALESCE(?, category), 
           color = COALESCE(?, color),
           description = COALESCE(?, description)
       WHERE id = ?`,
      [name, lecturer, credits, category, color, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Mata kuliah tidak ditemukan" });
    }
    res.json({ message: "Mata kuliah berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui mata kuliah", error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM courses WHERE id = ?", [id]);
    res.json({ message: "Mata kuliah berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus mata kuliah", error: error.message });
  }
};
