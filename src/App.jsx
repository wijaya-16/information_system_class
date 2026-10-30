import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomNavigation from './components/BottomNavigation';
import LoginView from './components/LoginView';
import HomePage from './components/HomePage';
import MaterialsPage from './components/MaterialsPage';
import MaterialDetailPage from './components/MaterialDetailPage';
import CoursesPage from './components/CoursesPage';
import CourseDetailPage from './components/CourseDetailPage';
import AssignmentsPage from './components/AssignmentsPage';
import AnnouncementsPage from './components/AnnouncementsPage';
import ProfilePage from './components/ProfilePage';
import MembersPage from './components/MembersPage';
import Footer from './components/Footer';
import Toast from './components/Toast';
import { CLASS_MEMBERS, getMemberByNim } from './data/classMembers';

// ─── Supabase Cloud Database API Layer ───────────────────────────────────────
import { api, fetchAllData, checkServerHealth } from './lib/api';

const STORAGE_KEY = 'si_database_v2';

const INITIAL_DATABASE = {
    courses: [
        { id: 1, name: 'UI/UX Design', lecturer: 'Zumratul Muaihidin, M.Kom', credits: 4, category: 'Teori & Praktikum', color: 'bg-rose-500' },
        { id: 2, name: 'Manajemen Database', lecturer: 'Salman, S.ST., M.TI', credits: 3, category: 'Teori', color: 'bg-cyan-500' },
        { id: 3, name: 'Agama', lecturer: 'Agus Marjan Saputra, SEI.,MSEI', credits: 2, category: 'Teori', color: 'bg-emerald-500' },
        { id: 4, name: 'E-Business', lecturer: 'Zulpan Hadi, M.Kom.', credits: 3, category: 'Teori', color: 'bg-amber-500' },
        { id: 5, name: 'Technopreneurship 1', lecturer: 'Dr. Dwinita Arwidiyanti, M.Kom.', credits: 2, category: 'Teori', color: 'bg-blue-500' },
        { id: 6, name: 'Teknologi Web', lecturer: 'Dr. Muhammad Multazam, S.Kom., M.Kom', credits: 3, category: 'Praktik', color: 'bg-purple-500' },
        { id: 7, name: 'Pemrograman Berorientasi Objek', lecturer: 'Dr. Muhammad Multazam, S.Kom., M.Kom', credits: 3, category: 'Praktik', color: 'bg-violet-500' },
        { id: 8, name: 'Sistem Operasi', lecturer: 'Ahmad Yani, S.Kom., M.Kom', credits: 3, category: 'Teori', color: 'bg-slate-500' },
    ],
    materials: [
        { id: 1, title: 'Manajemen Database', course: 'Manajemen Database', type: 'PDF', size: '2.4MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Salman, S.ST., M.TI', description: 'Perbedaan sistem basis data dengan sistem berkas (file system) konvensional, serta peran penting DBMS.' },
        { id: 2, title: 'Sistem Operasi', course: 'Sistem Operasi', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Ahmad Yani, S.Kom., M.Kom', description: 'Peran, fungsi, dan evolusi OS (seperti Windows, Linux, macOS, dan Android) serta arsitektur dasarnya (kernel dan user space).' },
        { id: 3, title: 'Hakikat Manusia', course: 'Agama', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Agus Marjan Saputra, SEI.,MSEI', description: 'Peran, fungsi, dan evolusi manusia serta nilai spiritual dalam kehidupan.' },
        { id: 4, title: 'Pengantar E-Business', course: 'E-Business', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Zulpan Hadi, M.Kom.', description: 'Perbedaan antara e-business dan e-commerce, serta model bisnis seperti B2B, B2C, C2C, dan B2G.' },
        { id: 5, title: 'Technopreneurship 1', course: 'Technopreneurship 1', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Dr. Dwinita Arwidiyanti, M.Kom.', description: 'Menumbuhkan jiwa inovatif, berani mengambil risiko terukur, serta peka dalam melihat masalah sebagai peluang bisnis.' },
        { id: 6, title: 'Pengantar UI/UX', course: 'UI/UX Design', type: 'PDF', size: '2.5MB', date: '2026-10-11', semester: 'Semester 3', lecturer: 'Zumratul Muaihidin, M.Kom', description: 'Memahami perbedaan peran antara UI (keindahan visual, warna, tipografi) dan UX (alur pengguna, arsitektur informasi).' },
    ],
    assignments: [
        { id: 1, title: 'Laporan Normalisasi Database', course: 'Manajemen Database', description: 'Buat laporan normalisasi hingga 3NF untuk studi kasus sistem akademik.', lecturer: 'Salman, S.ST., M.TI', deadline: '2026-11-15', status: 'Aktif' },
        { id: 2, title: 'Analisis Kebutuhan UI', course: 'UI/UX Design', description: 'Buat analisis kebutuhan antarmuka untuk aplikasi akademik mahasiswa.', lecturer: 'Zumratul Muaihidin, M.Kom', deadline: '2026-11-20', status: 'Aktif' },
        { id: 3, title: 'Proposal E-business', course: 'E-Business', description: 'Susun proposal bisnis digital dengan model B2C yang lengkap beserta analisis pasar.', lecturer: 'Zulpan Hadi, M.Kom.', deadline: '2026-11-25', status: 'Aktif' },
    ],
    announcements: [
        { id: 1, title: 'Perubahan Jadwal Kuliah Tamu Big Data', category: 'Akademik', course: 'Manajemen Database', date: '2026-10-08', author: 'Ketua Prodi SI', important: true, content: 'Kuliah tamu yang semula dijadwalkan hari Rabu diundur menjadi hari Jumat pukul 09.00 WIB.' },
        { id: 2, title: 'Pengumpulan Tugas Diperpanjang', category: 'Tugas', course: 'E-Business', date: '2026-10-10', author: 'Zulpan Hadi, M.Kom.', important: false, content: 'Batas pengumpulan tugas proposal e-business diperpanjang hingga 25 November 2026.' },
    ],
    events: [
        { date: '2026-11-12', title: 'Kuliah Tamu Big Data Analytics', time: '09.00 - 11.30 WIB', location: 'Aula Utama' },
    ],
    classPhotos: [
        {
            id: 1,
            url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
            title: 'Foto Kebersamaan Kelas Sistem Informasi',
            caption: 'Pertemuan perdana perkuliahan Semester 3 tahun ajaran 2025/2026. Semangat belajar dan berkolaborasi bersama!',
            date: '2026-10-15',
            isHero: true,
        },
        {
            id: 2,
            url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
            title: 'Diskusi Kelompok Pemrograman Web & UI/UX',
            caption: 'Suasana kolaborasi dan pengerjaan tugas proyek di laboratorium komputer.',
            date: '2026-10-18',
            isHero: false,
        },
    ],
    members: CLASS_MEMBERS,
    submissions: [
        { id: 1, assignmentId: 1, nim: '25SI001', studentName: 'Adya Husaeni Akbar', note: 'Sudah selesai normalisasi tabel hingga 3NF', link: 'https://drive.google.com/file/d/demo-tugas-normalisasi', submittedAt: '2026-10-20' },
        { id: 2, assignmentId: 1, nim: '25SI011', studentName: 'Ian Pratama', note: 'Laporan normalisasi database studi kasus akademik', link: 'https://drive.google.com/file/d/demo-ian-normalisasi', submittedAt: '2026-10-21' },
    ],
};

export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem('si_token') || '');
    const [user, setUser] = useState(() => {
        const savedToken = localStorage.getItem('si_token');
        const savedUser  = localStorage.getItem('si_user');
        if (savedToken && savedUser) {
            try { return JSON.parse(savedUser); } catch (e) {}
        }
        return savedToken ? { username: 'admin', fullname: 'Administrator Kelas', role: 'admin' } : null;
    });

    const [activePage, setActivePage] = useState('beranda');
    const [pageParams, setPageParams] = useState({});
    const [toast, setToast]           = useState(null);

    // ─── Helpers ──────────────────────────────────────────────────────────────────
    const showToast = useCallback((message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const nextId = () => Date.now();

    // ─── State Database ──────────────────────────────────────────────────────────
    const [dbConnected, setDbConnected] = useState(false);
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    ...INITIAL_DATABASE,
                    ...parsed,
                    members: { ...CLASS_MEMBERS, ...(parsed.members || {}) },
                };
            } catch (e) {}
        }
        return INITIAL_DATABASE;
    });

    // ─── Sinkronisasi Data dengan PostgreSQL Backend ─────────────────────────────
    const loadFromDatabase = useCallback(async (showNotice = false) => {
        try {
            const health = await checkServerHealth();
            if (health.status === 'ok') {
                setDbConnected(true);
                const cloudData = await fetchAllData();
                if (cloudData && cloudData.courses) {
                    setData(prev => ({
                        ...prev,
                        ...cloudData,
                        members: { ...CLASS_MEMBERS, ...(cloudData.members || {}) },
                    }));
                    if (showNotice) {
                        showToast('Berhasil terhubung ke Supabase Cloud Database!', 'success');
                    }
                    return;
                }
            } else {
                setDbConnected(false);
            }
        } catch (err) {
            setDbConnected(false);
        }
    }, [showToast]);

    useEffect(() => {
        loadFromDatabase(true);

        // Polling setiap 8 detik agar data otomatis sinkron jika ada admin/member di device lain yang menginput
        const interval = setInterval(() => {
            loadFromDatabase(false);
        }, 8000);
        return () => clearInterval(interval);
    }, [loadFromDatabase]);

    // Simpan cadangan ke localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {}
    }, [data]);

    // Multi-tab sync di browser yang sama
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === STORAGE_KEY && e.newValue) {
                try {
                    setData(JSON.parse(e.newValue));
                    showToast('Data kelas baru saja diperbarui!', 'success');
                } catch (err) {}
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [showToast]);

    // ─── CRUD: Mata Kuliah ────────────────────────────────────────────────────────
    const addCourse = async (courseData) => {
        const newItem = { ...courseData, id: nextId() };
        setData(d => ({ ...d, courses: [...(d.courses || []), newItem] }));
        try {
            await api.courses.add(newItem);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, tersimpan secara lokal:', err.message);
        }
        showToast('Mata kuliah berhasil ditambahkan');
    };

    const updateCourse = async (id, courseData) => {
        const oldName = data.courses.find(c => c.id === id)?.name;
        setData(d => ({
            ...d,
            courses:       d.courses.map(c => c.id === id ? { ...c, ...courseData } : c),
            materials:     oldName && courseData.name !== oldName ? d.materials.map(m => m.course === oldName ? { ...m, course: courseData.name } : m) : d.materials,
            assignments:   oldName && courseData.name !== oldName ? d.assignments.map(a => a.course === oldName ? { ...a, course: courseData.name } : a) : d.assignments,
            announcements: oldName && courseData.name !== oldName ? d.announcements.map(a => a.course === oldName ? { ...a, course: courseData.name } : a) : d.announcements,
        }));
        try {
            await api.courses.update(id, courseData);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, tersimpan secara lokal:', err.message);
        }
        showToast('Mata kuliah berhasil diperbarui');
    };

    const deleteCourse = async (id) => {
        const courseName = data.courses.find(c => c.id === id)?.name;
        setData(d => ({
            ...d,
            courses:       d.courses.filter(c => c.id !== id),
            materials:     d.materials.filter(m => m.course !== courseName),
            assignments:   d.assignments.filter(a => a.course !== courseName),
            announcements: d.announcements.filter(a => a.course !== courseName),
        }));
        try {
            await api.courses.delete(id);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, tersimpan secara lokal:', err.message);
        }
        showToast('Mata kuliah beserta kontennya telah dihapus', 'error');
    };

    // ─── CRUD: Materi ────────────────────────────────────────────────────────────
    const addMaterial = async (mat) => {
        const newItem = { ...mat, id: nextId() };
        setData(d => ({ ...d, materials: [...(d.materials || []), newItem] }));
        try {
            await api.materials.add(newItem);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, tersimpan secara lokal:', err.message);
        }
        showToast('Materi berhasil ditambahkan');
    };

    const updateMaterial = async (id, mat) => {
        setData(d => ({ ...d, materials: d.materials.map(m => m.id === id ? { ...m, ...mat } : m) }));
        try {
            await api.materials.update(id, mat);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Materi berhasil diperbarui');
    };

    const deleteMaterial = async (id) => {
        setData(d => ({ ...d, materials: d.materials.filter(m => m.id !== id) }));
        try {
            await api.materials.delete(id);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Materi berhasil dihapus', 'error');
    };

    // ─── CRUD: Tugas ─────────────────────────────────────────────────────────────
    const addAssignment = async (a) => {
        const newItem = { ...a, id: nextId() };
        setData(d => ({ ...d, assignments: [...(d.assignments || []), newItem] }));
        try {
            await api.assignments.add(newItem);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Tugas berhasil ditambahkan');
    };

    const updateAssignment = async (id, a) => {
        setData(d => ({ ...d, assignments: d.assignments.map(x => x.id === id ? { ...x, ...a } : x) }));
        try {
            await api.assignments.update(id, a);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Tugas berhasil diperbarui');
    };

    const deleteAssignment = async (id) => {
        setData(d => ({ ...d, assignments: d.assignments.filter(x => x.id !== id) }));
        try {
            await api.assignments.delete(id);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Tugas berhasil dihapus', 'error');
    };

    // ─── CRUD: Pengumuman ────────────────────────────────────────────────────────
    const addAnnouncement = async (a) => {
        const newItem = { ...a, id: nextId() };
        setData(d => ({ ...d, announcements: [...(d.announcements || []), newItem] }));
        try {
            await api.announcements.add(newItem);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Pengumuman berhasil ditambahkan');
    };

    const updateAnnouncement = async (id, a) => {
        setData(d => ({ ...d, announcements: d.announcements.map(x => x.id === id ? { ...x, ...a } : x) }));
        try {
            await api.announcements.update(id, a);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Pengumuman berhasil diperbarui');
    };

    const deleteAnnouncement = async (id) => {
        setData(d => ({ ...d, announcements: d.announcements.filter(x => x.id !== id) }));
        try {
            await api.announcements.delete(id);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Pengumuman berhasil dihapus', 'error');
    };

    // ─── CRUD: Foto Kelas ─────────────────────────────────────────────────────────
    const addClassPhoto = async (photoData) => {
        const newPhoto = { ...photoData, id: nextId() };
        setData(d => {
            const photos  = d.classPhotos || [];
            const updated = photoData.isHero ? photos.map(p => ({ ...p, isHero: false })) : photos;
            return { ...d, classPhotos: [newPhoto, ...updated] };
        });
        try {
            await api.photos.add(newPhoto);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Foto kelas berhasil ditambahkan');
    };

    const updateClassPhoto = async (id, photoData) => {
        setData(d => ({
            ...d,
            classPhotos: (d.classPhotos || []).map(p => {
                if (p.id === id) return { ...p, ...photoData };
                if (photoData.isHero) return { ...p, isHero: false };
                return p;
            }),
        }));
        try {
            await api.photos.update(id, photoData);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Foto kelas berhasil diperbarui');
    };

    const deleteClassPhoto = async (id) => {
        setData(d => ({ ...d, classPhotos: (d.classPhotos || []).filter(p => p.id !== id) }));
        try {
            await api.photos.delete(id);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Foto kelas berhasil dihapus', 'error');
    };

    const setHeroClassPhoto = async (id) => {
        setData(d => ({
            ...d,
            classPhotos: (d.classPhotos || []).map(p => ({ ...p, isHero: p.id === id })),
        }));
        try {
            await api.photos.setHero(id);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Foto utama kelas berhasil diatur');
    };

    // ─── CRUD: Mahasiswa / Member ─────────────────────────────────────────────────
    const addMember = async (code, memberData) => {
        setData(d => ({ ...d, members: { ...(d.members || CLASS_MEMBERS), [code]: memberData } }));
        try {
            await api.members.add(code, memberData);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast(`Mahasiswa 25SI${code} berhasil ditambahkan`);
    };

    const updateMember = async (oldCode, newCode, memberData) => {
        setData(d => {
            const updated = { ...(d.members || CLASS_MEMBERS) };
            if (oldCode !== newCode) delete updated[oldCode];
            updated[newCode] = memberData;
            return { ...d, members: updated };
        });

        // Jika member yang diedit adalah user yang sedang login, sinkronkan sesi user
        if (user && (user.code === oldCode || user.nim === `25SI${oldCode}`)) {
            const updatedUser = {
                ...user,
                code: newCode,
                nim: `25SI${newCode}`,
                fullname: memberData.fullname || user.fullname,
                gender: memberData.gender || user.gender,
                photo: memberData.photo !== undefined ? memberData.photo : user.photo,
            };
            setUser(updatedUser);
            localStorage.setItem('si_user', JSON.stringify(updatedUser));
        }

        try {
            await api.members.update(oldCode, newCode, memberData);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Data mahasiswa berhasil diperbarui');
    };

    const deleteMember = async (code) => {
        setData(d => {
            const updated = { ...(d.members || CLASS_MEMBERS) };
            delete updated[code];
            return { ...d, members: updated };
        });
        try {
            await api.members.delete(code);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast(`Mahasiswa 25SI${code} berhasil dihapus`, 'error');
    };

    // ─── Pengumpulan Tugas ────────────────────────────────────────────────────────
    const submitAssignment = async (assignmentId, subData) => {
        const studentNim = user?.nim || user?.username || '25SI001';
        const newSub = {
            id: nextId(),
            assignmentId,
            nim: studentNim,
            studentName: user?.fullname || 'Mahasiswa',
            submittedAt: new Date().toISOString().split('T')[0],
            ...subData,
        };
        setData(d => ({
            ...d,
            submissions: [
                ...(d.submissions || []).filter(s => !(s.assignmentId === assignmentId && s.nim === studentNim)),
                newSub,
            ],
        }));
        try {
            await api.submissions.add(newSub);
        } catch (err) {
            console.warn('[PostgreSQL] Server offline, disimpan secara lokal:', err.message);
        }
        showToast('Tugas berhasil dikumpulkan!');
    };

    // Bundle semua handler admin dalam satu objek
    const adminHandlers = {
        course:       { add: addCourse,          update: updateCourse,          delete: deleteCourse },
        material:     { add: addMaterial,        update: updateMaterial,        delete: deleteMaterial },
        assignment:   { add: addAssignment,      update: updateAssignment,      delete: deleteAssignment },
        announcement: { add: addAnnouncement,    update: updateAnnouncement,    delete: deleteAnnouncement },
        classPhoto:   { add: addClassPhoto,      update: updateClassPhoto,      delete: deleteClassPhoto, setHero: setHeroClassPhoto },
        member:       { add: addMember,          update: updateMember,          delete: deleteMember },
    };

    // ─── Auth ─────────────────────────────────────────────────────────────────────
    const handleLogin = (username, password) => {
        const u = username.trim();
        const p = password.trim();

        // 1. Cek Login Admin
        if (u === 'admin' && p === 'admin123') {
            const mockUser = { username: 'admin', fullname: 'Administrator Kelas', role: 'admin' };
            setUser(mockUser);
            setToken('mock-token-admin');
            localStorage.setItem('si_token', 'mock-token-admin');
            localStorage.setItem('si_user', JSON.stringify(mockUser));
            showToast('Login berhasil! Selamat datang, Administrator Kelas');
            return;
        }

        // 2. Cek Login Member Kelas (NIM)
        // Username dan password sama-sama menggunakan NIM (contoh: 25SI001)
        if (u.toUpperCase() === p.toUpperCase()) {
            const member = getMemberByNim(u, data.members || members);
            if (member) {
                setUser(member);
                setToken(`mock-token-${member.code}`);
                localStorage.setItem('si_token', `mock-token-${member.code}`);
                localStorage.setItem('si_user', JSON.stringify(member));
                showToast(`Login berhasil! Selamat datang, ${member.fullname} (${member.nim})`);
                return;
            }
        }

        showToast('Login gagal! Untuk Admin gunakan admin/admin123, untuk Member gunakan NIM Anda (cth: 25SI001)', 'error');
    };

    const handleLogout = () => {
        setUser(null);
        setToken('');
        localStorage.removeItem('si_token');
        localStorage.removeItem('si_user');
        showToast('Berhasil Keluar Dari Sistem');
    };

    // ─── Navigasi ─────────────────────────────────────────────────────────────────
    const navigateTo = (page, params = {}) => {
        setActivePage(page);
        setPageParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // ─── Halaman Login ─────────────────────────────────────────────────────────────
    if (!user) {
        return (
            <>
                <LoginView onLogin={handleLogin} />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </>
        );
    }

    // ─── Halaman Utama ─────────────────────────────────────────────────────────────
    const knownPages = ['beranda', 'galeri', 'materi', 'materi-detail', 'matkul', 'matkul-detail', 'tugas', 'pengumuman', 'mahasiswa', 'profile'];
    const isAdmin = user.role === 'admin';

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
            <Navbar activePage={activePage} navigateTo={navigateTo} user={user} onLogout={handleLogout} dbConnected={dbConnected} />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {(activePage === 'beranda' || activePage === 'galeri') && (
                    <HomePage
                        data={data}
                        navigateTo={navigateTo}
                        user={user}
                        isAdmin={isAdmin}
                        adminHandlers={adminHandlers}
                        showToast={showToast}
                        initialTab={activePage === 'galeri' ? 'galeri' : 'beranda'}
                    />
                )}
                {activePage === 'materi' && (
                    <MaterialsPage
                        materials={data.materials}
                        courses={data.courses}
                        navigateTo={navigateTo}
                        isAdmin={isAdmin}
                        adminHandlers={adminHandlers}
                        showToast={showToast}
                    />
                )}
                {activePage === 'materi-detail' && (
                    <MaterialDetailPage
                        id={pageParams.id}
                        materials={data.materials}
                        navigateTo={navigateTo}
                        showToast={showToast}
                        isAdmin={isAdmin}
                        onUpdate={(id, mat) => { updateMaterial(id, mat); }}
                        onDelete={(id) => { deleteMaterial(id); navigateTo('materi'); }}
                    />
                )}
                {activePage === 'matkul' && (
                    <CoursesPage
                        courses={data.courses}
                        materials={data.materials}
                        assignments={data.assignments}
                        announcements={data.announcements}
                        navigateTo={navigateTo}
                        isAdmin={isAdmin}
                        adminHandlers={adminHandlers}
                    />
                )}
                {activePage === 'matkul-detail' && (
                    <CourseDetailPage
                        id={pageParams.id}
                        courses={data.courses}
                        materials={data.materials}
                        assignments={data.assignments}
                        announcements={data.announcements}
                        navigateTo={navigateTo}
                        showToast={showToast}
                        isAdmin={isAdmin}
                        adminHandlers={adminHandlers}
                    />
                )}
                {activePage === 'tugas' && (
                    <AssignmentsPage
                        assignments={data.assignments}
                        courses={data.courses}
                        navigateTo={navigateTo}
                        isAdmin={isAdmin}
                        adminHandlers={adminHandlers}
                        showToast={showToast}
                        currentUser={user}
                        submissions={data.submissions}
                        onSubmitAssignment={submitAssignment}
                    />
                )}
                {activePage === 'pengumuman' && (
                    <AnnouncementsPage
                        announcements={data.announcements}
                        courses={data.courses}
                        navigateTo={navigateTo}
                        isAdmin={isAdmin}
                        adminHandlers={adminHandlers}
                        showToast={showToast}
                    />
                )}
                {activePage === 'mahasiswa' && (
                    <MembersPage
                        members={data.members}
                        currentUser={user}
                        isAdmin={isAdmin}
                        adminHandlers={adminHandlers}
                        showToast={showToast}
                        navigateTo={navigateTo}
                    />
                )}
                {activePage === 'profile' && (
                    <ProfilePage
                        user={user}
                        onLogout={handleLogout}
                        navigateTo={navigateTo}
                    />
                )}

                {/* Fallback */}
                {!knownPages.includes(activePage) && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
                        <h2 className="text-xl font-bold capitalize">Halaman {activePage}</h2>
                        <p className="text-sm text-slate-500">Halaman ini siap untuk dihubungkan ke komponen berikutnya.</p>
                        <button onClick={() => navigateTo('beranda')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-medium">
                            Kembali ke Beranda
                        </button>
                    </div>
                )}
            </main>

            <Footer navigateTo={navigateTo} />
            <BottomNavigation activePage={activePage} navigateTo={navigateTo} />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}