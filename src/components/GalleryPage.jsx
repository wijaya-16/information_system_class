import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';

const CATEGORIES = [
    'Semua',
    'Praktikum & Perkuliahan',
    'Makrab & Kebersamaan',
    'Seminar & Workshop',
    'Kegiatan Luar',
];

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function GalleryPage({
    photos = [],
    isAdmin = false,
    adminHandlers,
    showToast,
    navigateTo,
}) {
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [search, setSearch] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Admin CRUD state
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
    const [editTarget, setEditTarget] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [form, setForm] = useState({
        url: '',
        title: '',
        category: 'Praktikum & Perkuliahan',
        caption: '',
        date: getTodayDate(),
        isHero: false,
    });

    const fileInputRef = useRef(null);

    // Filter foto berdasarkan kategori dan pencarian
    const filteredPhotos = photos.filter(item => {
        const matchCategory = selectedCategory === 'Semua' || (item.category || 'Praktikum & Perkuliahan') === selectedCategory;
        const matchSearch = search.trim() === '' ||
            (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
            (item.caption && item.caption.toLowerCase().includes(search.toLowerCase())) ||
            (item.category && item.category.toLowerCase().includes(search.toLowerCase()));
        return matchCategory && matchSearch;
    });

    // Navigasi Lightbox (Sebelumnya / Selanjutnya)
    const handlePrevPhoto = (e) => {
        e?.stopPropagation();
        if (!selectedPhoto) return;
        const idx = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
        if (idx > 0) {
            setSelectedPhoto(filteredPhotos[idx - 1]);
        } else {
            setSelectedPhoto(filteredPhotos[filteredPhotos.length - 1]);
        }
    };

    const handleNextPhoto = (e) => {
        e?.stopPropagation();
        if (!selectedPhoto) return;
        const idx = filteredPhotos.findIndex(p => p.id === selectedPhoto.id);
        if (idx < filteredPhotos.length - 1) {
            setSelectedPhoto(filteredPhotos[idx + 1]);
        } else {
            setSelectedPhoto(filteredPhotos[0]);
        }
    };

    // Keyboard navigation di Lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedPhoto) return;
            if (e.key === 'ArrowLeft') handlePrevPhoto();
            if (e.key === 'ArrowRight') handleNextPhoto();
            if (e.key === 'Escape') setSelectedPhoto(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPhoto, filteredPhotos]);

    // Handle Upload file lokal
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (showToast) showToast('Silakan pilih file gambar (JPG, PNG, WebP)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Url = event.target?.result;
            setForm(f => ({
                ...f,
                url: base64Url,
                title: f.title || file.name.replace(/\.[^/.]+$/, ''),
            }));
        };
        reader.readAsDataURL(file);
    };

    // Admin: Buka Modal Tambah
    const openAdd = () => {
        setForm({
            url: '',
            title: '',
            category: 'Praktikum & Perkuliahan',
            caption: '',
            date: getTodayDate(),
            isHero: false,
        });
        setEditTarget(null);
        setModalMode('add');
    };

    // Admin: Buka Modal Edit
    const openEdit = (e, photo) => {
        e.stopPropagation();
        setForm({
            url: photo.url || '',
            title: photo.title || '',
            category: photo.category || 'Praktikum & Perkuliahan',
            caption: photo.caption || '',
            date: photo.date || getTodayDate(),
            isHero: !!photo.isHero,
        });
        setEditTarget(photo);
        setModalMode('edit');
    };

    // Admin: Simpan Data Foto
    const handleSave = () => {
        if (!form.url.trim()) {
            if (showToast) showToast('Silakan unggah foto atau masukkan URL gambar', 'error');
            return;
        }
        if (!form.title.trim()) {
            if (showToast) showToast('Judul dokumentasi wajib diisi', 'error');
            return;
        }

        if (modalMode === 'add') {
            adminHandlers.classPhoto.add(form);
            if (showToast) showToast('Dokumentasi baru berhasil ditambahkan');
        } else if (modalMode === 'edit' && editTarget) {
            adminHandlers.classPhoto.update(editTarget.id, form);
            if (showToast) showToast('Dokumentasi berhasil diperbarui');
        }
        setModalMode(null);
    };

    // Admin: Hapus Foto
    const handleDelete = () => {
        if (!confirmDeleteId) return;
        adminHandlers.classPhoto.delete(confirmDeleteId);
        setConfirmDeleteId(null);
        if (selectedPhoto?.id === confirmDeleteId) {
            setSelectedPhoto(null);
        }
        if (showToast) showToast('Dokumentasi telah dihapus', 'error');
    };

    // Admin: Set foto sebagai Hero di beranda
    const handleSetHero = (e, photoId) => {
        e.stopPropagation();
        adminHandlers.classPhoto.setHero(photoId);
        if (showToast) showToast('Foto ini telah dijadikan Banner Utama di Beranda');
    };

    return (
        <div className="space-y-8">
            {/* ── Header Halaman Galeri ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
                            <Icon name="camera" className="w-3.5 h-3.5 text-blue-600" />
                            Dokumentasi Resmi Kelas SI
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Galeri & Dokumentasi Kegiatan
                        </h1>
                        <p className="text-slate-600 text-sm mt-1 max-w-2xl leading-relaxed">
                            Arsip foto perjalanan, kegiatan akademik, praktikum laboratorium, makrab, dan momen kebersamaan mahasiswa Sistem Informasi.
                        </p>
                    </div>

                    {/* Tombol Aksi: Admin Only */}
                    <div className="flex items-center gap-3 shrink-0">
                        {isAdmin ? (
                            <button
                                onClick={openAdd}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition shadow-sm"
                            >
                                <Icon name="plus" className="w-4 h-4" /> Tambah Dokumentasi
                            </button>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-xl text-slate-600 text-xs font-medium border border-slate-200">
                                <Icon name="lock" className="w-3.5 h-3.5 text-slate-400" />
                                Penambahan foto hanya oleh Admin
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Kategori & Search Bar ── */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Tabs Kategori */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                        {CATEGORIES.map(cat => {
                            const count = cat === 'Semua'
                                ? photos.length
                                : photos.filter(p => (p.category || 'Praktikum & Perkuliahan') === cat).length;
                            const isActive = selectedCategory === cat;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-slate-900 text-white font-semibold shadow-sm'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Input Pencarian */}
                    <div className="relative w-full lg:w-72">
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari momen, judul, kegiatan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs sm:text-sm bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* ── Grid Dokumentasi Foto ── */}
            {filteredPhotos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Icon name="image" className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Tidak ada dokumentasi ditemukan</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {search ? `Tidak ada foto yang cocok dengan pencarian "${search}".` : 'Belum ada dokumentasi untuk kategori ini.'}
                    </p>
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                        >
                            <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Foto Sekarang
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPhotos.map((photo) => (
                        <div
                            key={photo.id}
                            className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col ${
                                photo.isHero ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Frame Gambar */}
                            <div
                                className="relative aspect-[16/10] overflow-hidden bg-slate-100 cursor-pointer"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />

                                {/* Overlay gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3.5">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow-md">
                                        <Icon name="maximize-2" className="w-3.5 h-3.5" /> Buka Foto
                                    </span>
                                </div>

                                {/* Badges */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                    <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold shadow-sm">
                                        {photo.category || 'Dokumentasi'}
                                    </span>
                                    {photo.isHero && (
                                        <span className="px-2 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                                            <Icon name="star" className="w-3 h-3 fill-white" /> Banner Beranda
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Konten Keterangan */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Icon name="calendar" className="w-3.5 h-3.5" /> {photo.date}
                                        </span>
                                    </div>

                                    <h3
                                        onClick={() => setSelectedPhoto(photo)}
                                        className="font-bold text-slate-900 text-base hover:text-blue-600 transition cursor-pointer line-clamp-1"
                                    >
                                        {photo.title}
                                    </h3>

                                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                                        {photo.caption || 'Dokumentasi momen kegiatan mahasiswa Sistem Informasi.'}
                                    </p>
                                </div>

                                {/* Panel Admin Controls (Only Admin) */}
                                {isAdmin && (
                                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                                        {!photo.isHero ? (
                                            <button
                                                onClick={(e) => handleSetHero(e, photo.id)}
                                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-amber-600 transition"
                                                title="Pasang sebagai banner utama di Beranda"
                                            >
                                                <Icon name="star" className="w-3.5 h-3.5" /> Pasang di Beranda
                                            </button>
                                        ) : (
                                            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                                                <Icon name="check" className="w-3.5 h-3.5" /> Hero Beranda
                                            </span>
                                        )}

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => openEdit(e, photo)}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                title="Edit Dokumentasi"
                                            >
                                                <Icon name="pencil" className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmDeleteId(photo.id);
                                                }}
                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                title="Hapus Dokumentasi"
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

            {/* ── Modal Lightbox (Perbesar Foto) ── */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div
                        className="relative max-w-5xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Modal Lightbox */}
                        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100">
                            <div>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    {selectedPhoto.category || 'Dokumentasi'}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedPhoto.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {isAdmin && (
                                    <button
                                        onClick={(e) => {
                                            const p = selectedPhoto;
                                            setSelectedPhoto(null);
                                            openEdit(e, p);
                                        }}
                                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition text-xs font-semibold flex items-center gap-1.5"
                                        title="Edit Foto Ini"
                                    >
                                        <Icon name="pencil" className="w-4 h-4" /> Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedPhoto(null)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                >
                                    <Icon name="x" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Kontainer Gambar Penuh dengan Tombol Next/Prev */}
                        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[350px] sm:min-h-[480px]">
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.title}
                                className="max-h-[70vh] w-auto max-w-full object-contain"
                            />

                            {/* Tombol Sebelumnya */}
                            <button
                                onClick={handlePrevPhoto}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-sm"
                                title="Foto Sebelumnya"
                            >
                                <Icon name="chevron-left" className="w-6 h-6" />
                            </button>

                            {/* Tombol Selanjutnya */}
                            <button
                                onClick={handleNextPhoto}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-sm"
                                title="Foto Selanjutnya"
                            >
                                <Icon name="chevron-right" className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Footer Deskripsi */}
                        <div className="p-4 sm:px-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <Icon name="calendar" className="w-3.5 h-3.5" /> Tanggal Pengambilan: {selectedPhoto.date}
                                </p>
                                <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                                    {selectedPhoto.caption || 'Dokumentasi kegiatan perkuliahan dan kebersamaan kelas Sistem Informasi.'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={selectedPhoto.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5"
                                >
                                    <Icon name="external-link" className="w-3.5 h-3.5" /> Buka Asli
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Admin: Tambah / Edit Dokumentasi ── */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Tambah Foto Dokumentasi Kelas' : 'Edit Foto Dokumentasi'}
                    isOpen={true}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        {/* Pilihan Sumber Foto */}
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                Berkas Foto / Gambar <span className="text-red-500">*</span>
                            </label>

                            <div className="space-y-3">
                                {/* Opsi Upload Lokal */}
                                <div className="flex items-center gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition border border-slate-200 flex items-center gap-2"
                                    >
                                        <Icon name="upload" className="w-4 h-4 text-slate-600" />
                                        Pilih Dari Komputer / HP
                                    </button>
                                    <span className="text-xs text-slate-400">atau masukkan URL langsung di bawah</span>
                                </div>

                                {/* Input URL gambar */}
                                <input
                                    type="text"
                                    placeholder="https://images.unsplash.com/... atau URL foto"
                                    value={form.url.startsWith('data:') ? '(Foto lokal berhasil diunggah)' : form.url}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setForm(f => ({ ...f, url: v }));
                                    }}
                                    disabled={form.url.startsWith('data:')}
                                    className={inputCls}
                                />

                                {form.url.startsWith('data:') && (
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, url: '' }))}
                                        className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"
                                    >
                                        <Icon name="x" className="w-3 h-3" /> Hapus file lokal & gunakan URL
                                    </button>
                                )}
                            </div>

                            {/* Preview Foto */}
                            {form.url && (
                                <div className="mt-3 relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                    <img
                                        src={form.url}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://placehold.co/600x400?text=Gambar+Tidak+Dapat+Dimuat';
                                        }}
                                    />
                                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm">
                                        Preview Foto
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Judul Foto */}
                        <FormField label="Judul Dokumentasi" required>
                            <input
                                type="text"
                                placeholder="Contoh: Praktikum Basis Data di Laboratorium"
                                value={form.title}
                                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                className={inputCls}
                            />
                        </FormField>

                        {/* Kategori & Tanggal */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Kategori" required>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                                    className={selectCls}
                                >
                                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField label="Tanggal Pengambilan" required>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                    className={inputCls}
                                />
                            </FormField>
                        </div>

                        {/* Deskripsi / Caption */}
                        <FormField label="Keterangan / Cerita Momen">
                            <textarea
                                rows={3}
                                placeholder="Ceritakan momen seru dari foto kegiatan ini..."
                                value={form.caption}
                                onChange={(e) => setForm(f => ({ ...f, caption: e.target.value }))}
                                className={inputCls}
                            />
                        </FormField>

                        {/* Opsi Jadikan Banner Beranda */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-800 block">Jadikan Banner Utama di Beranda</span>
                                <span className="text-[11px] text-slate-500">Tampilkan foto ini pada kartu utama halaman Beranda</span>
                            </div>
                            <input
                                type="checkbox"
                                checked={form.isHero}
                                onChange={(e) => setForm(f => ({ ...f, isHero: e.target.checked }))}
                                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
                            />
                        </div>

                        {/* Tombol Simpan */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setModalMode(null)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                            >
                                {modalMode === 'add' ? 'Tambahkan ke Galeri' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal Konfirmasi Hapus Foto ── */}
            {confirmDeleteId && (
                <ConfirmDialog
                    isOpen={true}
                    title="Hapus Dokumentasi Foto"
                    message="Apakah Anda yakin ingin menghapus foto dokumentasi ini dari galeri kelas? Tindakan ini tidak dapat dibatalkan."
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}
