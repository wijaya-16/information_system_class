import React from "react";

export default function Footer({navigateTo}){
    return(
        <footer className="bg-white border-t border-slate-200 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <p className="font-bold text-slate-900 text-sm">Kelas Sistem Informasi</p>
                    <p className="text-xs text-slate-500 mt-0.5">Belajar · Berbagi · Berkembang Bersama</p>
                </div>
                <div className="flex gap-6 text-xs font-medium text-slate-600">
                    <button onClick={() => navigateTo('beranda')} className="hover:text-slate-900">Beranda</button>
                    <button onClick={() => navigateTo('matkul')} className="hover:text-slate-900">Mata Kuliah</button>
                    <button onClick={() => navigateTo('materi')} className="hover:text-slate-900">Materi</button>
                    <button onClick={() => navigateTo('tugas')} className="hover:text-slate-900">Tugas</button>
                    <button onClick={() => navigateTo('profil')} className="hover:text-slate-900">Profil</button>
                </div>
                <div className="text-xs text-slate-400">
                    &copy; {new Date().getFullYear()} Developed by Hendi Wijaya
                </div>
            </div>
        </footer>
    );
}