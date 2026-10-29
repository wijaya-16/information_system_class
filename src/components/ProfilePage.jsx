import React from 'react';
import Icon from './Icons';

export default function ProfilePage({ user, onLogout, navigateTo }) {
    if (!user) return null;

    const isAdmin = user.role === 'admin';

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header navigasi */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigateTo('beranda')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                    <Icon name="arrow-left" className="w-4 h-4" /> Kembali ke Beranda
                </button>

                <button
                    onClick={onLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition border border-red-200"
                >
                    <Icon name="log-out" className="w-3.5 h-3.5" /> Keluar dari Akun
                </button>
            </div>

            {/* Kartu Profil Utama */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-extrabold shadow-md overflow-hidden ${
                            isAdmin
                                ? 'bg-slate-900 text-white'
                                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                        }`}>
                            {user.photo ? (
                                <img src={user.photo} alt={user.fullname} className="w-full h-full object-cover" />
                            ) : (
                                user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white ${
                            isAdmin ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}>
                            <Icon name={isAdmin ? 'shield' : 'check'} className="w-3.5 h-3.5" />
                        </div>
                    </div>

                    {/* Informasi Dasar */}
                    <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h1 className="text-2xl font-extrabold text-slate-900">
                                {user.fullname}
                            </h1>
                            {isAdmin ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1">
                                    <Icon name="shield-check" className="w-3.5 h-3.5 text-amber-600" />
                                    Administrator
                                </span>
                            ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1">
                                    <Icon name="user-check" className="w-3.5 h-3.5 text-blue-600" />
                                    Member Kelas #{user.code || '001'}
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-slate-500 font-mono">
                            {isAdmin ? 'ID: admin' : `NIM: ${user.nim || user.username}`}
                        </p>

                        <p className="text-xs text-slate-600 max-w-lg">
                            {isAdmin
                                ? 'Memiliki hak akses penuh untuk menambah, mengupdate, dan mengelola materi, mata kuliah, tugas, dan pengumuman kelas.'
                                : 'Terdaftar sebagai mahasiswa aktif Kelas Sistem Informasi Semester 3 dengan akses perkuliahan dan pengumpulan tugas.'}
                        </p>
                    </div>
                </div>

                {/* Detail Informasi Akademik */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                        Informasi Akademik & Keanggotaan
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block font-medium">Program Studi</span>
                            <span className="text-sm font-bold text-slate-900">Sistem Informasi</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block font-medium">Semester / Jenjang</span>
                            <span className="text-sm font-bold text-slate-900">Semester 3 · S1</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block font-medium">Tahun Akademik</span>
                            <span className="text-sm font-bold text-slate-900">2025/2026</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block font-medium">Kelas</span>
                            <span className="text-sm font-bold text-slate-900">{user.kelas || 'SI-A (Reguler Pagi)'}</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block font-medium">Status Keanggotaan</span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {user.status || 'Aktif'}
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="text-[11px] text-slate-400 block font-medium">Hak Akses</span>
                            <span className="text-sm font-bold text-slate-900 capitalize">
                                {isAdmin ? 'Admin (Full CRUD)' : 'Mahasiswa (Read & Download)'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Akses Cepat Tombol */}
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                    <button
                        onClick={() => navigateTo('matkul')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                    >
                        <Icon name="library" className="w-3.5 h-3.5" /> Lihat Mata Kuliah
                    </button>
                    <button
                        onClick={() => navigateTo('tugas')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                    >
                        <Icon name="clipboard-list" className="w-3.5 h-3.5" /> Cek Tugas Kuliah
                    </button>
                    <button
                        onClick={() => navigateTo('materi')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                    >
                        <Icon name="book-open" className="w-3.5 h-3.5" /> Berkas Materi
                    </button>
                </div>
            </div>
        </div>
    );
}
