// /* global process */
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  const { nim, full_name, email, password } = req.body;
  try {
    const [existing] = await pool.query(
      "SELECT * FROM members WHERE email = ? OR nim = ?",
      [email, nim],
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ message: "NIM atau Email sudah terdaftar" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO members (nim, full_name, email, password) VALUES (?, ?, ?, ?)",
      [nim, full_name, email, hashedPassword],
    );

    res.status(201).json({ message: "Registrasi berhasil" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query("SELECT * FROM members WHERE email = ?", [
      email,
    ]);
    if (users.length === 0)
      return res.status(404).json({ message: "User tidak ditemukan" });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    delete user.password;

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
