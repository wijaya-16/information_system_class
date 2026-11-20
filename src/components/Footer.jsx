import React from "react";
import Icon from "./Icons";

export default function Footer({ navigateTo }) {
    return (
        <footer className="border-t border-white/10 backdrop-blur-xl py-10 mt-16 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Icon name="graduation-cap" className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-extrabold text-white text-sm tracking-tight">Kelas S1 Sistem Informasi</p>
                        <p className="text-xs text-slate-400 mt-0.5">Belajar · Berbagi · Berkembang Bersama</p>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-400">
                    <button onClick={() => navigateTo('beranda')} className="hover:text-white transition">Beranda</button>
                    <button onClick={() => navigateTo('matkul')} className="hover:text-white transition">Mata Kuliah</button>
                    <button onClick={() => navigateTo('materi')} className="hover:text-white transition">Materi</button>
                    <button onClick={() => navigateTo('tugas')} className="hover:text-white transition">Tugas</button>
                    <button onClick={() => navigateTo('galeri')} className="hover:text-white transition">Galeri</button>
                    <button onClick={() => navigateTo('profile')} className="hover:text-white transition">Profil</button>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>&copy; {new Date().getFullYear()} Kelas SI • All Rights Reserved</span>
                </div>
            </div>
        </footer>
    );
}
