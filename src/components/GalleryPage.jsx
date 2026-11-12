import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';
import { uploadImage } from '../lib/storage';

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

// Format tanggal ke bahasa Indonesia
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1] || '';
    const year = parts[0];
    return `${day} ${month} ${year}`;
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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'masonry'

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
    const [uploadProgress, setUploadProgress] = useState(null);

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

    // Handle Upload file lokal (dengan Firebase Storage jika tersedia)
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (showToast) showToast('Silakan pilih file gambar (JPG, PNG, WebP)', 'error');
            return;
        }

        setUploadProgress(0);
        try {
            const { url, storagePath } = await uploadImage(
                file,
                'gallery',
                (progress) => setUploadProgress(progress)
            );
            setForm(f => ({
                ...f,
                url,
                storagePath: storagePath || null,
                title: f.title || file.name.replace(/\.[^/.]+$/, ''),
            }));
            if (showToast && storagePath) {
                showToast('Foto berhasil diunggah ke cloud!');
            }
        } catch (err) {
            console.error('Upload error:', err);
            if (showToast) showToast('Gagal mengunggah foto. Coba lagi.', 'error');
        } finally {
            setUploadProgress(null);
        }
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

    // Hitung statistik per kategori
    const getCategoryCount = (cat) => {
        if (cat === 'Semua') return photos.length;
        return photos.filter(p => (p.category || 'Praktikum & Perkuliahan') === cat).length;
    };

    // Mendapatkan icon per kategori
    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'Praktikum & Perkuliahan': return 'book-open';
            case 'Makrab & Kebersamaan': return 'heart';
            case 'Seminar & Workshop': return 'presentation';
            case 'Kegiatan Luar': return 'map-pin';
            default: return 'image';
        }
    };

    // Warna gradient per kategori
    const getCategoryColor = (cat) => {
        switch (cat) {
            case 'Praktikum & Perkuliahan': return 'from-blue-500 to-indigo-600';
            case 'Makrab & Kebersamaan': return 'from-rose-500 to-pink-600';
            case 'Seminar & Workshop': return 'from-amber-500 to-orange-600';
            case 'Kegiatan Luar': return 'from-emerald-500 to-teal-600';
            default: return 'from-slate-600 to-slate-800';
        }
    };

    const getCategoryBadgeColor = (cat) => {
        switch (cat) {
            case 'Praktikum & Perkuliahan': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Makrab & Kebersamaan': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'Seminar & Workshop': return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Kegiatan Luar': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-8">
            {/* ── Header Section dengan Banner ── */}
            <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white text-xs font-semibold shadow-sm">
                                <Icon name="camera" className="w-3.5 h-3.5" />
                                Galeri Kenangan Kelas SI
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                Galeri & Kenangan
                            </h1>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                                Kumpulan momen berharga — dari praktikum di lab, diskusi kelompok, hingga kebersamaan di luar kampus. 
                                Setiap foto menyimpan cerita perjalanan kelas Sistem Informasi.
                            </p>

                            {/* Stats Ringkas */}
                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                        <Icon name="image" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 text-lg leading-none">{photos.length}</span>
                                        <span className="text-slate-500 text-xs ml-1">Foto</span>
                                    </div>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                                        <Icon name="folder" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 text-lg leading-none">
                                            {CATEGORIES.filter(c => c !== 'Semua' && getCategoryCount(c) > 0).length}
                                        </span>
                                        <span className="text-slate-500 text-xs ml-1">Kategori</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center gap-3 shrink-0">
                            {isAdmin ? (
                                <button
                                    onClick={openAdd}
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-semibold rounded-xl text-sm transition-all shadow-md hover:shadow-lg"
                                >
                                    <Icon name="plus" className="w-4 h-4" /> Tambah Kenangan
                                </button>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-xl text-slate-600 text-xs font-medium border border-slate-200">
                                    <Icon name="lock" className="w-3.5 h-3.5 text-slate-400" />
                                    Penambahan foto hanya oleh Admin
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Kategori Cards + Filter Bar ── */}
            <div className="space-y-5">
                {/* Kategori Cards — Visual Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CATEGORIES.filter(c => c !== 'Semua').map(cat => {
                        const count = getCategoryCount(cat);
                        const isActive = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(isActive ? 'Semua' : cat)}
                                className={`relative group p-4 rounded-xl border transition-all duration-200 text-left overflow-hidden ${
                                    isActive
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg ring-2 ring-slate-900/20'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                                    isActive
                                        ? 'bg-white/20'
                                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                }`}>
                                    <Icon name={getCategoryIcon(cat)} className="w-4.5 h-4.5" />
                                </div>
                                <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                    {cat}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className={`text-[11px] font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                        {count} foto
                                    </span>
                                    {isActive && (
                                        <span className="text-[10px] font-semibold text-white/80 bg-white/20 px-1.5 py-0.5 rounded">
                                            Aktif
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Filter Bar: Search + View Mode */}
                <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    {/* Tabs Kategori (Minimal) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {CATEGORIES.map(cat => {
                            const count = getCategoryCount(cat);
                            const isActive = selectedCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                                        isActive
                                            ? 'bg-slate-900 text-white font-semibold shadow-sm'
                                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                                    }`}
                                >
                                    {cat}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Input Pencarian */}
                        <div className="relative flex-1 sm:w-64">
                            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari kenangan..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 text-xs sm:text-sm bg-slate-50"
                            />
                        </div>
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <Icon name="layout-grid" className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('masonry')}
                                className={`p-1.5 rounded-md transition ${viewMode === 'masonry' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Masonry View"
                            >
                                <Icon name="columns" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Grid Kenangan / Dokumentasi ── */}
            {filteredPhotos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Icon name="image" className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Belum ada kenangan di sini</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                        {search
                            ? `Tidak ada foto yang cocok dengan pencarian "${search}".`
                            : selectedCategory !== 'Semua'
                                ? `Belum ada dokumentasi untuk kategori "${selectedCategory}".`
                                : 'Mulai abadikan momen-momen berharga kelas Sistem Informasi.'}
                    </p>
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition shadow-sm"
                        >
                            <Icon name="plus" className="w-4 h-4" /> Tambah Kenangan Pertama
                        </button>
                    )}
                </div>
            ) : (
                <div className={
                    viewMode === 'masonry'
                        ? 'columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'
                }>
                    {filteredPhotos.map((photo, index) => {
                        const category = photo.category || 'Praktikum & Perkuliahan';
                        // Buat variasi ukuran untuk masonry — foto pertama dan hero lebih besar
                        const isFeature = viewMode === 'grid' && (photo.isHero || index === 0);

                        return (
                            <div
                                key={photo.id}
                                className={`group bg-white rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col ${
                                    viewMode === 'masonry' ? 'break-inside-avoid' : ''
                                } ${
                                    isFeature && viewMode === 'grid' ? 'sm:col-span-2 sm:row-span-2' : ''
                                } ${
                                    photo.isHero
                                        ? 'border-amber-200 ring-1 ring-amber-100 hover:ring-2 hover:ring-amber-200 hover:shadow-xl'
                                        : 'border-slate-200 hover:border-slate-300 hover:shadow-xl'
                                }`}
                            >
                                {/* Frame Gambar dengan Overlay */}
                                <div
                                    className={`relative overflow-hidden bg-slate-100 cursor-pointer ${
                                        isFeature ? 'aspect-[16/12]' : 'aspect-[4/3]'
                                    }`}
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    <img
                                        src={photo.url}
                                        alt={photo.title}
                                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Gradient Overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                                        <div className="flex justify-end">
                                            <span className="p-2 rounded-xl bg-white/90 text-slate-900 shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                                <Icon name="maximize-2" className="w-4 h-4" />
                                            </span>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                                            <p className="text-white text-sm font-bold line-clamp-2 drop-shadow-lg">
                                                {photo.title}
                                            </p>
                                            <p className="text-white/70 text-xs mt-1 line-clamp-1">
                                                {formatDate(photo.date)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm border backdrop-blur-sm ${getCategoryBadgeColor(category)}`}>
                                            {category}
                                        </span>
                                        {photo.isHero && (
                                            <span className="px-2 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                                                <Icon name="star" className="w-3 h-3 fill-white" /> Hero
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Konten Keterangan */}
                                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        {/* Tanggal */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                                <Icon name="calendar" className="w-3 h-3" />
                                                {formatDate(photo.date)}
                                            </span>
                                        </div>

                                        {/* Judul */}
                                        <h3
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="font-bold text-slate-900 text-sm sm:text-base hover:text-blue-600 transition cursor-pointer line-clamp-2 leading-snug"
                                        >
                                            {photo.title}
                                        </h3>

                                        {/* Caption */}
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                            {photo.caption || 'Momen kenangan kelas Sistem Informasi.'}
                                        </p>
                                    </div>

                                    {/* Panel Admin Controls (Only Admin) */}
                                    {isAdmin && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                            {!photo.isHero ? (
                                                <button
                                                    onClick={(e) => handleSetHero(e, photo.id)}
                                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-amber-600 transition"
                                                    title="Pasang sebagai banner utama di Beranda"
                                                >
                                                    <Icon name="star" className="w-3.5 h-3.5" /> Jadikan Hero
                                                </button>
                                            ) : (
                                                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                                                    <Icon name="check" className="w-3.5 h-3.5" /> Hero Beranda
                                                </span>
                                            )}

                                            <div className="flex items-center gap-0.5">
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
                        );
                    })}
                </div>
            )}

            {/* ── Summary Footer ── */}
            {filteredPhotos.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                        <Icon name="image" className="w-3.5 h-3.5" />
                        Menampilkan <strong className="text-slate-900">{filteredPhotos.length}</strong> dari <strong className="text-slate-900">{photos.length}</strong> kenangan
                        {selectedCategory !== 'Semua' && (
                            <span className="text-slate-400">
                                — kategori: <strong className="text-slate-700">{selectedCategory}</strong>
                            </span>
                        )}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                        <Icon name="info" className="w-3 h-3" />
                        Klik foto untuk melihat detail
                    </span>
                </div>
            )}

            {/* ── Modal Lightbox (Perbesar Foto) ── */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setSelectedPhoto(null)}
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                >
                    <div
                        className="relative max-w-5xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'scaleIn 0.25s ease-out' }}
                    >
                        {/* Header Modal Lightbox */}
                        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getCategoryBadgeColor(selectedPhoto.category || 'Praktikum & Perkuliahan')}`}>
                                    {selectedPhoto.category || 'Dokumentasi'}
                                </span>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">{selectedPhoto.title}</h3>
                                    <p className="text-xs text-slate-400">{formatDate(selectedPhoto.date)}</p>
                                </div>
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

                        {/* Kontainer Gambar Penuh */}
                        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[450px]">
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

                            {/* Indikator foto ke berapa */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs font-medium backdrop-blur-sm">
                                {filteredPhotos.findIndex(p => p.id === selectedPhoto.id) + 1} / {filteredPhotos.length}
                            </div>
                        </div>

                        {/* Footer Deskripsi */}
                        <div className="p-4 sm:px-6 bg-white border-t border-slate-100">
                            <p className="text-sm text-slate-700 leading-relaxed">
                                {selectedPhoto.caption || 'Dokumentasi kenangan dan momen kelas Sistem Informasi.'}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                <div className="flex items-center gap-3">
                                    {selectedPhoto.isHero && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                            <Icon name="star" className="w-3 h-3" /> Hero Beranda
                                        </span>
                                    )}
                                </div>
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
                    title={modalMode === 'add' ? '📸 Tambah Kenangan Baru' : '✏️ Edit Dokumentasi'}
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

                                {/* Progress Bar Upload */}
                                {uploadProgress !== null && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>Mengunggah ke cloud...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
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
                        <FormField label="Judul Kenangan" required>
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

                            <FormField label="Tanggal Momen" required>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                    className={inputCls}
                                />
                            </FormField>
                        </div>

                        {/* Deskripsi / Caption */}
                        <FormField label="Cerita di Balik Kenangan">
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
                                {modalMode === 'add' ? '💾 Simpan Kenangan' : '✅ Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal Konfirmasi Hapus Foto ── */}
            {confirmDeleteId && (
                <ConfirmDialog
                    isOpen={true}
                    title="Hapus Kenangan"
                    message="Apakah Anda yakin ingin menghapus kenangan ini dari galeri kelas? Tindakan ini tidak dapat dibatalkan."
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
