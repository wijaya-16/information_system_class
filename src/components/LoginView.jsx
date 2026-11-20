import { useState } from "react";
import { loginUser } from "../lib/api";
import Icon from "./Icons";
import ThemeSwitcher from "./ThemeSwitcher";

export default function LoginView({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─── HANDLER LOGIN ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      setError("NIM / Email / Username dan Password wajib diisi.");
      return;
    }

    setError("");
    setLoading(true);

    let result;
    try {
      result = await loginUser({
        identifier: identifier.trim(),
        password: password.trim(),
      });
    } catch (err) {
      let message =
        err.response?.data?.message ||
        err.message ||
        "Gagal masuk. Periksa kembali NIM/Username dan password Anda.";

      if (message.includes("Network Error") || message.includes("ERR_NETWORK")) {
        message =
          "Tidak dapat terhubung ke server backend. Menggunakan verifikasi database lokal kelas. Pastikan NIM Anda terdaftar (contoh: 25SI025).";
      }

      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
    if (result && result.user) {
      if (typeof onLoginSuccess === "function") {
        onLoginSuccess(result.user, result.token);
      } else {
        console.error("Prop onLoginSuccess belum diteruskan dari App.jsx");
      }
    }
  };

  // Helper autofill untuk kemudahan akses
  const handleQuickFill = (nim) => {
    setIdentifier(nim);
    setPassword(nim);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Animated Mesh Orbs & Grid */}
      <div className="theme-ambient-container">
        <div className="theme-ambient-orb-1" />
        <div className="theme-ambient-orb-2" />
        <div className="theme-ambient-orb-3" />
        <div className="theme-grid-overlay" />
      </div>

      {/* Floating Theme Switcher at Top Right */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeSwitcher />
      </div>

      <div className="max-w-md w-full rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 relative z-10 backdrop-blur-2xl transition-all">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Icon name="book-open" className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Portal Kelas SI
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Masuk untuk mengakses materi, tugas & galeri perkuliahan
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5 animate-fade-in">
            <Icon
              name="alert-circle"
              className="w-4 h-4 shrink-0 text-red-400 mt-0.5"
            />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              NIM / Email / Username
            </label>
            <div className="relative">
              <Icon
                name="user"
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan NIM (cth: 25SI025) atau Username"
                disabled={loading}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition bg-white/5 focus:bg-white/10 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Icon
                name="lock"
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password (default: sama dengan NIM)"
                disabled={loading}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/15 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition bg-white/5 focus:bg-white/10 text-white placeholder-slate-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 border border-white/10"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memproses Masuk...</span>
              </>
            ) : (
              <span>Masuk ke Akun</span>
            )}
          </button>
        </form>

        {/* Panduan Akun Bantuan */}
        <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10 text-[11px] text-slate-400 space-y-2">
            <p className="font-bold text-white flex items-center gap-1.5">
              <Icon name="shield-check" className="w-3.5 h-3.5 text-cyan-400" />
              Ketentuan Hak Akses Sistem:
            </p>
            <p className="leading-relaxed">
              • <strong>Mahasiswa Terdaftar:</strong> Masuk dengan NIM Anda (contoh:{" "}
              <button
                type="button"
                onClick={() => handleQuickFill("25SI025")}
                className="font-mono font-bold text-cyan-400 hover:underline"
              >
                25SI025
              </button>
              ) dan password sama dengan NIM.
            </p>
            <p className="leading-relaxed">
              • <strong>Administrator Terdaftar:</strong> Masuk dengan akun administrator (Username:{" "}
              <button
                type="button"
                onClick={() => {
                  setIdentifier("admin");
                  setPassword("admin123");
                  setError("");
                }}
                className="font-mono font-bold text-amber-400 hover:underline"
              >
                admin
              </button>
              ).
            </p>
            <p className="text-[10px] text-slate-500 italic pt-1 border-t border-white/5">
              * Hanya mahasiswa terdaftar dan administrator resmi yang diizinkan mengakses portal ini.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-5">
          Sistem Informasi Kelas &copy; 2026
        </p>
      </div>
    </div>
  );
}
