import pool from "../config/db.js";

export const getPhotos = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM class_photos ORDER BY id DESC");
    const photos = rows.map(r => ({
      ...r,
      type: r.type || (r.url && (r.url.startsWith('data:video') || /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(r.url)) ? 'video' : 'image'),
      isHero: !!r.is_hero,
    }));
    res.json(photos);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data foto kelas",
      error: error.message,
    });
  }
};

export const createPhoto = async (req, res) => {
  const { id, url, title, caption, date, category, isHero, type } = req.body;
  const photoId = id || Date.now();
  const mediaType = type || (url && (url.startsWith('data:video') || /\.(mp4|webm|mov|m4v|ogg)(\?.*)?$/i.test(url)) ? 'video' : 'image');

  try {
    if (isHero) {
      await pool.query("UPDATE class_photos SET is_hero = 0");
    }

    await pool.query(
      `INSERT INTO class_photos (id, url, title, caption, date, category, is_hero, type) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title=VALUES(title), url=VALUES(url), caption=VALUES(caption), category=VALUES(category), date=VALUES(date), is_hero=VALUES(is_hero), type=VALUES(type)`,
      [
        photoId,
        url,
        title,
        caption || "",
        date || new Date().toISOString().split("T")[0],
        category || "Praktikum & Perkuliahan",
        isHero ? 1 : 0,
        mediaType,
      ]
    );

    res.status(201).json({
      message: "Media berhasil ditambahkan",
      id: photoId,
      url,
      title,
      type: mediaType,
      isHero: !!isHero,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan foto / video", error: error.message });
  }
};

export const updatePhoto = async (req, res) => {
  const { id } = req.params;
  const { url, title, caption, date, category, isHero, type } = req.body;

  try {
    if (isHero) {
      await pool.query("UPDATE class_photos SET is_hero = 0");
    }

    const [result] = await pool.query(
      `UPDATE class_photos 
       SET url = COALESCE(?, url),
           title = COALESCE(?, title),
           caption = COALESCE(?, caption),
           date = COALESCE(?, date),
           category = COALESCE(?, category),
           is_hero = COALESCE(?, is_hero),
           type = COALESCE(?, type)
       WHERE id = ?`,
      [url, title, caption, date, category, isHero !== undefined ? (isHero ? 1 : 0) : null, type, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Foto tidak ditemukan" });
    }
    res.json({ message: "Foto berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui foto", error: error.message });
  }
};

export const deletePhoto = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM class_photos WHERE id = ?", [id]);
    res.json({ message: "Foto berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus foto", error: error.message });
  }
};

export const setHeroPhoto = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE class_photos SET is_hero = 0");
    await pool.query("UPDATE class_photos SET is_hero = 1 WHERE id = ?", [id]);
    res.json({ message: "Foto berhasil dijadikan banner utama di beranda" });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengatur banner foto", error: error.message });
  }
};

