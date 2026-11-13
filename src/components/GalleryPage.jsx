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

/**
 * Deteksi apakah item berupa video atau gambar
 */
export const isVideoMedia = (item) => {
    if (!item) return false;
    if (item.type === 'video') return true;
    if (typeof item.url === 'string') {
        if (item.url.startsWith('data:video')) return true;
        if (/\.(mp4|webm|mov|m4v|ogg|mkv|3gp)(\?.*)?$/i.test(item.url)) return true;
    }
    return false;
};

export default function GalleryPage({
    photos = [],
    isAdmin = false,
    adminHandlers,
    showToast,
    navigateTo,
}) {
    const [selectedCategory, setSelectedCategory] = useState('Semua');
    const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // 'all' | 'image' | 'video'
    const [search, setSearch] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'masonry'

    // Admin CRUD state
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
    const [editTarget, setEditTarget] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [form, setForm] = useState({
        url: '',
        title: '',
        category: 'Praktikum & Perkuliahan',
        caption: '',
        date: getTodayDate(),
        isHero: false,
        type: 'image', // 'image' | 'video'
    });

    const imageInputRef = useRef(null);
    const videoInputRef = useRef(null);

    // Hitung statistik
    const totalCount = photos.length;
    const imageCount = photos.filter(p => !isVideoMedia(p)).length;
    const videoCount = photos.filter(p => isVideoMedia(p)).length;

    // Filter media berdasarkan tipe, kategori, dan pencarian
    const filteredPhotos = photos.filter(item => {
        const isVid = isVideoMedia(item);
        const matchType =
            mediaTypeFilter === 'all' ||
            (mediaTypeFilter === 'video' && isVid) ||
            (mediaTypeFilter === 'image' && !isVid);

        const matchCategory =
            selectedCategory === 'Semua' || (item.category || 'Praktikum & Perkuliahan') === selectedCategory;

        const matchSearch =
            search.trim() === '' ||
            (item.title && item.title.toLowerCase().includes(search.toLowerCase())) ||
            (item.caption && item.caption.toLowerCase().includes(search.toLowerCase())) ||
            (item.category && item.category.toLowerCase().includes(search.toLowerCase()));

        return matchType && matchCategory && matchSearch;
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

    // Handle Upload Gambar dari Laptop / HP
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (showToast) showToast('Silakan pilih file gambar (JPG, PNG, WebP)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
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

                const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
                setForm(f => ({
                    ...f,
                    url: compressedUrl,
                    type: 'image',
                    title: f.title || file.name.replace(/\.[^/.]+$/, ''),
                }));
                if (showToast) showToast('Foto berhasil dimuat & siap disimpan', 'success');
            };
            img.src = event.target?.result;
        };
        reader.readAsDataURL(file);
    };

    // Handle Upload Video dari Laptop / HP
    const handleVideoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|m4v|ogg|mkv|3gp)$/i.test(file.name)) {
            if (showToast) showToast('Silakan pilih file video (MP4, WebM, MOV)', 'error');
            return;
        }

        // Cek ukuran (maksimal 150MB)
        if (file.size > 150 * 1024 * 1024) {
            if (showToast) showToast('Ukuran video melebihi batas 150MB', 'error');
            return;
        }

        setIsUploading(true);
        setUploadProgress(15);

        try {
            const res = await uploadImage(file, 'gallery', (p) => setUploadProgress(p));
            setForm(f => ({
                ...f,
                url: res.url,
                type: 'video',
                title: f.title || file.name.replace(/\.[^/.]+$/, ''),
            }));
            if (showToast) showToast('Video berhasil diunggah & siap disimpan ke database!', 'success');
        } catch (err) {
            console.error('Upload video error:', err);
            if (showToast) showToast('Gagal mengunggah video: ' + err.message, 'error');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Admin: Buka Modal Tambah
    const openAdd = (initialType = 'image') => {
        if (!isAdmin) return;
        setForm({
            url: '',
            title: '',
            category: 'Praktikum & Perkuliahan',
            caption: '',
            date: getTodayDate(),
            isHero: photos.length === 0,
            type: initialType,
        });
        setEditTarget(null);
        setModalMode('add');
    };

    // Admin: Buka Modal Edit
    const openEdit = (e, photo) => {
        e.stopPropagation();
        if (!isAdmin) return;
        const isVid = isVideoMedia(photo);
        setForm({
            url: photo.url || '',
            title: photo.title || '',
            category: photo.category || 'Praktikum & Perkuliahan',
            caption: photo.caption || '',
            date: photo.date || getTodayDate(),
            isHero: !!photo.isHero,
            type: photo.type || (isVid ? 'video' : 'image'),
        });
        setEditTarget(photo);
        setModalMode('edit');
    };

    // Admin: Simpan Data Foto / Video
    const handleSave = () => {
        if (!isAdmin) return;
        if (!form.url.trim()) {
            if (showToast) showToast('Silakan pilih berkas foto atau video terlebih dahulu', 'error');
            return;
        }
        if (!form.title.trim()) {
            if (showToast) showToast('Judul dokumentasi wajib diisi', 'error');
            return;
        }

        const payload = {
            ...form,
            type: form.type || (isVideoMedia(form) ? 'video' : 'image'),
        };

        if (modalMode === 'add') {
            adminHandlers.classPhoto.add(payload);
        } else if (modalMode === 'edit' && editTarget) {
            adminHandlers.classPhoto.update(editTarget.id, payload);
        }
        setModalMode(null);
    };

    // Admin: Hapus Dokumentasi
    const handleDelete = () => {
        if (!confirmDeleteId) return;
        adminHandlers.classPhoto.delete(confirmDeleteId);
        setConfirmDeleteId(null);
        if (selectedPhoto?.id === confirmDeleteId) {
            setSelectedPhoto(null);
        }
        if (showToast) showToast('Dokumentasi telah dihapus dari database', 'error');
    };

    // Admin: Set sebagai Hero di beranda
    const handleSetHero = (e, photoId) => {
        e.stopPropagation();
        adminHandlers.classPhoto.setHero(photoId);
        if (showToast) showToast('Media ini telah dijadikan Banner Utama di Beranda');
    };

    // Hitung statistik per kategori
    const getCategoryCount = (cat) => {
        if (cat === 'Semua') return photos.length;
        return photos.filter(p => (p.category || 'Praktikum & Perkuliahan') === cat).length;
    };

    // Icon per kategori
    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'Praktikum & Perkuliahan': return 'book-open';
            case 'Makrab & Kebersamaan': return 'heart';
            case 'Seminar & Workshop': return 'presentation';
            case 'Kegiatan Luar': return 'map-pin';
            default: return 'image';
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
            {/* ── Header Section dengan Banner Estetik ── */}
            <div className="relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Background Pattern & Glow Accent */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-gradient-to-br from-rose-500/10 via-amber-500/10 to-blue-500/10 blur-3xl pointer-events-none" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                <div className="relative p-6 sm:p-8 lg:p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-900 to-slate-800 text-white text-xs font-semibold shadow-sm">
                                <span className="flex h-2 w-2 rounded-full bg-rose-400 animate-ping" />
                                <Icon name="film" className="w-3.5 h-3.5 text-rose-300" />
                                Galeri & Kenangan Multimedia SI
                            </div>

                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                Galeri Foto & Video Kelas
                            </h1>

                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                                Kumpulan rekaman video dan foto momen berharga — dari praktikum di laboratorium,
                                presentasi proyek, hingga kebersamaan di luar kampus. Simpan setiap langkah perjalanan kelas S1 Sistem Informasi.
                            </p>

                            {/* Stats Ringkas */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                                        <Icon name="sparkles" className="w-4 h-4 text-amber-300" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 text-base leading-none">{totalCount}</span>
                                        <span className="text-slate-500 text-xs ml-1">Total Kenangan</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-200">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                                        <Icon name="camera" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-blue-900 text-base leading-none">{imageCount}</span>
                                        <span className="text-blue-600 text-xs ml-1">Foto</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-50/70 border border-rose-200">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-xs">
                                        <Icon name="video" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-rose-900 text-base leading-none">{videoCount}</span>
                                        <span className="text-rose-600 text-xs ml-1 font-semibold">Video</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                                        <Icon name="folder" className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-slate-900 text-base leading-none">
                                            {CATEGORIES.filter(c => c !== 'Semua' && getCategoryCount(c) > 0).length}
                                        </span>
                                        <span className="text-slate-500 text-xs ml-1">Kategori</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tombol Aksi Admin */}
                        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                            {isAdmin ? (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openAdd('video')}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-rose-600/25 active:scale-95"
                                    >
                                        <Icon name="video" className="w-4 h-4" />
                                        <span>Unggah Video</span>
                                    </button>
                                    <button
                                        onClick={() => openAdd('image')}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-95"
                                    >
                                        <Icon name="plus" className="w-4 h-4" />
                                        <span>Unggah Foto</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 rounded-xl text-slate-600 text-xs font-medium border border-slate-200">
                                    <Icon name="lock" className="w-3.5 h-3.5 text-slate-400" />
                                    Pengunggahan hanya oleh Admin Kelas
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Kategori Cards + Filter Bar Multimedia ── */}
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
                                className={`relative group p-4 rounded-2xl border transition-all duration-200 text-left overflow-hidden ${
                                    isActive
                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg ring-2 ring-slate-900/20'
                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                                    isActive
                                        ? 'bg-white/20 text-white'
                                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                }`}>
                                    <Icon name={getCategoryIcon(cat)} className="w-4.5 h-4.5" />
                                </div>
                                <p className={`text-xs font-bold leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>
                                    {cat}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                    <span className={`text-[11px] font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>
                                        {count} berkas
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

                {/* Filter Bar: Media Tabs (Semua / Foto / Video) + Search + View Mode */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
                    {/* Media Type Filter Tabs (Semua / Foto / Video) */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
                        <button
                            onClick={() => setMediaTypeFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                                mediaTypeFilter === 'all'
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>🌟 Semua Kenangan</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10px]">
                                {totalCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setMediaTypeFilter('image')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                                mediaTypeFilter === 'image'
                                    ? 'bg-white text-blue-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Icon name="camera" className="w-3.5 h-3.5 text-blue-500" />
                            <span>Foto</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 text-[10px]">
                                {imageCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setMediaTypeFilter('video')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                                mediaTypeFilter === 'video'
                                    ? 'bg-white text-rose-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Icon name="video" className="w-3.5 h-3.5 text-rose-500" />
                            <span>Video Dokumentasi</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 text-[10px]">
                                {videoCount}
                            </span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 flex-1 justify-end">
                        {/* Input Pencarian */}
                        <div className="relative flex-1 max-w-md">
                            <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari foto, video atau topik momen..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 text-xs sm:text-sm bg-slate-50"
                            />
                        </div>

                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200 shrink-0">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Grid View"
                            >
                                <Icon name="layout-grid" className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('masonry')}
                                className={`p-2 rounded-lg transition ${viewMode === 'masonry' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Masonry View"
                            >
                                <Icon name="columns" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Grid Kenangan (Foto & Video) ── */}
            {filteredPhotos.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
                        <Icon name={mediaTypeFilter === 'video' ? 'video' : 'image'} className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-800">
                            {mediaTypeFilter === 'video'
                                ? 'Belum ada video dokumentasi di sini'
                                : 'Belum ada kenangan di sini'}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                            {search
                                ? `Tidak ada dokumentasi yang cocok dengan kata kunci "${search}".`
                                : mediaTypeFilter === 'video'
                                    ? 'Admin kelas dapat mengunggah video kegiatan praktikum atau makrab langsung dari HP atau Laptop.'
                                    : selectedCategory !== 'Semua'
                                        ? `Belum ada dokumentasi untuk kategori "${selectedCategory}".`
                                        : 'Mulai abadikan momen berharga kelas Sistem Informasi dengan foto dan video.'}
                        </p>
                    </div>

                    {isAdmin && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                onClick={() => openAdd('video')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:from-rose-500 hover:to-red-500 transition shadow-md shadow-rose-600/25 active:scale-95"
                            >
                                <Icon name="video" className="w-4 h-4" /> Unggah Video Dokumentasi
                            </button>
                            <button
                                onClick={() => openAdd('image')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-800 transition shadow-sm active:scale-95"
                            >
                                <Icon name="plus" className="w-4 h-4" /> Tambah Foto
                            </button>
                        </div>
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
                        const isVid = isVideoMedia(photo);
                        const isFeature = viewMode === 'grid' && (photo.isHero || (index === 0 && filteredPhotos.length > 3));

                        return (
                            <div
                                key={photo.id}
                                className={`group bg-white rounded-3xl border overflow-hidden transition-all duration-300 flex flex-col ${
                                    viewMode === 'masonry' ? 'break-inside-avoid' : ''
                                } ${
                                    isFeature && viewMode === 'grid' ? 'sm:col-span-2 sm:row-span-2' : ''
                                } ${
                                    photo.isHero
                                        ? 'border-amber-300 ring-2 ring-amber-100 hover:ring-3 hover:ring-amber-200 hover:shadow-2xl'
                                        : 'border-slate-200 hover:border-slate-300 hover:shadow-2xl'
                                }`}
                            >
                                {/* Media Container (Foto atau Video Preview) */}
                                <div
                                    className={`relative overflow-hidden bg-slate-950 cursor-pointer ${
                                        isFeature ? 'aspect-[16/11]' : 'aspect-[4/3]'
                                    }`}
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    {isVid ? (
                                        <div className="relative w-full h-full">
                                            <video
                                                src={photo.url}
                                                preload="metadata"
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
                                            />
                                            {/* Glowing Center Play Button */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 backdrop-blur-md border border-white/30 group-hover:scale-110 group-hover:shadow-rose-600/60 transition-all duration-300">
                                                    <Icon name="play" className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5 fill-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={photo.url}
                                            alt={photo.title}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    )}

                                    {/* Hover Dark Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4 pointer-events-none">
                                        <div className="flex justify-end">
                                            <span className="p-2 rounded-xl bg-white/95 text-slate-900 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                                <Icon name={isVid ? 'play' : 'maximize-2'} className="w-4 h-4" />
                                            </span>
                                        </div>
                                        <div className="transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                                            <p className="text-white text-sm font-bold line-clamp-2 drop-shadow-md">
                                                {photo.title}
                                            </p>
                                            <p className="text-white/80 text-xs mt-1 flex items-center gap-1.5">
                                                {isVid ? (
                                                    <span className="text-rose-300 font-semibold flex items-center gap-1">
                                                        <Icon name="play-circle" className="w-3.5 h-3.5" /> Putar Video Kenangan
                                                    </span>
                                                ) : (
                                                    <span>{formatDate(photo.date)}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badges di pojok kiri atas */}
                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
                                        {isVid ? (
                                            <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-extrabold shadow-md flex items-center gap-1 border border-white/20">
                                                <Icon name="video" className="w-3 h-3" /> Video
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-1 rounded-lg bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-bold shadow-md flex items-center gap-1 border border-white/20">
                                                <Icon name="camera" className="w-3 h-3 text-sky-300" /> Foto
                                            </span>
                                        )}

                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm border backdrop-blur-md ${getCategoryBadgeColor(category)}`}>
                                            {category}
                                        </span>

                                        {photo.isHero && (
                                            <span className="px-2 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold shadow-md flex items-center gap-1 border border-white/20">
                                                <Icon name="star" className="w-3 h-3 fill-white" /> Hero
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Detail Card */}
                                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                                    <div>
                                        {/* Tanggal & Media Type */}
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                                            <span className="inline-flex items-center gap-1">
                                                <Icon name="calendar" className="w-3 h-3" />
                                                {formatDate(photo.date)}
                                            </span>
                                            {isVid && (
                                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                                    <Icon name="film" className="w-3 h-3" /> Video Siap Putar
                                                </span>
                                            )}
                                        </div>

                                        {/* Judul */}
                                        <h3
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="font-bold text-slate-900 text-sm sm:text-base hover:text-rose-600 transition cursor-pointer line-clamp-2 leading-snug"
                                        >
                                            {photo.title}
                                        </h3>

                                        {/* Caption */}
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                            {photo.caption || (isVid ? 'Dokumentasi video kegiatan kelas Sistem Informasi.' : 'Momen kenangan kelas Sistem Informasi.')}
                                        </p>
                                    </div>

                                    {/* Panel Admin Controls */}
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
                        );
                    })}
                </div>
            )}

            {/* ── Summary Footer ── */}
            {filteredPhotos.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 shadow-xs">
                    <span className="flex items-center gap-1.5 flex-wrap">
                        <Icon name="sparkles" className="w-3.5 h-3.5 text-amber-500" />
                        Menampilkan <strong className="text-slate-900">{filteredPhotos.length}</strong> dari <strong className="text-slate-900">{photos.length}</strong> kenangan
                        {mediaTypeFilter !== 'all' && (
                            <span className="text-slate-500">
                                · tipe: <strong className="text-slate-800">{mediaTypeFilter === 'video' ? '🎬 Video' : '📸 Foto'}</strong>
                            </span>
                        )}
                        {selectedCategory !== 'Semua' && (
                            <span className="text-slate-500">
                                · kategori: <strong className="text-slate-800">{selectedCategory}</strong>
                            </span>
                        )}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                        <Icon name="info" className="w-3 h-3" />
                        Klik kartu untuk memutar video atau memperbesar foto
                    </span>
                </div>
            )}

            {/* ── Modal Lightbox Multimedia (Cinema Video Player & Photo Zoom) ── */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
                    onClick={() => setSelectedPhoto(null)}
                    style={{ animation: 'fadeIn 0.2s ease-out' }}
                >
                    <div
                        className="relative max-w-5xl w-full bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: 'scaleIn 0.25s ease-out' }}
                    >
                        {/* Header Modal Lightbox */}
                        <div className="p-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-slate-900/90 text-white">
                            <div className="flex items-center gap-3">
                                {isVideoMedia(selectedPhoto) ? (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center gap-1 shadow-sm">
                                        <Icon name="video" className="w-3.5 h-3.5" /> Video Dokumentasi
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-sky-300 border border-white/10 flex items-center gap-1">
                                        <Icon name="camera" className="w-3.5 h-3.5" /> Foto Kenangan
                                    </span>
                                )}
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-white line-clamp-1">{selectedPhoto.title}</h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-2">
                                        <span>{formatDate(selectedPhoto.date)}</span>
                                        <span>•</span>
                                        <span className="text-slate-300">{selectedPhoto.category || 'Praktikum & Perkuliahan'}</span>
                                    </p>
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
                                        className="px-3 py-1.5 rounded-xl bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 transition text-xs font-semibold flex items-center gap-1.5"
                                        title="Edit Dokumentasi"
                                    >
                                        <Icon name="pencil" className="w-3.5 h-3.5" /> Edit
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedPhoto(null)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                                >
                                    <Icon name="x" className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Player Frame (Cinema Style) */}
                        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[300px] sm:min-h-[480px]">
                            {isVideoMedia(selectedPhoto) ? (
                                <video
                                    src={selectedPhoto.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain bg-black shadow-2xl"
                                />
                            ) : (
                                <img
                                    src={selectedPhoto.url}
                                    alt={selectedPhoto.title}
                                    className="max-h-[70vh] w-auto max-w-full object-contain"
                                />
                            )}

                            {/* Tombol Sebelumnya */}
                            <button
                                onClick={handlePrevPhoto}
                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900/90 text-white transition backdrop-blur-md border border-white/15"
                                title="Media Sebelumnya"
                            >
                                <Icon name="chevron-left" className="w-6 h-6" />
                            </button>

                            {/* Tombol Selanjutnya */}
                            <button
                                onClick={handleNextPhoto}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900/90 text-white transition backdrop-blur-md border border-white/15"
                                title="Media Selanjutnya"
                            >
                                <Icon name="chevron-right" className="w-6 h-6" />
                            </button>

                            {/* Indikator media ke berapa */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-black/70 text-white text-xs font-mono backdrop-blur-md border border-white/10">
                                {filteredPhotos.findIndex(p => p.id === selectedPhoto.id) + 1} / {filteredPhotos.length}
                            </div>
                        </div>

                        {/* Footer Deskripsi & Aksi */}
                        <div className="p-4 sm:px-6 bg-slate-900/95 border-t border-white/10 text-slate-200">
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {selectedPhoto.caption || 'Dokumentasi kenangan dan momen kelas Sistem Informasi.'}
                            </p>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10 text-xs">
                                <div className="flex items-center gap-3">
                                    {selectedPhoto.isHero && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold">
                                            <Icon name="star" className="w-3 h-3 fill-amber-300" /> Hero Utama Beranda
                                        </span>
                                    )}
                                </div>
                                <a
                                    href={selectedPhoto.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1.5 font-semibold text-xs border border-white/10"
                                >
                                    <Icon name="external-link" className="w-3.5 h-3.5" /> Buka Berkas Asli
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Admin: Tambah / Edit Dokumentasi (Foto & Video) ── */}
            {modalMode && isAdmin && (
                <Modal
                    title={
                        modalMode === 'add'
                            ? form.type === 'video'
                                ? '🎬 Unggah Video Dokumentasi Kelas'
                                : '📸 Unggah Foto Kenangan Kelas'
                            : '✏️ Edit Dokumentasi Kelas'
                    }
                    isOpen={true}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        {/* Tab Switcher Media Type (Foto vs Video) */}
                        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => {
                                    if (form.type !== 'image') {
                                        setForm(f => ({ ...f, type: 'image', url: '' }));
                                    }
                                }}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                    form.type === 'image'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Icon name="camera" className="w-4 h-4 text-blue-600" />
                                <span>Foto Kenangan</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (form.type !== 'video') {
                                        setForm(f => ({ ...f, type: 'video', url: '' }));
                                    }
                                }}
                                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                                    form.type === 'video'
                                        ? 'bg-white text-rose-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Icon name="video" className="w-4 h-4 text-rose-600" />
                                <span>Video Dokumentasi</span>
                            </button>
                        </div>

                        {/* Hidden File Inputs */}
                        <input
                            type="file"
                            ref={imageInputRef}
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <input
                            type="file"
                            ref={videoInputRef}
                            accept="video/mp4,video/webm,video/quicktime,video/mov,video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                        />

                        {/* Dropzone & Preview Berkas */}
                        {form.type === 'video' ? (
                            /* UPLOAD VIDEO */
                            !form.url ? (
                                <div
                                    onClick={() => !isUploading && videoInputRef.current?.click()}
                                    className={`cursor-pointer border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition group space-y-3 ${
                                        isUploading
                                            ? 'border-rose-400 bg-rose-50/50 cursor-wait'
                                            : 'border-rose-300 hover:border-rose-500 bg-rose-50/60 hover:bg-rose-50/90'
                                    }`}
                                >
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-600/10 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                        <Icon name={isUploading ? 'loader' : 'video'} className={`w-7 h-7 ${isUploading ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-800">
                                            {isUploading ? 'Mengunggah video ke server...' : 'Pilih Video dari Laptop atau HP'}
                                        </p>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                            Format didukung: MP4, WebM, MOV langsung dari galeri / kamera HP atau file manager laptop (Maksimal 150MB).
                                        </p>
                                    </div>

                                    {isUploading ? (
                                        <div className="w-full max-w-xs mx-auto space-y-1.5 pt-2">
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-rose-500 to-amber-500 h-full transition-all duration-300"
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-bold text-rose-700">{uploadProgress}% Selesai</span>
                                        </div>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition">
                                            <Icon name="upload" className="w-3.5 h-3.5" />
                                            Pilih Berkas Video
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-slate-200 bg-black shadow-md group">
                                        <video
                                            src={form.url}
                                            controls
                                            className="h-full w-full object-contain bg-black"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <button
                                                type="button"
                                                onClick={() => videoInputRef.current?.click()}
                                                className="px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 hover:bg-slate-900 backdrop-blur-md"
                                            >
                                                <Icon name="refresh-cw" className="w-3.5 h-3.5" /> Ganti Video
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs px-1">
                                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                            <Icon name="check-circle" className="w-4 h-4" /> Berkas video siap disimpan ke database
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => videoInputRef.current?.click()}
                                            className="text-rose-600 hover:underline font-bold text-xs"
                                        >
                                            Ganti video lain
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            /* UPLOAD FOTO */
                            !form.url ? (
                                <div
                                    onClick={() => imageInputRef.current?.click()}
                                    className="cursor-pointer border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-3xl bg-blue-50/60 hover:bg-blue-50/90 p-6 sm:p-8 text-center transition group space-y-3"
                                >
                                    <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                        <Icon name="image" className="w-7 h-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-slate-800">
                                            Pilih Foto Kenangan dari Laptop atau HP
                                        </p>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                            Pilih foto dari Galeri & Kamera HP atau Laptop/PC (JPG, PNG, WebP). Otomatis dioptimalkan untuk performa cepat.
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition">
                                        <Icon name="image-plus" className="w-3.5 h-3.5" />
                                        Pilih Berkas Gambar
                                    </span>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 shadow-md group">
                                        <img
                                            src={form.url}
                                            alt="Preview Foto"
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                                            <button
                                                type="button"
                                                onClick={() => imageInputRef.current?.click()}
                                                className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-lg transition flex items-center gap-1.5 hover:bg-slate-100"
                                            >
                                                <Icon name="refresh-cw" className="w-3.5 h-3.5" /> Ganti Gambar
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs px-1">
                                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                            <Icon name="check-circle" className="w-4 h-4" /> Berkas foto siap disimpan ke database
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => imageInputRef.current?.click()}
                                            className="text-blue-600 hover:underline font-bold text-xs"
                                        >
                                            Pilih foto lain
                                        </button>
                                    </div>
                                </div>
                            )
                        )}

                        {/* Judul */}
                        <FormField label={form.type === 'video' ? 'Judul Video Dokumentasi' : 'Judul Foto Kenangan'} required>
                            <input
                                type="text"
                                placeholder={form.type === 'video' ? 'Contoh: Rekaman Suasana Presentasi & Diskusi Kelompok UI/UX' : 'Contoh: Praktikum Basis Data di Laboratorium'}
                                value={form.title}
                                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                className={inputCls}
                            />
                        </FormField>

                        {/* Kategori & Tanggal */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField label="Kategori Kegiatan" required>
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

                            <FormField label="Tanggal Dokumentasi" required>
                                <input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                                    className={inputCls}
                                />
                            </FormField>
                        </div>

                        {/* Deskripsi / Caption */}
                        <FormField label="Cerita di Balik Momen Ini">
                            <textarea
                                rows={3}
                                placeholder="Ceritakan keseruan atau catatan penting dari kegiatan ini..."
                                value={form.caption}
                                onChange={(e) => setForm(f => ({ ...f, caption: e.target.value }))}
                                className={inputCls}
                            />
                        </FormField>

                        {/* Opsi Jadikan Banner Beranda */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-slate-800 block">Jadikan Banner Utama di Beranda</span>
                                <span className="text-[11px] text-slate-500">Tampilkan media ini pada kartu sorotan utama halaman Beranda</span>
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
                                disabled={isUploading}
                                className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl transition shadow-md active:scale-95 flex items-center gap-1.5 ${
                                    form.type === 'video'
                                        ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/25'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
                                }`}
                            >
                                <Icon name="check" className="w-3.5 h-3.5" />
                                {modalMode === 'add' ? 'Simpan ke Database' : 'Perbarui di Database'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal Konfirmasi Hapus ── */}
            {confirmDeleteId && (
                <ConfirmDialog
                    isOpen={true}
                    title="Hapus Dokumentasi"
                    message="Apakah Anda yakin ingin menghapus kenangan ini dari galeri kelas? Tindakan ini akan menghapusnya dari database dan tidak dapat dibatalkan."
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
                    from { opacity: 0; transform: scale(0.96); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
