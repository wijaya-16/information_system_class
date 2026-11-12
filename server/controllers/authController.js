import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const login = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res
      .status(400)
      .json({ message: "NIM / Username dan Password wajib diisi" });
  }

  const cleanId = identifier.trim();
  const cleanPass = password.trim();

  try {
    // 1. Cek Admin Hardcoded / Direct check
    if (
      (cleanId.toLowerCase() === "admin" || cleanId.toLowerCase() === "administrator") &&
      cleanPass === "admin123"
    ) {
      const token = jwt.sign(
        { id: 1, username: "admin", role: "admin" },
        process.env.JWT_SECRET || "secret_key_kelas",
        { expiresIn: "7d" }
      );
      return res.json({
        message: "Login berhasil sebagai Administrator",
        token,
        user: {
          id: 1,
          nim: "ADMIN",
          code: "admin",
          username: "admin",
          fullname: "Administrator Kelas",
          role: "admin",
          email: "admin@kelas.ac.id",
          photo: null,
        },
      });
    }

    // 2. Format pencarian mahasiswa (Bisa berupa "25SI001", "25si001", atau cuma "001")
    let searchNim = cleanId.toUpperCase();
    let searchCode = cleanId;
    if (/^\d{3}$/.test(cleanId)) {
      searchNim = `25SI${cleanId}`;
      searchCode = cleanId;
    } else if (/^25SI\d{3}$/i.test(cleanId)) {
      searchNim = cleanId.toUpperCase();
      searchCode = cleanId.toUpperCase().replace("25SI", "");
    }

    // Cari di tabel users
    const [users] = await pool.query(
      `SELECT * FROM users 
       WHERE LOWER(username) = LOWER(?) 
          OR LOWER(nim) = LOWER(?) 
          OR LOWER(nim) = LOWER(?)
          OR LOWER(email) = LOWER(?)
       LIMIT 1`,
      [cleanId, cleanId, searchNim, cleanId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        message: `Pengguna '${cleanId}' tidak ditemukan. Pastikan NIM Anda benar (contoh: 25SI001 atau 001).`,
      });
    }

    const user = users[0];

    // Verifikasi password (Bcrypt atau Plaintext atau default 'si2025' atau NIM)
    let isPasswordValid = false;
    if (user.password && (user.password.startsWith("$2a$") || user.password.startsWith("$2b$"))) {
      isPasswordValid = await bcrypt.compare(cleanPass, user.password);
    } else {
      isPasswordValid = (
        cleanPass === user.password ||
        cleanPass === user.nim ||
        cleanPass === "si2025" ||
        cleanPass.toLowerCase() === (user.nim || "").toLowerCase()
      );
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Password salah. Silakan coba kembali atau gunakan password default.",
      });
    }

    // Tentukan role dan kode unik
    const isAdminUser = user.role === "admin";
    const userRole = isAdminUser ? "admin" : "member";
    const userCode = user.nim ? user.nim.replace(/^25SI/i, "") : (user.username || "001");
    const formattedNim = user.nim || (isAdminUser ? "ADMIN" : `25SI${userCode}`);

    const token = jwt.sign(
      { id: user.id, username: user.username, role: userRole, nim: formattedNim },
      process.env.JWT_SECRET || "secret_key_kelas",
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        nim: formattedNim,
        code: userCode,
        username: user.username,
        fullname: user.fullname,
        role: userRole,
        email: user.email || "",
        photo: user.photo || null,
      },
    });
  } catch (error) {
    console.error("[Login Error]:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server saat login",
      error: error.message,
    });
  }
};

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
      [username, nim || ""]
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
        role === "admin" ? "admin" : "student",
      ]
    );

    res.status(201).json({
      message: "Registrasi berhasil",
      userId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal melakukan registrasi", error: error.message });
  }
};
