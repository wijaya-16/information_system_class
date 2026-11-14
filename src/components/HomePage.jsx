import React, { useState, useRef, useEffect, useMemo } from "react";
import Icon from "./Icons";
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from "./Modal";
import { uploadImage } from "../lib/storage";

const isVideoMedia = (item) => {
    if (!item) return false;
    if (item.type === 'video') return true;
    if (typeof item.url === 'string') {
        if (item.url.startsWith('data:video')) return true;
        if (/\.(mp4|webm|mov|m4v|ogg|mkv|3gp)(\?.*)?$/i.test(item.url)) return true;
    }
    return false;
};

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
};

const getFormattedToday = () => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
};

// Jadwal Kuliah Semester 3 Kelas Sistem Informasi
const CLASS_SCHEDULE = {
    'Senin': [
        { course: 'Manajemen Database', time: '08.00 - 10.30 WITA', room: 'Lab Basis Data', lecturer: 'Salman, S.ST., M.TI', type: 'Teori & Lab', credits: 3 },
        { course: 'Agama', time: '10.45 - 12.15 WITA', room: 'Ruang Teori 204', lecturer: 'Agus Marjan Saputra, SEI.,MSEI', type: 'Teori', credits: 2 },
    ],
    'Selasa': [
        { course: 'Teknologi Web', time: '08.00 - 10.30 WITA', room: 'Lab Pemrograman 1', lecturer: 'Dr. Muhammad Multazam, S.Kom., M.Kom', type: 'Praktik', credits: 3 },
        { course: 'Pemrograman Berorientasi Objek', time: '10.45 - 13.15 WITA', room: 'Lab Software', lecturer: 'Dr. Maspaeni, M. Kom', type: 'Praktik', credits: 3 },
    ],
    'Rabu': [
        { course: 'UI/UX Design', time: '08.00 - 11.30 WITA', room: 'Lab Multimedia & UI', lecturer: 'Zumratul Muaihidin, M.Kom', type: 'Teori & Praktik', credits: 4 },
    ],
    'Kamis': [
        { course: 'E-Business', time: '08.00 - 10.30 WITA', room: 'Ruang Teori 205', lecturer: 'Zulpan Hadi, M.Kom.', type: 'Teori', credits: 3 },
        { course: 'Technopreneurship 1', time: '10.45 - 12.15 WITA', room: 'Ruang Teori 205', lecturer: 'Dr. Dwinita Arwidiyanti, M.Kom.', type: 'Teori', credits: 2 },
    ],
    'Jumat': [
        { course: 'Sistem Operasi', time: '08.00 - 10.30 WITA', room: 'Lab Jaringan & OS', lecturer: 'Ahmad Yani, S.Kom., M.Kom', type: 'Teori & Praktik', credits: 3 },
    ],
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
    const materials = data.materials || [];
    const assignments = data.assignments || [];
    const announcements = data.announcements || [];
    const events = data.events || [];
    const courses = data.courses || [];
    const members = data.members || {};
    const submissions = data.submissions || [];

    // Hari saat ini untuk filter jadwal default
    const currentDayName = useMemo(() => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const day = days[new Date().getDay()];
        return CLASS_SCHEDULE[day] ? day : 'Senin';
    }, []);

    const [selectedDay, setSelectedDay] = useState(currentDayName);
    const [infoTab, setInfoTab] = useState('pengumuman'); // 'pengumuman' | 'agenda'

    // Koleksi foto untuk Hero Carousel / Showcase
    const heroPhotosList = useMemo(() => {
        if (!classPhotos || classPhotos.length === 0) return [];
        // Prioritaskan foto berstatus hero di urutan awal
        return [...classPhotos].sort((a, b) => (b.isHero ? 1 : 0) - (a.isHero ? 1 : 0));
    }, [classPhotos]);

    const [heroActiveIndex, setHeroActiveIndex] = useState(0);
    const [isHeroHovered, setIsHeroHovered] = useState(false);

    // Auto rotate slide foto hero secara halus tiap 6 detik jika mouse tidak hover
    useEffect(() => {
        if (heroPhotosList.length <= 1 || isHeroHovered) return;
        const timer = setInterval(() => {
            setHeroActiveIndex((prev) => (prev + 1) % heroPhotosList.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [heroPhotosList.length, isHeroHovered]);

    // Current hero photo
    const currentHeroPhoto = heroPhotosList[heroActiveIndex] || heroPhotosList[0] || null;
    const heroPhoto = currentHeroPhoto; // kompatibilitas ke fungsi lain

    // Real-time jam digital
    const [currentTimeString, setCurrentTimeString] = useState(() => {
        const d = new Date();
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    });

    useEffect(() => {
        const clockTimer = setInterval(() => {
            const d = new Date();
            setCurrentTimeString(d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }, 10000);
        return () => clearInterval(clockTimer);
    }, []);

    // Konfigurasi ucapan waktu dinamis & ikon
    const greetingDetails = useMemo(() => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) {
            return { greeting: 'Selamat Pagi', icon: 'sunrise', tag: 'Awali hari dengan energi belajar!' };
        }
        if (hour >= 11 && hour < 15) {
            return { greeting: 'Selamat Siang', icon: 'sun', tag: 'Tetap produktif dan jaga semangat kuliah.' };
        }
        if (hour >= 15 && hour < 18) {
            return { greeting: 'Selamat Sore', icon: 'sunset', tag: 'Review materi & cek tenggat tugas hari ini.' };
        }
        return { greeting: 'Selamat Malam', icon: 'moon', tag: 'Waktu istirahat & persiapan kuliah esok.' };
    }, []);

    // Perkuliahan hari ini untuk quick alert di Hero
    const todayClasses = useMemo(() => {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const day = days[new Date().getDay()];
        return CLASS_SCHEDULE[day] || [];
    }, []);

    // Avatar mahasiswa untuk preview komunitas di Hero
    const memberAvatars = useMemo(() => {
        return Object.entries(members).slice(0, 5).map(([code, m]) => ({
            code,
            name: m.fullname || `Mahasiswa ${code}`,
            photo: m.photo,
            gender: m.gender,
        }));
    }, [members]);

    // State Lightbox (Lihat foto penuh)
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Auto-scroll ke galeri jika dibuka dengan initialTab galeri
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

    // State Modal Admin Foto
    const [photoModal, setPhotoModal] = useState(null);
    const [editPhotoTarget, setEditPhotoTarget] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [photoForm, setPhotoForm] = useState({
        url: '',
        title: '',
        caption: '',
        date: getTodayDate(),
        isHero: false,
    });

    const fileInputRef = useRef(null);

    // Kompresi otomatis file gambar atau upload video
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type.startsWith('video/')) {
            try {
                if (showToast) showToast('Sedang memproses video...', 'info');
                const res = await uploadImage(file, 'gallery');
                setPhotoForm(f => ({
                    ...f,
                    url: res.url,
                    type: 'video',
                    title: f.title || file.name.replace(/\.[^/.]+$/, ''),
                }));
                if (showToast) showToast('Video siap disimpan ke database!', 'success');
            } catch (err) {
                if (showToast) showToast('Gagal memuat video: ' + err.message, 'error');
            }
            return;
        }

        if (!file.type.startsWith('image/')) {
            if (showToast) showToast('Silakan pilih file gambar atau video', 'error');
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
                setPhotoForm(f => ({
                    ...f,
                    url: compressedUrl,
                    type: 'image',
                    title: f.title || file.name.replace(/\.[^/.]+$/, ''),
                }));
            };
            img.src = event.target?.result;
        };
        reader.readAsDataURL(file);
    };

    const openAddPhoto = (asHero = false) => {
        if (!isAdmin) return;
        setPhotoForm({
            url: '',
            title: '',
            category: 'Praktikum & Perkuliahan',
            caption: '',
            date: getTodayDate(),
            isHero: asHero || classPhotos.length === 0,
        });
        setEditPhotoTarget(null);
        setPhotoModal('add');
    };

    const openEditPhoto = (photo) => {
        if (!isAdmin) return;
        setPhotoForm({
            url: photo.url,
            title: photo.title,
            category: photo.category || 'Praktikum & Perkuliahan',
            caption: photo.caption || '',
            date: photo.date || getTodayDate(),
            isHero: !!photo.isHero,
        });
        setEditPhotoTarget(photo);
        setPhotoModal('edit');
    };

    const handleSavePhoto = () => {
        if (!isAdmin) return;
        if (!photoForm.url.trim()) {
            if (showToast) showToast('Silakan pilih file gambar dari perangkat Anda (Laptop/HP)', 'error');
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

    const handleDeletePhoto = () => {
        if (!confirmDeleteId) return;
        adminHandlers.classPhoto.delete(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    const handleSetAsHero = (id) => {
        adminHandlers.classPhoto.setHero(id);
    };

    // Hitung status tugas pengguna jika login sebagai mahasiswa
    const studentStats = useMemo(() => {
        if (isAdmin || !user?.nim) return null;
        const mySubmissions = submissions.filter(s => s.nim === user.nim);
        const total = assignments.length;
        const completed = mySubmissions.length;
        const pending = Math.max(0, total - completed);
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;
        return { total, completed, pending, percentage };
    }, [user, isAdmin, assignments, submissions]);

    const totalMembers = Object.keys(members).length;

    return (
        <div className="space-y-10">
            {/* ── 1. HERO SECTION: SPEKTAKULER MODERN STUDENT HUB ── */}
            <div className="relative rounded-3xl bg-gradient-to-br from-slate-950 via-[#0f172a] to-indigo-950 text-white p-6 sm:p-8 lg:p-10 shadow-2xl overflow-hidden border border-white/[0.08] transition-all duration-300">
                {/* Background Ambient Glow Orbs (Animated) */}
                <div className="absolute -right-24 -top-24 w-[420px] h-[420px] bg-blue-500/15 rounded-full blur-[100px] pointer-events-none hero-animate-glow" />
                <div className="absolute -left-20 -bottom-24 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none hero-animate-glow" style={{ animationDelay: '3s' }} />
                <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none hero-animate-glow" style={{ animationDelay: '1.5s' }} />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

                {/* Dot Grid Pattern */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 0.7px, transparent 0)`,
                        backgroundSize: '20px 20px',
                    }}
                />
                {/* Horizontal accent line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />

                <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                    {/* ═══ Sisi Kiri: Sambutan & Info Personal (7 Kolom) ═══ */}
                    <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
                        {/* Header Badges: Tanggal, Waktu & Semester */}
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs font-semibold hero-animate-entrance">
                            <div className="hero-glass inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-slate-200 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
                                <span>{getFormattedToday()}</span>
                                <span className="text-white/30">|</span>
                                <span className="text-cyan-300 font-mono tracking-wider">{currentTimeString} WITA</span>
                            </div>
                            <div className="hero-glass inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-indigo-200 border-indigo-400/25">
                                <Icon name="graduation-cap" className="w-3.5 h-3.5 text-indigo-300" />
                                <span>Semester 3 · SI 2025/2026</span>
                            </div>
                        </div>

                        {/* Greeting + Profile Info */}
                        <div className="flex flex-col sm:flex-row items-center lg:items-start gap-4 hero-animate-slide-up">
                            {/* User Avatar Circle */}
                            <div className="relative shrink-0 hero-animate-float">
                                {user?.photo ? (
                                    <img
                                        src={user.photo}
                                        alt={user.fullname || 'Profil'}
                                        className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover border-2 border-blue-400/60 shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/15"
                                    />
                                ) : (
                                    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-2xl flex items-center justify-center border-2 border-white/25 shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/15">
                                        {user?.fullname ? user.fullname.charAt(0).toUpperCase() : 'SI'}
                                    </div>
                                )}
                                <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-xl bg-slate-950 border border-white/15 text-emerald-400 shadow-lg">
                                    <Icon name={greetingDetails.icon} className="w-3.5 h-3.5" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-blue-300/90">
                                        {greetingDetails.greeting}
                                    </span>
                                    {isAdmin ? (
                                        <span className="hero-animate-badge-pop px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold inline-flex items-center gap-1">
                                            <Icon name="shield-check" className="w-3 h-3" /> Admin Kelas
                                        </span>
                                    ) : user?.nim ? (
                                        <span className="hero-animate-badge-pop px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[11px] font-bold inline-flex items-center gap-1 font-mono">
                                            <Icon name="fingerprint" className="w-3 h-3 text-cyan-300" /> {user.nim}
                                        </span>
                                    ) : null}
                                </div>

                                <h1 className="text-2xl sm:text-3xl lg:text-[2.5rem] font-black text-white tracking-tight leading-[1.15]">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-cyan-200">
                                        {user?.fullname || 'Mahasiswa Sistem Informasi'}
                                    </span>
                                    <span className="inline-block ml-1.5 animate-bounce" style={{ animationDuration: '2.5s' }}>👋</span>
                                </h1>

                                <p className="text-xs sm:text-sm text-slate-400 max-w-xl leading-relaxed">
                                    {greetingDetails.tag}{' '}
                                    <span className="text-slate-500">Portal akademik terpadu kelas S1 Sistem Informasi.</span>
                                </p>
                            </div>
                        </div>

                        {/* ── Kuliah Hari Ini Alert ── */}
                        <div className="hero-glass relative hero-shimmer p-3.5 rounded-2xl text-xs text-left max-w-2xl hero-animate-slide-up-delay overflow-hidden">
                            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 shadow-inner">
                                        <Icon name="calendar-clock" className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                                            Kuliah Hari Ini — {getFormattedToday().split(',')[0]}
                                        </span>
                                        {todayClasses.length > 0 ? (
                                            <p className="font-bold text-white text-xs sm:text-[13px] mt-0.5">
                                                {todayClasses[0].course}
                                                <span className="text-cyan-300/80 font-mono font-normal ml-1.5">{todayClasses[0].time}</span>
                                                <span className="text-slate-400 font-normal ml-1">· {todayClasses[0].room}</span>
                                                {todayClasses.length > 1 && (
                                                    <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-bold border border-blue-400/20">
                                                        +{todayClasses.length - 1} lagi
                                                    </span>
                                                )}
                                            </p>
                                        ) : (
                                            <p className="font-semibold text-slate-400 text-xs mt-0.5 flex items-center gap-1.5">
                                                <Icon name="coffee" className="w-3.5 h-3.5 text-amber-400" />
                                                Hari libur — tidak ada jadwal perkuliahan.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const el = document.getElementById('jadwal-kuliah');
                                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="self-end sm:self-center px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all flex items-center gap-1.5 border border-white/10 shrink-0 group/btn"
                                >
                                    <span>Jadwal Lengkap</span>
                                    <Icon name="arrow-right" className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* ── Banner Progres Mahasiswa / Info Admin ── */}
                        {studentStats ? (
                            <div className="hero-glass p-4 rounded-2xl text-xs max-w-2xl space-y-3 hero-animate-slide-up-delay">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-green-500/15 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
                                            <Icon name="trophy" className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-white text-[13px] leading-tight">
                                                Progres Tugas Kuliah
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {studentStats.completed}/{studentStats.total} selesai
                                                {studentStats.pending > 0
                                                    ? ` · ${studentStats.pending} menunggu`
                                                    : ' · Semua tuntas! 🎉'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="font-black text-xl text-emerald-400 leading-none">
                                            {studentStats.percentage}%
                                        </span>
                                    </div>
                                </div>

                                {/* Animated Progress Bar */}
                                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out relative"
                                        style={{ width: `${studentStats.percentage}%` }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        ) : isAdmin ? (
                            <div className="hero-glass p-3.5 rounded-2xl text-xs max-w-2xl flex flex-wrap items-center justify-between gap-3 hero-animate-slide-up-delay">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/15 text-amber-300 flex items-center justify-center shrink-0">
                                        <Icon name="crown" className="w-4.5 h-4.5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-[13px] leading-tight">Panel Pengurus Kelas</p>
                                        <p className="text-[11px] text-slate-400">
                                            {totalMembers} Mahasiswa • {materials.length} Materi • {assignments.length} Tugas
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openAddPhoto(false)}
                                    className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-600/20 active:scale-95"
                                >
                                    <Icon name="image-plus" className="w-3.5 h-3.5" /> Tambah Kenangan
                                </button>
                            </div>
                        ) : null}

                        {/* ── Quick Action Navigation Buttons ── */}
                        <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 hero-animate-slide-up-delay">
                            <button
                                onClick={() => navigateTo('materi')}
                                className="group/cta px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-sm transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 flex items-center gap-2 active:scale-[0.97]"
                            >
                                <Icon name="book-open" className="w-4 h-4 group-hover/cta:rotate-[-6deg] transition-transform" />
                                <span>Materi Kuliah</span>
                            </button>
                            <button
                                onClick={() => navigateTo('tugas')}
                                className="group/cta px-5 py-2.5 hero-glass hover:bg-white/15 text-white font-semibold rounded-2xl text-sm transition-all duration-200 flex items-center gap-2 active:scale-[0.97]"
                            >
                                <Icon name="clipboard-list" className="w-4 h-4 text-amber-300" />
                                <span>Tugas</span>
                                {studentStats && studentStats.pending > 0 && (
                                    <span className="ml-0.5 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] animate-pulse">
                                        {studentStats.pending}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => navigateTo('galeri')}
                                className="group/cta px-5 py-2.5 hero-glass hover:bg-white/15 text-slate-200 hover:text-white font-medium rounded-2xl text-sm transition-all duration-200 flex items-center gap-2"
                            >
                                <Icon name="camera" className="w-4 h-4 text-sky-300 group-hover/cta:scale-110 transition-transform" />
                                <span>Galeri</span>
                            </button>
                            <button
                                onClick={() => navigateTo('mahasiswa')}
                                className="group/cta px-5 py-2.5 hero-glass hover:bg-white/15 text-slate-200 hover:text-white font-medium rounded-2xl text-sm transition-all duration-200 flex items-center gap-2"
                            >
                                <Icon name="users" className="w-4 h-4 text-violet-300" />
                                <span>Mahasiswa</span>
                            </button>
                        </div>
                    </div>

                    {/* ═══ Sisi Kanan: Kartu Sorotan Foto Kelas Interaktif (5 Kolom) ═══ */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center relative hero-animate-slide-up">
                        <div
                            className="relative group w-full max-w-md h-80 sm:h-[400px] rounded-3xl bg-slate-900/80 border border-white/[0.08] overflow-hidden shadow-2xl shadow-blue-950/40 flex items-center justify-center"
                            onMouseEnter={() => setIsHeroHovered(true)}
                            onMouseLeave={() => setIsHeroHovered(false)}
                        >
                            {currentHeroPhoto ? (
                                <>
                                    {/* Photo or Video with Ken Burns effect */}
                                    {isVideoMedia(currentHeroPhoto) ? (
                                        <div
                                            className="relative w-full h-full cursor-pointer group/vid"
                                            onClick={() => setSelectedPhoto(currentHeroPhoto)}
                                        >
                                            <video
                                                src={currentHeroPhoto.url}
                                                autoPlay
                                                loop
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover"
                                            />
                                            {/* Center play icon overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 backdrop-blur-md border border-white/30 group-hover/vid:scale-110 transition-transform">
                                                    <Icon name="play" className="w-7 h-7 ml-0.5 fill-white" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={currentHeroPhoto.url}
                                            alt={currentHeroPhoto.title}
                                            className="w-full h-full object-cover cursor-pointer hero-animate-photo"
                                            style={{ animationPlayState: isHeroHovered ? 'paused' : 'running' }}
                                            onClick={() => setSelectedPhoto(currentHeroPhoto)}
                                        />
                                    )}

                                    {/* Top Controls Overlay */}
                                    <div className="absolute inset-x-0 top-0 p-4 bg-gradient-to-b from-slate-950/80 via-slate-950/30 to-transparent flex items-center justify-between z-10 pointer-events-none">
                                        <span className="hero-animate-badge-pop inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-xl text-xs font-bold border border-white/10 shadow-lg pointer-events-auto">
                                            {isVideoMedia(currentHeroPhoto) ? (
                                                <>
                                                    <Icon name="video" className="w-3.5 h-3.5 text-rose-400" />
                                                    <span className="text-rose-300">Video Hero</span>
                                                </>
                                            ) : currentHeroPhoto.isHero ? (
                                                <>
                                                    <Icon name="star" className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                    <span className="text-amber-300">Momen Pilihan</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Icon name="image" className="w-3.5 h-3.5 text-sky-300" />
                                                    <span className="text-sky-200">Kenangan Kelas</span>
                                                </>
                                            )}
                                        </span>

                                        <div className="flex items-center gap-1.5 pointer-events-auto">
                                            {isAdmin && (
                                                <>
                                                    {!currentHeroPhoto.isHero && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetAsHero(currentHeroPhoto.id);
                                                            }}
                                                            className="px-2.5 py-1 rounded-xl bg-amber-500/80 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition-all shadow-lg backdrop-blur-md active:scale-95"
                                                            title="Jadikan Foto Hero Utama"
                                                        >
                                                            ⭐ Hero
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openAddPhoto(false);
                                                        }}
                                                        className="px-2.5 py-1 rounded-xl bg-blue-600/80 hover:bg-blue-500 text-white text-[11px] font-bold transition-all shadow-md backdrop-blur-md border border-blue-400/30 flex items-center gap-1 active:scale-95"
                                                        title="Unggah Foto Baru dari Laptop / HP"
                                                    >
                                                        <Icon name="plus" className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">Tambah</span>
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditPhoto(currentHeroPhoto);
                                                        }}
                                                        className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md transition-all shadow border border-white/10 active:scale-95"
                                                        title="Edit Foto Ini"
                                                    >
                                                        <Icon name="pencil" className="w-3.5 h-3.5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => setSelectedPhoto(currentHeroPhoto)}
                                                className="p-2 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white transition-all backdrop-blur-md shadow border border-white/10 active:scale-95"
                                                title="Perbesar Foto (Lightbox)"
                                            >
                                                <Icon name="maximize-2" className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Navigation Arrows */}
                                    {heroPhotosList.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setHeroActiveIndex((prev) => (prev - 1 + heroPhotosList.length) % heroPhotosList.length);
                                                }}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 text-white transition-all backdrop-blur-md border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 z-10 active:scale-90"
                                                title="Foto Sebelumnya"
                                            >
                                                <Icon name="chevron-left" className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setHeroActiveIndex((prev) => (prev + 1) % heroPhotosList.length);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-2xl bg-slate-950/60 hover:bg-slate-900/80 text-white transition-all backdrop-blur-md border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 z-10 active:scale-90"
                                                title="Foto Berikutnya"
                                            >
                                                <Icon name="chevron-right" className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}

                                    {/* Bottom Gradient Overlay & Caption */}
                                    <div
                                        className="absolute inset-x-0 bottom-0 p-5 pt-14 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent flex flex-col justify-end cursor-pointer"
                                        onClick={() => setSelectedPhoto(currentHeroPhoto)}
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-[11px] font-semibold">
                                                <span className="text-blue-300/80">{currentHeroPhoto.date || 'Semester 3'} · SI</span>
                                                {heroPhotosList.length > 1 && (
                                                    <span className="font-mono text-white/50 text-[10px] px-2 py-0.5 rounded-lg bg-white/10">
                                                        {heroActiveIndex + 1}/{heroPhotosList.length}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-white text-base sm:text-lg font-bold line-clamp-1 drop-shadow-md">
                                                {currentHeroPhoto.title}
                                            </h3>
                                            <p className="text-white/70 text-xs line-clamp-2 drop-shadow-sm leading-relaxed">
                                                {currentHeroPhoto.caption || 'Dokumentasi kebersamaan mahasiswa Sistem Informasi.'}
                                            </p>
                                        </div>

                                        {/* Carousel Indicator Dots */}
                                        {heroPhotosList.length > 1 && (
                                            <div className="flex items-center justify-center gap-1.5 mt-3">
                                                {heroPhotosList.slice(0, 8).map((p, idx) => (
                                                    <button
                                                        key={p.id || idx}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setHeroActiveIndex(idx);
                                                        }}
                                                        className={`rounded-full transition-all duration-500 ${
                                                            idx === heroActiveIndex
                                                                ? 'w-7 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md shadow-blue-400/30'
                                                                : 'w-2 h-2 bg-white/25 hover:bg-white/50'
                                                        }`}
                                                        title={`Foto ${idx + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-8 sm:p-10 text-center space-y-4">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 flex items-center justify-center mx-auto text-blue-400 border border-white/10 shadow-inner">
                                        <Icon name="image-plus" className="w-8 h-8 sm:w-10 sm:h-10" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-base sm:text-lg font-bold text-white">
                                            {isAdmin ? "Atur Foto Hero Beranda" : "Dokumentasi Kelas Sistem Informasi"}
                                        </p>
                                        <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                                            {isAdmin
                                                ? "Unggah foto kenangan / kebersamaan kelas langsung dari Laptop atau HP untuk ditampilkan di frame utama beranda."
                                                : "Dokumentasi kebersamaan kelas akan diunggah oleh pengurus kelas."}
                                        </p>
                                    </div>
                                    {isAdmin && (
                                        <button
                                            onClick={() => openAddPhoto(true)}
                                            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 border border-blue-400/30"
                                        >
                                            <Icon name="upload" className="w-4 h-4" /> Unggah Foto Hero Pertama
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mini Thumbnail Selector (jika > 1 foto) */}
                        {heroPhotosList.length > 1 && (
                            <div className="flex items-center justify-between w-full max-w-md mt-3 gap-2 hero-animate-badge-pop">
                                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                                    {heroPhotosList.slice(0, 5).map((p, idx) => (
                                        <button
                                            key={p.id || idx}
                                            onClick={() => setHeroActiveIndex(idx)}
                                            className={`w-12 h-9 sm:w-14 sm:h-10 rounded-xl overflow-hidden border-2 transition-all duration-300 shadow-md shrink-0 relative ${
                                                idx === heroActiveIndex
                                                    ? 'border-blue-400 ring-2 ring-blue-400/30 scale-105'
                                                    : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                                            }`}
                                            title={p.title || `Media ${idx + 1}`}
                                        >
                                            {isVideoMedia(p) ? (
                                                <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
                                                    <video src={p.url} className="w-full h-full object-cover opacity-70" preload="metadata" muted />
                                                    <Icon name="play" className="w-3 h-3 text-white absolute fill-white" />
                                                </div>
                                            ) : (
                                                <img src={p.url} alt="" className="w-full h-full object-cover" />
                                            )}
                                        </button>
                                    ))}
                                    {heroPhotosList.length > 5 && (
                                        <button
                                            onClick={() => navigateTo('galeri')}
                                            className="w-12 h-9 sm:w-14 sm:h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all text-xs font-bold shrink-0"
                                            title="Lihat semua foto di Galeri"
                                        >
                                            +{heroPhotosList.length - 5}
                                        </button>
                                    )}
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => openAddPhoto(false)}
                                        className="h-9 sm:h-10 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 flex items-center justify-center gap-1.5 text-blue-200 hover:text-white transition-all text-xs font-bold shadow-md shrink-0 active:scale-95"
                                        title="Unggah Foto Kelas Baru dari Laptop / HP"
                                    >
                                        <Icon name="plus" className="w-3.5 h-3.5 text-blue-300" />
                                        <span className="hidden sm:inline">Foto Baru</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Community Card (Student Avatars Stack & Status) */}
                        <div className="w-full max-w-md mt-3 backdrop-blur-xl bg-slate-950/90 border border-white/15 px-4 py-2.5 rounded-2xl shadow-xl flex items-center justify-between gap-3 hero-animate-badge-pop">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                                    {memberAvatars.map((m, idx) => (
                                        <div
                                            key={m.code || idx}
                                            className="inline-block h-8 w-8 rounded-full ring-[2.5px] ring-slate-950 object-cover bg-slate-700 overflow-hidden shadow-md"
                                            title={m.name}
                                        >
                                            {m.photo ? (
                                                <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600">
                                                    {m.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-extrabold text-white leading-tight">
                                        {totalMembers || 42} Anggota Kelas
                                    </p>
                                    <p className="text-[10px] text-blue-300/80 font-medium">
                                        S1 Sistem Informasi · Angkatan 2025
                                    </p>
                                </div>
                            </div>

                            {/* Tombol Tambah Foto jika foto <= 1 (tidak ada thumbnail strip) dan user adalah admin */}
                            {isAdmin && heroPhotosList.length <= 1 && (
                                <button
                                    onClick={() => openAddPhoto(false)}
                                    className="px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95"
                                    title="Unggah Foto Kelas Baru dari Laptop / HP"
                                >
                                    <Icon name="plus" className="w-3.5 h-3.5 text-blue-300" />
                                    <span>Tambah</span>
                                </button>
                            )}
                        </div>

                        {/* Floating Photo Counter Badge (kanan atas) */}
                        {classPhotos.length > 0 && (
                            <button
                                onClick={() => navigateTo('galeri')}
                                className="hero-animate-badge-pop hidden lg:flex absolute -top-2 -right-3 z-20 backdrop-blur-xl bg-slate-950/90 border border-white/15 px-3 py-1.5 rounded-xl shadow-xl items-center gap-1.5 hover:bg-slate-900 transition-all group/photo"
                                title="Buka Galeri Kenangan"
                            >
                                <Icon name="images" className="w-3.5 h-3.5 text-sky-300" />
                                <span className="text-xs font-bold text-white">{classPhotos.length}</span>
                                <span className="text-[10px] text-slate-400 group-hover/photo:text-white transition">Foto</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── 2. METRIK KELAS SI TERPADU (DASHBOARD CARDS) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {[
                    {
                        title: 'Mata Kuliah',
                        count: courses.length || 8,
                        unit: 'Mata Kuliah',
                        sub: '22 Total SKS Semester 3',
                        icon: 'library',
                        color: 'from-blue-600 to-cyan-600',
                        bgLight: 'bg-blue-50 text-blue-700',
                        action: () => navigateTo('matkul'),
                    },
                    {
                        title: 'Tugas Kuliah',
                        count: assignments.length,
                        unit: 'Tugas Aktif',
                        sub: studentStats ? `${studentStats.completed} tugas dikumpulkan` : 'Cek instruksi & deadline',
                        icon: 'clipboard-list',
                        color: 'from-amber-500 to-orange-600',
                        bgLight: 'bg-amber-50 text-amber-700',
                        action: () => navigateTo('tugas'),
                    },
                    {
                        title: 'Modul & Materi',
                        count: materials.length,
                        unit: 'Berkas Materi',
                        sub: 'Siap diunduh untuk belajar',
                        icon: 'book-open',
                        color: 'from-emerald-500 to-teal-600',
                        bgLight: 'bg-emerald-50 text-emerald-700',
                        action: () => navigateTo('materi'),
                    },
                    {
                        title: 'Mahasiswa Kelas',
                        count: totalMembers || 42,
                        unit: 'Anggota Aktif',
                        sub: 'Semester 3 Angkatan 2025',
                        icon: 'users',
                        color: 'from-purple-600 to-indigo-600',
                        bgLight: 'bg-purple-50 text-purple-700',
                        action: () => navigateTo('mahasiswa'),
                    },
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={stat.action}
                        className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                {stat.title}
                            </span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${stat.bgLight} group-hover:scale-110 transition-transform`}>
                                <Icon name={stat.icon} className="w-4.5 h-4.5" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-blue-600 transition">
                                    {stat.count}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">
                                    {stat.unit}
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 truncate">
                                {stat.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── 3. JADWAL KULIAH MINGGUAN INTERAKTIF ── */}
            <div id="jadwal-kuliah" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5 scroll-mt-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-1">
                            <Icon name="calendar" className="w-3.5 h-3.5" />
                            Jadwal Perkuliahan Semester 3
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                            Jadwal Kuliah Mingguan
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilih hari untuk melihat jadwal mata kuliah, ruang kelas, dan dosen pengampu
                        </p>
                    </div>

                    {/* Selector Hari */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 bg-slate-100 p-1.5 rounded-2xl">
                        {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map(day => {
                            const isToday = day === currentDayName;
                            const isSelected = selectedDay === day;
                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                                        isSelected
                                            ? 'bg-slate-900 text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                    }`}
                                >
                                    <span>{day}</span>
                                    {isToday && (
                                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : 'bg-emerald-500'}`} title="Hari ini" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* List Mata Kuliah pada Hari Terpilih */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {CLASS_SCHEDULE[selectedDay]?.map((item, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigateTo('matkul')}
                            className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition bg-gradient-to-br from-white to-slate-50/50 flex flex-col justify-between cursor-pointer group"
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                                        <Icon name="clock" className="w-3 h-3 text-blue-600" />
                                        {item.time}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                                        {item.credits} SKS · {item.type}
                                    </span>
                                </div>

                                <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition">
                                    {item.course}
                                </h3>

                                <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                    <Icon name="user" className="w-3.5 h-3.5 text-slate-400" />
                                    {item.lecturer}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                    <Icon name="map-pin" className="w-3.5 h-3.5 text-rose-500" />
                                    {item.room}
                                </span>
                                <span className="font-semibold text-slate-900 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                                    Buka Matkul &rarr;
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 4. DUA KOLOM: TUGAS MENDESAK & PUSAT INFORMASI KELAS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri (2/3): Tugas Kuliah Aktif */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">
                                    Tugas Kuliah Aktif
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tenggat waktu pengumpulan tugas mahasiswa semester 3
                                </p>
                            </div>
                            <button
                                onClick={() => navigateTo('tugas')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                            >
                                Lihat Semua Tugas ({assignments.length}) &rarr;
                            </button>
                        </div>

                        {/* List Tugas */}
                        <div className="space-y-3.5 mt-4">
                            {assignments.length === 0 ? (
                                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Icon name="check-circle-2" className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-sm font-bold text-slate-800">Tidak ada tugas aktif</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Saat ini belum ada tugas baru yang perlu dikumpulkan.</p>
                                </div>
                            ) : (
                                assignments.slice(0, 3).map(ass => {
                                    const sub = submissions.find(s => s.assignmentId === ass.id && s.nim === user?.nim);
                                    const isSubmitted = Boolean(sub);

                                    return (
                                        <div
                                            key={ass.id}
                                            onClick={() => navigateTo('tugas')}
                                            className="p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition cursor-pointer bg-white group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                        {ass.course}
                                                    </span>
                                                    <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                                                        <Icon name="calendar" className="w-3 h-3" />
                                                        Deadline: {ass.deadline}
                                                    </span>
                                                </div>

                                                <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                                    {ass.title}
                                                </h3>

                                                <p className="text-xs text-slate-500 line-clamp-1">
                                                    {ass.description}
                                                </p>
                                            </div>

                                            <div className="shrink-0 flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                                                {isSubmitted ? (
                                                    <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                                                        <Icon name="check" className="w-3.5 h-3.5" /> Sudah Kumpul
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold group-hover:bg-blue-600 transition flex items-center gap-1">
                                                        Kumpulkan <Icon name="arrow-right" className="w-3.5 h-3.5" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                        <span>Pastikan mengumpulkan tugas sebelum batas waktu berakhir.</span>
                        <button
                            onClick={() => navigateTo('tugas')}
                            className="font-bold text-slate-900 hover:underline"
                        >
                            Buka Halaman Tugas
                        </button>
                    </div>
                </div>

                {/* Kolom Kanan (1/3): Pengumuman & Agenda */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-5">
                    <div>
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
                            <button
                                onClick={() => setInfoTab('pengumuman')}
                                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                                    infoTab === 'pengumuman'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Icon name="bell" className="w-3.5 h-3.5" /> Pengumuman
                            </button>
                            <button
                                onClick={() => setInfoTab('agenda')}
                                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 ${
                                    infoTab === 'agenda'
                                        ? 'bg-white text-slate-900 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                <Icon name="calendar" className="w-3.5 h-3.5" /> Agenda ({events.length})
                            </button>
                        </div>

                        {/* Konten Pengumuman */}
                        {infoTab === 'pengumuman' && (
                            <div className="space-y-3">
                                {announcements.slice(0, 3).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => navigateTo('pengumuman')}
                                        className="p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-1 text-[11px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {item.category}
                                                </span>
                                                {item.important && (
                                                    <span className="font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                                                        Penting
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-slate-400">{item.date}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-blue-600 transition line-clamp-1 mt-1">
                                            {item.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                            {item.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Konten Agenda Kegiatan */}
                        {infoTab === 'agenda' && (
                            <div className="space-y-3">
                                {events.map((ev, idx) => (
                                    <div key={idx} className="flex gap-3 items-start p-3 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-12 text-center bg-white rounded-xl py-2 shrink-0 border border-slate-200 shadow-xs">
                                            <span className="block text-xs font-black text-slate-900">{ev.date?.split('-')[2] || '12'}</span>
                                            <span className="block text-[9px] uppercase font-bold text-blue-600">Nov</span>
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{ev.title}</h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{ev.time} · {ev.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigateTo(infoTab === 'pengumuman' ? 'pengumuman' : 'matkul')}
                        className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                        <span>Lihat Semua {infoTab === 'pengumuman' ? 'Pengumuman' : 'Agenda'}</span>
                        <Icon name="arrow-right" className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ── 5. MATERI PERKULIAHAN TERBARU ── */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-1">
                            <Icon name="book-open" className="w-3.5 h-3.5" />
                            Modul & Berkas Kuliah
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900">
                            Materi Perkuliahan Terbaru
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Unduh modul materi terbaru untuk mendukung belajar mandiri
                        </p>
                    </div>

                    <button
                        onClick={() => navigateTo('materi')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                    >
                        Jelajahi Semua Materi ({materials.length}) &rarr;
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {materials.slice(0, 4).map(mat => (
                        <div
                            key={mat.id}
                            onClick={() => navigateTo('materi-detail', { id: mat.id })}
                            className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group bg-white"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2.5">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 truncate max-w-[130px]">
                                        {mat.course}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                        {mat.type}
                                    </span>
                                </div>

                                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition line-clamp-2 leading-snug">
                                    {mat.title}
                                </h3>

                                <p className="text-xs text-slate-500 mt-1.5 truncate">
                                    {mat.lecturer}
                                </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
                                <span>{mat.size}</span>
                                <span className="font-bold text-slate-900 group-hover:text-blue-600 transition flex items-center gap-0.5">
                                    Baca <Icon name="chevron-right" className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── 6. CUPLIKAN GALERI & KENANGAN KELAS (SHOWCASE) ── */}
            <div id="galeri-kelas" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold mb-1">
                            <Icon name="camera" className="w-3.5 h-3.5" />
                            Arsip Kenangan Mahasiswa
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900">
                            Sorotan Momen & Dokumentasi Kelas
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Cuplikan momen kebersamaan, praktikum laboratorium, dan kegiatan kelas Sistem Informasi
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {isAdmin && (
                            <button
                                onClick={() => openAddPhoto(false)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Foto
                            </button>
                        )}
                        <button
                            onClick={() => navigateTo('galeri')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition"
                        >
                            <span>Buka Halaman Galeri ({classPhotos.length})</span>
                            <Icon name="arrow-right" className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Grid Sorotan Kenangan */}
                {classPhotos.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl py-12 text-center px-4">
                        <Icon name="image" className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-800">Belum ada foto dokumentasi</p>
                        <p className="text-xs text-slate-500 mt-0.5">Momen kebersamaan kelas akan ditampilkan di sini.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {classPhotos.slice(0, 3).map(photo => (
                            <div
                                key={photo.id}
                                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                            >
                                <div
                                    className="relative aspect-[16/10] overflow-hidden bg-slate-950 cursor-pointer"
                                    onClick={() => setSelectedPhoto(photo)}
                                >
                                    {isVideoMedia(photo) ? (
                                        <div className="relative w-full h-full">
                                            <video
                                                src={photo.url}
                                                preload="metadata"
                                                muted
                                                playsInline
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 group-hover:scale-110 transition-transform">
                                                    <Icon name="play" className="w-6 h-6 ml-0.5 fill-white" />
                                                </div>
                                            </div>
                                            <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 text-white text-[10px] font-bold shadow flex items-center gap-1 border border-white/20">
                                                <Icon name="video" className="w-3 h-3" /> Video
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={photo.url}
                                                alt={photo.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            {photo.isHero && (
                                                <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold shadow flex items-center gap-1">
                                                    <Icon name="star" className="w-3 h-3 fill-white" /> Foto Hero
                                                </span>
                                            )}
                                        </>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
                                        <span className="px-3 py-1 rounded-lg bg-white/95 text-slate-900 text-xs font-bold shadow flex items-center gap-1">
                                            <Icon name={isVideoMedia(photo) ? 'play' : 'maximize-2'} className="w-3 h-3" /> {isVideoMedia(photo) ? 'Putar Video' : 'Lihat Penuh'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-4 flex-1 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[11px] text-slate-400 block mb-1">
                                            {photo.date}
                                        </span>
                                        <h3
                                            onClick={() => setSelectedPhoto(photo)}
                                            className="font-bold text-slate-900 text-sm hover:text-blue-600 transition cursor-pointer line-clamp-1"
                                        >
                                            {photo.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                            {photo.caption || 'Momen dokumentasi kegiatan mahasiswa Sistem Informasi.'}
                                        </p>
                                    </div>

                                    {isAdmin && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            {!photo.isHero ? (
                                                <button
                                                    onClick={() => handleSetAsHero(photo.id)}
                                                    className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 transition flex items-center gap-1"
                                                >
                                                    <Icon name="star" className="w-3.5 h-3.5" /> Jadikan Hero
                                                </button>
                                            ) : (
                                                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                                                    <Icon name="check" className="w-3.5 h-3.5" /> Banner Utama
                                                </span>
                                            )}

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditPhoto(photo)}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-800 transition"
                                                    title="Edit Foto"
                                                >
                                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(photo.id)}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 transition"
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

            {/* ── MODAL LIGHTBOX FOTO ── */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div
                        className="bg-white rounded-3xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh] border border-slate-100"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="relative bg-slate-950 flex items-center justify-center max-h-[60vh] overflow-hidden">
                            {isVideoMedia(selectedPhoto) ? (
                                <video
                                    src={selectedPhoto.url}
                                    controls
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-contain max-h-[60vh] bg-black"
                                />
                            ) : (
                                <img
                                    src={selectedPhoto.url}
                                    alt={selectedPhoto.title}
                                    className="w-full h-full object-contain max-h-[60vh]"
                                />
                            )}
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition"
                            >
                                <Icon name="x" className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>Diambil pada {selectedPhoto.date}</span>
                                {selectedPhoto.isHero && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
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

            {/* ── MODAL TAMBAH / EDIT FOTO ADMIN ── */}
            {photoModal && isAdmin && (
                <Modal
                    title={photoModal === 'add' ? 'Unggah Foto Kelas ke Database' : 'Edit Foto Kelas'}
                    onClose={() => setPhotoModal(null)}
                >
                    <div className="space-y-4">
                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileUpload}
                        />

                        {/* Dropzone / Upload Area */}
                        {!photoForm.url ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer border-2 border-dashed border-blue-400 hover:border-blue-600 rounded-2xl bg-blue-50/60 hover:bg-blue-50/90 p-6 sm:p-8 text-center transition group space-y-3"
                            >
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                                    <Icon name="upload-cloud" className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800">
                                        Ketuk atau Klik untuk Memilih Foto atau Video
                                    </p>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                        Pilih foto (JPG, PNG) atau video (MP4, WebM, MOV) dari Laptop/PC atau HP. Otomatis disimpan ke database.
                                    </p>
                                </div>
                                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition">
                                    <Icon name="upload" className="w-3.5 h-3.5" />
                                    Pilih Media dari Perangkat
                                </span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-900 shadow-md group">
                                    {isVideoMedia(photoForm) ? (
                                        <video
                                            src={photoForm.url}
                                            controls
                                            className="h-full w-full object-contain bg-black"
                                        />
                                    ) : (
                                        <img
                                            src={photoForm.url}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-lg transition flex items-center gap-1.5 hover:bg-slate-100"
                                        >
                                            <Icon name="refresh-cw" className="w-3.5 h-3.5" /> Ganti Gambar
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-xs px-1">
                                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                        <Icon name="check-circle" className="w-4 h-4" /> Berkas gambar siap disimpan ke database
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-blue-600 hover:underline font-bold text-xs"
                                    >
                                        Pilih foto lain
                                    </button>
                                </div>
                            </div>
                        )}

                        <FormField label="Judul Foto / Momen" required>
                            <input
                                className={inputCls}
                                value={photoForm.title}
                                onChange={e => setPhotoForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Foto Kebersamaan Kelas SI Semester 3"
                            />
                        </FormField>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField label="Tanggal">
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={photoForm.date}
                                    onChange={e => setPhotoForm(f => ({ ...f, date: e.target.value }))}
                                />
                            </FormField>
                            <FormField label="Kategori">
                                <select
                                    className={selectCls}
                                    value={photoForm.category || 'Praktikum & Perkuliahan'}
                                    onChange={e => setPhotoForm(f => ({ ...f, category: e.target.value }))}
                                >
                                    <option value="Praktikum & Perkuliahan">Praktikum & Perkuliahan</option>
                                    <option value="Makrab & Kebersamaan">Makrab & Kebersamaan</option>
                                    <option value="Seminar & Workshop">Seminar & Workshop</option>
                                    <option value="Kegiatan Luar">Kegiatan Luar</option>
                                </select>
                            </FormField>
                        </div>

                        <FormField label="Keterangan / Cerita Momen">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={photoForm.caption}
                                onChange={e => setPhotoForm(f => ({ ...f, caption: e.target.value }))}
                                placeholder="Tuliskan cerita singkat atau dokumentasi momen ini..."
                            />
                        </FormField>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
                            <input
                                type="checkbox"
                                id="heroCheck"
                                checked={photoForm.isHero}
                                onChange={e => setPhotoForm(f => ({ ...f, isHero: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="heroCheck" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                Jadikan Foto Utama (Hero) di Beranda <span className="text-amber-500 font-bold">⭐</span>
                                <span className="block text-[11px] text-slate-400 font-normal">
                                    Foto ini akan menjadi sorotan pertama saat halaman beranda dibuka.
                                </span>
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
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold transition shadow-lg shadow-blue-600/25 active:scale-95 flex items-center justify-center gap-1.5"
                            >
                                <Icon name="check" className="w-4 h-4" />
                                {photoModal === 'add' ? 'Simpan ke Database' : 'Perbarui di Database'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── DIALOG KONFIRMASI HAPUS FOTO ── */}
            {confirmDeleteId && (
                <ConfirmDialog
                    message={`Foto "${classPhotos.find(p => p.id === confirmDeleteId)?.title}" akan dihapus permanen.`}
                    onConfirm={handleDeletePhoto}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}
