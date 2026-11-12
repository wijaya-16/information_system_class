import React, { useState, useRef } from 'react';
import Icon from './Icons';
import ImageCropperModal from './ImageCropperModal';

export default function ProfilePage({ user, onLogout, navigateTo, adminHandlers, showToast }) {
    if (!user) return null;

    const isAdmin = user.role === 'admin';
    const fileInputRef = useRef(null);

    const [cropperState, setCropperState] = useState({
        isOpen: false,
        imageSrc: '',
    });

    // Membuka modal penyesuaian foto saat berkas dipilih
    const handlePhotoFileSelected = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (showToast) showToast('Silakan pilih berkas gambar (JPG, PNG, WebP)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setCropperState({
                isOpen: true,
                imageSrc: event.target?.result,
            });
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Eksekusi simpan foto profil ke data mahasiswa & tabel galeri kelas
    const handleCropComplete = (croppedUrl) => {
        const code = user.code || (user.nim ? user.nim.replace('25SI', '') : null);
        if (code && adminHandlers?.member) {
            // 1. Simpan ke data member
            adminHandlers.member.update(code, code, {
                fullname: user.fullname,
                gender: user.gender || 'L',
                photo: croppedUrl,
            });

            // 2. Simpan juga ke database tabel galeri kelas
            if (adminHandlers?.classPhoto?.add) {
                const memberNim = user.nim || `25SI${code}`;
                adminHandlers.classPhoto.add({
                    url: croppedUrl,
                    title: `Foto Profil - ${user.fullname} (${memberNim})`,
                    caption: `Dokumentasi foto profil resmi mahasiswa Sistem Informasi Semester 3: ${user.fullname} (${memberNim}).`,
                    category: 'Mahasiswa/i Profile',
                    date: new Date().toISOString().split('T')[0],
                    isHero: false,
                });
            }

            if (showToast) showToast('Foto profil berhasil disesuaikan dan tersimpan ke Galeri Kelas!', 'success');
        }

        setCropperState({ isOpen: false, imageSrc: '' });
    };

    const handlePhotoDelete = () => {
        const code = user.code || (user.nim ? user.nim.replace('25SI', '') : null);
        if (code && adminHandlers?.member) {
            adminHandlers.member.update(code, code, {
                fullname: user.fullname,
                gender: user.gender || 'L',
                photo: null,
            });
            if (showToast) showToast('Foto profil telah dihapus', 'info');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoFileSelected}
                className="hidden"
            />

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
                    {/* Avatar dengan tombol ganti foto */}
                    <div className="relative group shrink-0">
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

                        {!isAdmin && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white shadow-lg transition border-2 border-white"
                                title="Unggah / Ganti Foto Profil"
                            >
                                <Icon name="camera" className="w-3.5 h-3.5" />
                            </button>
                        )}
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
                                ? 'Memiliki hak akses penuh untuk mengelola materi, mata kuliah, tugas, pengumuman, dan data mahasiswa.'
                                : 'Terdaftar sebagai mahasiswa aktif Kelas Sistem Informasi Semester 3 dengan akses perkuliahan dan pengumpulan tugas.'}
                        </p>

                        {!isAdmin && (
                            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                                >
                                    <Icon name="upload" className="w-3 h-3" />
                                    {user.photo ? 'Ganti Foto Profil' : 'Unggah Foto Profil'}
                                </button>
                                {user.photo && (
                                    <button
                                        type="button"
                                        onClick={handlePhotoDelete}
                                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition border border-red-200 flex items-center gap-1"
                                    >
                                        <Icon name="trash-2" className="w-3 h-3" />
                                        Hapus Foto
                                    </button>
                                )}
                            </div>
                        )}
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
                            <span className="text-sm font-bold text-slate-900">Semester 3 · S1 Reguler</span>
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
                            <span className="text-[11px] text-slate-400 block font-medium">Beban Studi Semester Ini</span>
                            <span className="text-sm font-bold text-slate-900">22 SKS (8 Mata Kuliah)</span>
                        </div>
                    </div>
                </div>

                {/* Akses Cepat Tombol */}
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                    <button
                        onClick={() => navigateTo('mahasiswa')}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                    >
                        <Icon name="users" className="w-3.5 h-3.5" /> Direktori Mahasiswa
                    </button>
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
                </div>
            </div>

            {/* Modal Penyesuaian & Pemotongan Foto */}
            <ImageCropperModal
                isOpen={cropperState.isOpen}
                imageSrc={cropperState.imageSrc}
                onCropComplete={handleCropComplete}
                onCancel={() => setCropperState({ isOpen: false, imageSrc: '' })}
                title="Sesuaikan & Potong Foto Profil"
            />
        </div>
    );
}
