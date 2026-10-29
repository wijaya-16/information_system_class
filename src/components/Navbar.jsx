import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icons';

// Item navigasi biasa (tanpa dropdown)
const navItems = [
    { id: 'beranda',   label: 'Beranda' },
    { id: 'materi',    label: 'Materi' },
    { id: 'mahasiswa', label: 'Mahasiswa' },
    { id: 'galeri',    label: 'Galeri' },
    { id: 'profile',   label: 'Profile' },
];

// Item dengan dropdown
const matkulDropdown = {
    id: 'matkul',
    label: 'Mata Kuliah',
    children: [
        { id: 'matkul',      label: 'Semua Mata Kuliah', icon: 'layout-grid' },
        { id: 'tugas',       label: 'Tugas',             icon: 'clipboard-list' },
        { id: 'pengumuman',  label: 'Pengumuman',        icon: 'megaphone' },
    ],
};

// Halaman yang dianggap "aktif" untuk grup Mata Kuliah
const matkulGroup = ['matkul', 'matkul-detail', 'tugas', 'pengumuman'];

export default function Navbar({ activePage, navigateTo, user, onLogout, dbConnected = false }) {
    const [mobileMenuOpen, setMobileMenuOpen]   = useState(false);
    const [dropdownOpen,   setDropdownOpen]     = useState(false);
    const [mobileMatkulOpen, setMobileMatkulOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Tutup dropdown kalau klik di luar
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isMatkulActive = matkulGroup.includes(activePage) || activePage.startsWith('matkul');

    const handleNav = (id) => {
        navigateTo(id);
        setDropdownOpen(false);
        setMobileMenuOpen(false);
        setMobileMatkulOpen(false);
    };

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo('beranda')}>
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                        <Icon name="graduation-cap" className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="font-bold text-slate-900 text-lg leading-none block">Kelas SI</span>
                        <span className="text-xs text-slate-500 font-medium">Sistem Informasi</span>
                    </div>
                </div>

                {/* ── Navigasi Desktop ── */}
                <nav className="hidden md:flex items-center gap-1">

                    {/* Beranda */}
                    <button
                        onClick={() => handleNav('beranda')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activePage === 'beranda'
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        Beranda
                    </button>

                    {/* ── Dropdown Mata Kuliah ── */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(o => !o)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                                isMatkulActive
                                    ? 'bg-slate-100 text-slate-900 font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            {matkulDropdown.label}
                            <Icon
                                name="chevron-down"
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Panel Dropdown */}
                        {dropdownOpen && (
                            <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden z-50 animate-fade-in">
                                {matkulDropdown.children.map(child => (
                                    <button
                                        key={child.id}
                                        onClick={() => handleNav(child.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition ${
                                            activePage === child.id || (child.id === 'matkul' && activePage === 'matkul-detail')
                                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <Icon name={child.icon} className="w-4 h-4 shrink-0" />
                                        {child.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Materi */}
                    <button
                        onClick={() => handleNav('materi')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            activePage === 'materi' || activePage === 'materi-detail'
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        Materi
                    </button>

                    {/* Mahasiswa, Galeri & Profile */}
                    {['mahasiswa', 'galeri', 'profile'].map(id => (
                        <button
                            key={id}
                            onClick={() => handleNav(id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                                activePage === id
                                    ? 'bg-slate-100 text-slate-900 font-semibold'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                        >
                            {id === 'mahasiswa' ? 'Mahasiswa' : id === 'galeri' ? 'Galeri' : 'Profile'}
                        </button>
                    ))}
                </nav>

                {/* Status Database PostgreSQL & Link ke Database Viewer */}
                <div className="hidden lg:flex items-center">
                    <a
                        href="/db-view"
                        target="_blank"
                        rel="noreferrer"
                        title={dbConnected ? "Klik untuk melihat data di PostgreSQL Database Viewer" : "Server backend belum berjalan"}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition shadow-sm ${
                            dbConnected
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        }`}
                    >
                        <span className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                        <span>{dbConnected ? 'PostgreSQL Aktif' : 'Server Offline'}</span>
                        <Icon name="external-link" className="w-3 h-3 opacity-60" />
                    </a>
                </div>

                {/* User info + Logout — Desktop */}
                <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200">
                        <div
                            onClick={() => handleNav('profile')}
                            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
                            title="Buka Profil Akun"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden shrink-0 ${
                                user.role === 'admin'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                            }`}>
                                {user.photo ? (
                                    <img src={user.photo} alt={user.fullname} className="w-full h-full object-cover" />
                                ) : (
                                    user.fullname.charAt(0)
                                )}
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-semibold text-slate-900 leading-tight">{user.fullname}</p>
                                {user.role === 'admin' ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Admin
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        {user.nim || `NIM: ${user.username}`}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={onLogout} title="Keluar" className="p-2 text-slate-400 hover:text-red-600 transition ml-1">
                            <Icon name="log-out" className="w-4 h-4" />
                        </button>
                    </div>

                {/* Tombol Menu Mobile */}
                <div className="md:hidden flex items-center gap-2">
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
                        <Icon name={mobileMenuOpen ? 'x' : 'menu'} className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* ── Menu Mobile ── */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 space-y-1">

                    <button
                        onClick={() => handleNav('beranda')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${activePage === 'beranda' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                    >
                        Beranda
                    </button>

                    {/* Accordion Mata Kuliah di Mobile */}
                    <div>
                        <button
                            onClick={() => setMobileMatkulOpen(o => !o)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium ${
                                isMatkulActive ? 'bg-slate-100 text-slate-900' : 'text-slate-600'
                            }`}
                        >
                            <span>Mata Kuliah</span>
                            <Icon
                                name="chevron-down"
                                className={`w-4 h-4 transition-transform duration-200 ${mobileMatkulOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {mobileMatkulOpen && (
                            <div className="mt-1 ml-3 border-l-2 border-slate-200 pl-3 space-y-1">
                                {matkulDropdown.children.map(child => (
                                    <button
                                        key={child.id}
                                        onClick={() => handleNav(child.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                            activePage === child.id ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600'
                                        }`}
                                    >
                                        <Icon name={child.icon} className="w-4 h-4" />
                                        {child.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => handleNav('materi')}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${activePage === 'materi' || activePage === 'materi-detail' ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                    >
                        Materi
                    </button>

                    {['mahasiswa', 'galeri', 'profile'].map(id => (
                        <button
                            key={id}
                            onClick={() => handleNav(id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium capitalize ${activePage === id ? 'bg-slate-100 text-slate-900' : 'text-slate-600'}`}
                        >
                            {id === 'mahasiswa' ? 'Mahasiswa' : id === 'galeri' ? 'Galeri' : 'Profile'}
                        </button>
                    ))}

                    <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between px-3">
                        <div
                            onClick={() => handleNav('profile')}
                            className="cursor-pointer"
                            title="Buka Profil Akun"
                        >
                            <span className="text-sm font-semibold text-slate-800 block">{user.fullname}</span>
                            {user.role === 'admin' ? (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                    Administrator
                                </span>
                            ) : (
                                <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    Mahasiswa · {user.nim || `SI-${user.code}`}
                                </span>
                            )}
                        </div>
                        <button onClick={onLogout} className="text-sm text-red-600 font-semibold hover:underline">Keluar</button>
                    </div>
                </div>
            )}
        </header>
    );
}