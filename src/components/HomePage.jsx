import React, { useState, useRef, useEffect } from "react";
import Icon from "./Icons";
import Modal, { ConfirmDialog, FormField, inputCls } from "./Modal";

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function HomePage({
    data,
    navigateTo,
    user,
    isAdmin,
    adminHandlers,
    showToast,
    initialTab = 'beranda',
}) {
    const classPhotos = data.classPhotos || [];

    // Foto utama untuk ditampilkan di Hero
    const heroPhoto = classPhotos.find(p => p.isHero) || classPhotos[0] || null;

    // State Lightbox (Lihat foto penuh)
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Auto-scroll ke galeri jika dibuka dari menu Galeri
    useEffect(() => {
        if (initialTab === 'galeri') {
            const el = document.getElementById('galeri-kelas');
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth' });
                }, 150);
            }
        }
    }, [initialTab]);

    // State Modal Admin: null | 'add' | 'edit'
    const [photoModal, setPhotoModal] = useState(null);
    const [editPhotoTarget, setEditPhotoTarget] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Form foto
    const [photoForm, setPhotoForm] = useState({
        url: '',
        title: '',
        caption: '',
        date: getTodayDate(),
        isHero: false,
    });

    const fileInputRef = useRef(null);

    // Handle Upload file lokal dari komputer/HP dengan kompresi otomatis
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validasi tipe file
        if (!file.type.startsWith('image/')) {
            if (showToast) showToast('Silakan pilih file gambar (JPG, PNG, WebP)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                // Kompres dan resize otomatis agar pas di memori penyimpanan
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1280;
                const MAX_HEIGHT = 1280;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round((width * MAX_HEIGHT) / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
                setPhotoForm(f => ({
                    ...f,
                    url: compressedUrl,
                    title: f.title || file.name.replace(/\.[^/.]+$/, ''),
                }));
            };
            img.onerror = () => {
                setPhotoForm(f => ({
                    ...f,
                    url: event.target?.result,
                    title: f.title || file.name.replace(/\.[^/.]+$/, ''),
                }));
            };
            img.src = event.target?.result;
        };
        reader.readAsDataURL(file);
    };

    // Buka modal Tambah
    const openAddPhoto = (asHero = false) => {
        setPhotoForm({
            url: '',
            title: '',
            caption: '',
            date: getTodayDate(),
            isHero: asHero || classPhotos.length === 0,
        });
        setEditPhotoTarget(null);
        setPhotoModal('add');
    };

    // Buka modal Edit
    const openEditPhoto = (photo) => {
        setPhotoForm({
            url: photo.url,
            title: photo.title,
            caption: photo.caption || '',
            date: photo.date || getTodayDate(),
            isHero: !!photo.isHero,
        });
        setEditPhotoTarget(photo);
        setPhotoModal('edit');
    };

    // Simpan foto
    const handleSavePhoto = () => {
        if (!photoForm.url.trim()) {
            if (showToast) showToast('Silakan pilih file gambar atau masukkan URL', 'error');
            return;
        }
        if (!photoForm.title.trim()) {
            if (showToast) showToast('Judul foto wajib diisi', 'error');
            return;
        }

        if (photoModal === 'add') {
            adminHandlers.classPhoto.add(photoForm);
        } else if (photoModal === 'edit' && editPhotoTarget) {
            adminHandlers.classPhoto.update(editPhotoTarget.id, photoForm);
        }
        setPhotoModal(null);
    };

    // Hapus foto
    const handleDeletePhoto = () => {
        if (!confirmDeleteId) return;
        adminHandlers.classPhoto.delete(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    // Set foto sebagai Hero
    const handleSetAsHero = (id) => {
        adminHandlers.classPhoto.setHero(id);
    };

    return (
        <div className="space-y-10">
            {/* ── Hero Section ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm">
                <div className="max-w-xl space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Tahun Akademik 2025/2026 {user?.nim ? `· NIM: ${user.nim}` : ''}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {user?.fullname ? `Halo, ${user.fullname} 👋` : 'Selamat Datang di Kelas Sistem Informasi'}
                    </h1>
                    <p className="text-slate-600 text-base leading-relaxed">
                        Tempat berbagi materi perkuliahan, informasi akademik, tugas mahasiswa, dan kegiatan kelas secara terpadu.
                    </p>
                    <p className="text-xs font-mono text-slate-500 font-semibold tracking-wider">
                        Belajar · Berbagi · Berkembang Bersama
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                        <button
                            onClick={() => navigateTo('materi')}
                            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center gap-2"
                        >
                            Lihat Materi <Icon name="arrow-right" className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => navigateTo('tugas')}
                            className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 font-medium rounded-xl text-sm transition"
                        >
                            Cek Tugas Aktif
                        </button>
                    </div>
                </div>

                {/* ── Frame Foto Kelas di Hero ── */}
                <div className="w-full lg:w-auto flex justify-center">
                    <div className="relative group w-full max-w-sm sm:w-80 h-72 sm:h-80 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-md flex items-center justify-center">
                        {heroPhoto ? (
                            <>
                                <img
                                    src={heroPhoto.url}
                                    alt={heroPhoto.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                                    onClick={() => setSelectedPhoto(heroPhoto)}
                                />
                                {/* Gradient Overlay */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 cursor-pointer"
                                    onClick={() => setSelectedPhoto(heroPhoto)}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-900 text-[11px] font-bold shadow-sm">
                                            <Icon name="camera" className="w-3.5 h-3.5 text-slate-700" />
                                            Foto Kelas
                                        </span>

                                        <span className="p-1.5 rounded-lg bg-black/40 text-white/90 group-hover:bg-black/60 transition backdrop-blur-sm" title="Perbesar Foto">
                                            <Icon name="maximize-2" className="w-3.5 h-3.5" />
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-white text-sm font-bold line-clamp-1 drop-shadow-sm">
                                            {heroPhoto.title}
                                        </h3>
                                        <p className="text-white/80 text-xs line-clamp-1 mt-0.5 drop-shadow-sm">
                                            {heroPhoto.caption || `${heroPhoto.date} · Momen Kelas SI`}
                                        </p>
                                    </div>
                                </div>

                                {/* Tombol Ganti Foto untuk Admin */}
                                {isAdmin && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditPhoto(heroPhoto);
                                        }}
                                        className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md transition shadow-md flex items-center gap-1.5 opacity-0 group-hover:opacity-100 z-10"
                                        title="Ganti atau Edit Foto Ini"
                                    >
                                        <Icon name="pencil" className="w-3.5 h-3.5" /> Ganti Foto
                                    </button>
                                )}
                            </>
                        ) : (
                            /* Placeholder jika belum ada foto */
                            <div className="p-6 text-center space-y-3">
                                <div className="w-14 h-14 rounded-2xl bg-slate-200/80 flex items-center justify-center mx-auto text-slate-600">
                                    <Icon name="camera" className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">Foto Kelas Belum Diunggah</p>
                                    <p className="text-xs text-slate-500 mt-1">Tambahkan kenangan & foto bersama kelas Sistem Informasi di sini.</p>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => openAddPhoto(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                                    >
                                        <Icon name="plus" className="w-3.5 h-3.5" /> Unggah Foto Kelas
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Akses Cepat ── */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Akses Cepat</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[
                        { title: 'Mata Kuliah', desc: 'Daftar matkul semester 3', icon: 'library', page: 'matkul' },
                        { title: 'Materi Kuliah', desc: 'Akses modul & berkas', icon: 'book-open', page: 'materi' },
                        { title: 'Tugas Kelas', desc: 'Tenggat & instruksi', icon: 'clipboard-list', page: 'tugas' },
                        { title: 'Pengumuman', desc: 'Informasi terbaru', icon: 'bell', page: 'pengumuman' },
                        { title: 'Mahasiswa', desc: 'Direktori anggota kelas', icon: 'users', page: 'mahasiswa' }
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigateTo(item.page)}
                            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition cursor-pointer group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition flex items-center justify-center text-slate-700 mb-3">
                                <Icon name={item.icon} className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-slate-900 text-sm">{item.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Galeri & Foto Kelas ── */}
            <div id="galeri-kelas" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-900">Dokumentasi & Foto Kelas</h2>
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                                {classPhotos.length} Foto
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Kumpulan kenangan, momen kebersamaan, dan kegiatan perkuliahan Sistem Informasi
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => openAddPhoto(false)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-sm"
                        >
                            <Icon name="camera" className="w-3.5 h-3.5" /> Tambah Foto Kelas
                        </button>
                    )}
                </div>

                {/* Grid Foto Kelas */}
                {classPhotos.length === 0 ? (
                    <div className="border border-dashed border-slate-300 rounded-2xl py-14 text-center px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Icon name="image" className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">Belum ada foto yang diunggah</p>
                        <p className="text-xs text-slate-500 mt-1">Abadikan momen kebersamaan kelas dengan menambahkan foto baru.</p>
                        {isAdmin && (
                            <button
                                onClick={() => openAddPhoto(true)}
                                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" /> Unggah Foto Sekarang
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {classPhotos.map(photo => (
                            <div
                                key={photo.id}
                                className={`group bg-white rounded-xl border overflow-hidden hover:shadow-md transition flex flex-col ${
                                    photo.isHero ? 'border-amber-300 ring-2 ring-amber-200/50' : 'border-slate-200'
                                }`}
                            >
                                {/* Wadah Gambar */}
                                <div
                                    className="relative aspect-[16/10] overflow-hidden bg-slate-100 cursor-pointer"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    {/* Overlay hover */}
                                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 text-xs font-bold shadow-md flex items-center gap-1">
                                            <Icon name="maximize-2" className="w-3 h-3" /> Lihat Penuh
                                        </span>
                                    </div>

                                    {/* Badge Foto Utama */}
                                    {photo.isHero && (
                                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                                            <Icon name="star" className="w-3 h-3 fill-white" /> Foto Utama
                                        </span>
                                    )}
                                </div>

                                {/* Deskripsi Foto */}
                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                            <span className="flex items-center gap-1">
                                                <Icon name="calendar" className="w-3 h-3" /> {photo.date}
                                            </span>
                                        </div>
                                        <h3
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="font-bold text-slate-900 text-sm hover:text-blue-600 transition cursor-pointer line-clamp-1"
                                        >
                                            {photo.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                            {photo.caption || 'Dokumentasi foto kebersamaan kelas Sistem Informasi.'}
                                        </p>
                                    </div>

                                    {/* Kontrol Admin */}
                                    {isAdmin && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            {!photo.isHero ? (
                                                <button
                                                    onClick={() => handleSetAsHero(photo.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 transition"
                                                    title="Jadikan Foto Utama di Beranda"
                                                >
                                                    <Icon name="star" className="w-3.5 h-3.5" /> Jadikan Utama
                                                </button>
                                            ) : (
                                                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                                                    <Icon name="check" className="w-3.5 h-3.5" /> Utama di Hero
                                                </span>
                                            )}

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditPhoto(photo)}
                                                    className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                    title="Edit Foto"
                                                >
                                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(photo.id)}
                                                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Hapus Foto"
                                                >
                                                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Pengumuman & Agenda ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Pengumuman Terbaru</h2>
                        <button onClick={() => navigateTo('pengumuman')} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                            Lihat Semua
                        </button>
                    </div>
                    <div className="space-y-4 flex-1">
                        {(data.announcements || []).slice(0, 3).map(item => (
                            <div key={item.id} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                            {item.category}
                                        </span>
                                        {item.important && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                Penting
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400">{item.date}</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 text-sm mt-1">{item.title}</h3>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Agenda Kegiatan</h2>
                    <div className="space-y-3">
                        {(data.events || []).map((ev, idx) => (
                            <div key={idx} className="flex gap-3 items-start pb-3 border-b border-slate-100 last:border-0">
                                <div className="w-12 text-center bg-slate-100 rounded-lg py-2 shrink-0">
                                    <span className="block text-xs font-bold text-slate-800">{ev.date.split('-')[2]}</span>
                                    <span className="block text-[10px] uppercase text-slate-500">Nov</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">{ev.title}</h4>
                                    <p className="text-[11px] text-slate-500 mt-0.5">{ev.time} · {ev.location}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Materi Perkuliahan Terbaru ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-slate-900">Materi Perkuliahan Terbaru</h2>
                    <button onClick={() => navigateTo('materi')} className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                        Semua Materi
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(data.materials || []).slice(0, 4).map(mat => (
                        <div
                            key={mat.id}
                            onClick={() => navigateTo('materi-detail', { id: mat.id })}
                            className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 line-clamp-1">
                                        {mat.course}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-400">{mat.type}</span>
                                </div>
                                <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{mat.title}</h3>
                                <p className="text-xs text-slate-500 mt-1">{mat.lecturer}</p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                               <span>{mat.size}</span>
                               <span className="font-semibold text-slate-900">Detail &rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Lightbox: Lihat Foto Penuh ── */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div
                        className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative bg-slate-900 flex items-center justify-center max-h-[60vh] overflow-hidden">
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.title}
                                className="w-full h-full object-contain max-h-[60vh]"
                            />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition"
                            >
                                <Icon name="x" className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Diambil pada {selectedPhoto.date}</span>
                                {selectedPhoto.isHero && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                        Foto Utama Beranda
                                    </span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedPhoto.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {selectedPhoto.caption || 'Dokumentasi kegiatan dan momen kelas Sistem Informasi.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Tambah / Edit Foto Kelas ── */}
            {photoModal && (
                <Modal
                    title={photoModal === 'add' ? 'Tambah Foto Kelas' : 'Edit Foto Kelas'}
                    onClose={() => setPhotoModal(null)}
                >
                    <div className="space-y-4">
                        {/* Pilihan Sumber Gambar */}
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                                Pilih Gambar <span className="text-red-500">*</span>
                            </label>

                            {/* Dropzone / Upload button */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 px-4 py-3 border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-2"
                                >
                                    <Icon name="upload" className="w-4 h-4 text-slate-600" />
                                    Unggah File dari Komputer / HP
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {/* Atau Input URL */}
                            <div className="relative pt-1">
                                <span className="text-[11px] text-slate-400 block mb-1">Atau masukkan URL / Link Gambar web:</span>
                                <input
                                    className={inputCls}
                                    value={photoForm.url.startsWith('data:') ? '' : photoForm.url}
                                    onChange={e => setPhotoForm(f => ({ ...f, url: e.target.value }))}
                                    placeholder="https://example.com/foto-kelas.jpg"
                                />
                            </div>
                        </div>

                        {/* Preview Gambar */}
                        {photoForm.url && (
                            <div className="space-y-1">
                                <span className="text-[11px] font-semibold text-slate-500">Preview Gambar:</span>
                                <div className="h-40 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                                    <img
                                        src={photoForm.url}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        <FormField label="Judul Foto" required>
                            <input
                                className={inputCls}
                                value={photoForm.title}
                                onChange={e => setPhotoForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Foto Bersama Mahasiswa SI Angkatan 2024"
                            />
                        </FormField>

                        <FormField label="Tanggal">
                            <input
                                type="date"
                                className={inputCls}
                                value={photoForm.date}
                                onChange={e => setPhotoForm(f => ({ ...f, date: e.target.value }))}
                            />
                        </FormField>

                        <FormField label="Keterangan / Cerita Momen">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={photoForm.caption}
                                onChange={e => setPhotoForm(f => ({ ...f, caption: e.target.value }))}
                                placeholder="Tuliskan cerita singkat, suasana, atau lokasi momen ini..."
                            />
                        </FormField>

                        <div className="flex items-center gap-2 py-1">
                            <input
                                type="checkbox"
                                id="heroCheck"
                                checked={photoForm.isHero}
                                onChange={e => setPhotoForm(f => ({ ...f, isHero: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <label htmlFor="heroCheck" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                Jadikan sebagai foto utama kelas (Tampil di frame Hero Beranda)
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setPhotoModal(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSavePhoto}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
                            >
                                {photoModal === 'add' ? 'Simpan Foto' : 'Perbarui Foto'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Dialog Konfirmasi Hapus ── */}
            {confirmDeleteId && (
                <ConfirmDialog
                    message={`Foto "${classPhotos.find(p => p.id === confirmDeleteId)?.title}" akan dihapus permanen dari galeri kelas.`}
                    onConfirm={handleDeletePhoto}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}