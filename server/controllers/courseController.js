import pool from "../config/db.js";

export const getCourses = async (req, res) => {
  try {
    const [courses] = await pool.query(
      "SELECT * FROM courses ORDER BY created_at DESC",
    );
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
    const [courses] = await pool.query("SELECT * FROM courses WHERE id = ?", [
      id,
    ]);
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
  const {
    code,
    name,
    lecturer,
    credits,
    semester,
    schedule_day,
    schedule_time,
    room,
    description,
  } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO courses (code, name, lecturer, credits, semester, schedule_day, schedule_time, room, description) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        name,
        lecturer,
        credits || 3,
        semester || 1,
        schedule_day,
        schedule_time,
        room,
        description,
      ],
    );
    res.status(201).json({
      message: "Mata kuliah berhasil ditambahkan",
      id: result.insertId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal menambahkan mata kuliah", error: error.message });
  }
};
