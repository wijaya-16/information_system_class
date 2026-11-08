import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "NIM/Email/Username dan Password wajib diisi" });
  }

  try {
    // Cari pengguna berdasarkan NIM, Email, atau Username
    const [users] = await pool.query(
      "SELECT * FROM users WHERE nim = ? OR email = ? OR username = ?",
      [identifier, identifier, identifier],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan" });
    }

    const user = users[0];

    // Cek apakah password menggunakan hash bcrypt atau plain-text
    let isPasswordValid = false;
    if (
      user.password &&
      (user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))
    ) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = password === user.password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Password salah" });
    }

    // Buat Token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "secret_key_kelas",
      { expiresIn: "1d" },
    );

    // Pastikan nilai 'code' tersedia dari NIM (contoh: 25SI001 -> '001')
    const userCode = user.nim ? user.nim.replace(/^25SI/i, "") : "001";

    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        nim: user.nim || "",
        code: userCode,
        username: user.username,
        fullname: user.fullname,
        role: user.role || "student",
        email: user.email || "",
        photo: user.photo || null,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

// ─── REGISTER ───────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { nim, username, fullname, email, password, role } = req.body;

  if (!username || !password || !fullname) {
    return res
      .status(400)
      .json({ message: "Username, Nama Lengkap, dan Password wajib diisi" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE username = ? OR (nim IS NOT NULL AND nim = ?)",
      [username, nim || ""],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Username atau NIM sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (nim, username, fullname, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nim || null,
        username,
        fullname,
        email || null,
        hashedPassword,
        role || "student",
      ],
    );

    res.status(201).json({
      message: "Registrasi berhasil",
      userId: result.insertId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal melakukan registrasi", error: error.message });
  }
};
