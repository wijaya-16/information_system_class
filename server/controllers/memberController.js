import pool from "../config/db.js";

export const getMembers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM members_list ORDER BY code ASC");
    const membersMap = {};
    rows.forEach((r) => {
      membersMap[r.code] = {
        fullname: r.fullname,
        gender: r.gender,
        photo: r.photo || null,
        nim: r.nim || `25SI${r.code}`,
      };
    });
    res.json(membersMap);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data mahasiswa",
      error: error.message,
    });
  }
};

export const createMember = async (req, res) => {
  const { code, fullname, gender, nim, photo } = req.body;
  const memberCode = code ? code.replace(/^25SI/i, "") : "001";
  const standardNim = nim || `25SI${memberCode}`;

  try {
    await pool.query(
      `INSERT INTO members_list (code, fullname, gender, nim, photo) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE fullname=VALUES(fullname), gender=VALUES(gender), photo=VALUES(photo)`,
      [memberCode, fullname, gender || "L", standardNim, photo || null]
    );

    // Also sync to users table
    await pool.query(
      `INSERT INTO users (nim, username, fullname, password, role) 
       VALUES (?, ?, ?, ?, 'student')
       ON DUPLICATE KEY UPDATE fullname=VALUES(fullname)`,
      [standardNim, standardNim, fullname, standardNim]
    );

    res.status(201).json({
      message: "Mahasiswa berhasil ditambahkan",
      code: memberCode,
      fullname,
      nim: standardNim,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal menambahkan mahasiswa", error: error.message });
  }
};

export const updateMember = async (req, res) => {
  const { oldCode } = req.params;
  const { newCode, fullname, gender, nim, photo } = req.body;
  const targetCode = newCode || oldCode;
  const standardNim = nim || `25SI${targetCode}`;

  try {
    if (oldCode !== targetCode) {
      await pool.query("DELETE FROM members_list WHERE code = ?", [oldCode]);
    }

    await pool.query(
      `INSERT INTO members_list (code, fullname, gender, nim, photo) 
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE fullname=VALUES(fullname), gender=VALUES(gender), photo=VALUES(photo), nim=VALUES(nim)`,
      [targetCode, fullname, gender || "L", standardNim, photo || null]
    );

    // Update users table too
    await pool.query(
      `UPDATE users SET fullname = ?, nim = ? WHERE nim = ? OR username = ?`,
      [fullname, standardNim, `25SI${oldCode}`, `25SI${oldCode}`]
    );

    res.json({ message: "Data mahasiswa berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ message: "Gagal memperbarui mahasiswa", error: error.message });
  }
};

export const deleteMember = async (req, res) => {
  const { code } = req.params;
  try {
    await pool.query("DELETE FROM members_list WHERE code = ?", [code]);
    res.json({ message: "Mahasiswa berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menghapus mahasiswa", error: error.message });
  }
};

