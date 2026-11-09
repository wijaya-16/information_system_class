import jwt from "jsonwebtoken";

// Middleware untuk memverifikasi apakah request membawa Token JWT yang valid
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Akses ditolak. Token tidak ditemukan." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "secret_key_kelas",
    );
    req.user = decoded; // Menyimpan payload user (id, username, role) ke req.user
    next();
  } catch {
    return res
      .status(403)
      .json({ message: "Token tidak valid atau telah kadaluwarsa." });
  }
};

// Middleware untuk memverifikasi apakah pengguna memiliki peran Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Akses ditolak. Fitur ini hanya untuk Admin." });
  }
};
