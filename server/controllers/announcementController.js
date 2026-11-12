import pool from "../config/db.js";

export const getAnnouncements = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM announcements ORDER BY id ASC");
    // Normalize boolean for important
    const announcements = rows.map(r => ({
      ...r,
      important: !!r.important,
    }));
    res.json(announcements);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data pengumuman",
      error: error.message,
    });
  }
};

export const createAnnouncement = async (req, res) => {
  const { id, title, category, course, date, author, important, content } = req.body;
  const annId = id || Date.now();

  try {
    await pool.query(
      `INSERT INTO announcements (id, title, category, course, date, author, important, content) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), important=VALUES(important)`,
      [
        annId,
        title,
        category || "Akademik",
        course || "",
        date || new Date().toISOString().split("T")[0],
        author || "Admin",
        important ? 1 : 0,
        content || "",
      ]
    );
    res.status(201).json({
      message: "Pengumuman berhasil ditambahkan",
      id: annId,
      title,
      content,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan pengumuman", error: error.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, category, course, date, author, important, content } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE announcements 
       SET title = COALESCE(?, title),
           category = COALESCE(?, category),
           course = COALESCE(?, course),
           date = COALESCE(?, date),
           author = COALESCE(?, author),
           important = COALESCE(?, important),
           content = COALESCE(?, content)
       WHERE id = ?`,
      [title, category, course, date, author, important !== undefined ? (important ? 1 : 0) : null, content, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengumuman tidak ditemukan" });
    }
    res.json({ message: "Pengumuman berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui pengumuman", error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM announcements WHERE id = ?", [id]);
    res.json({ message: "Pengumuman berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus pengumuman", error: error.message });
  }
};

