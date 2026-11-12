import { useState } from "react";
import { loginUser } from "../lib/api";
import Icon from "./Icons";

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
          "Tidak dapat terhubung ke server backend. Gunakan NIM Anda (contoh: 25SI025) dan password sama dengan NIM untuk masuk ke mode kelas.";
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <Icon name="book-open" className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Portal Kelas SI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Masuk untuk mengakses materi, tugas & galeri perkuliahan
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fade-in">
            <Icon
              name="alert-circle"
              className="w-4 h-4 shrink-0 text-red-500 mt-0.5"
            />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
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
        <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Icon name="info" className="w-3.5 h-3.5 text-blue-600" />
              Petunjuk Masuk Akun:
            </p>
            <p className="leading-relaxed">
              • <strong>Mahasiswa:</strong> Gunakan NIM Anda (contoh:{" "}
              <button
                type="button"
                onClick={() => handleQuickFill("25SI025")}
                className="font-mono font-bold text-blue-600 hover:underline"
              >
                25SI025
              </button>{" "}
              atau{" "}
              <button
                type="button"
                onClick={() => handleQuickFill("25SI001")}
                className="font-mono font-bold text-blue-600 hover:underline"
              >
                25SI001
              </button>
              ) dengan password sama dengan NIM.
            </p>
            <p className="leading-relaxed">
              • <strong>Admin:</strong> Username:{" "}
              <button
                type="button"
                onClick={() => {
                  setIdentifier("admin");
                  setPassword("admin123");
                  setError("");
                }}
                className="font-mono font-bold text-slate-800 hover:underline"
              >
                admin
              </button>{" "}
              dan Password:{" "}
              <span className="font-mono font-bold text-slate-800">
                admin123
              </span>
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          Sistem Informasi Kelas &copy; 2026
        </p>
      </div>
    </div>
  );
}
