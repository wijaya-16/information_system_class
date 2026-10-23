import React, { useState } from 'react';
import Icon from './Icons';

export default function LoginView({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('member'); // 'member' | 'admin'

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) return;
        setSubmitting(true);
        await onLogin(username.trim(), password.trim());
        setSubmitting(false);
    };

    const quickFill = (u, p) => {
        setUsername(u);
        setPassword(p);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-8">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                {/* Header Logo */}
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white mb-3 shadow-sm">
                        <Icon name="graduation-cap" className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kelas Sistem Informasi</h1>
                    <p className="text-xs text-slate-500 mt-1">Portal Akademik Mahasiswa & Administrator</p>
                </div>

                {/* Tab Pilihan Login */}
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('member');
                            quickFill('25SI001', '25SI001');
                        }}
                        className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'member'
                                ? 'bg-white text-slate-900 shadow-sm font-bold'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Icon name="user" className="w-3.5 h-3.5" />
                        Member Kelas (NIM)
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('admin');
                            quickFill('admin', 'admin123');
                        }}
                        className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                            activeTab === 'admin'
                                ? 'bg-white text-slate-900 shadow-sm font-bold'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <Icon name="shield" className="w-3.5 h-3.5" />
                        Administrator
                    </button>
                </div>

                {/* Petunjuk Akun */}
                <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                    activeTab === 'member'
                        ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                        : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                    {activeTab === 'member' ? 
                    (
                        <div>
                            <p className="font-bold justify-center flex items-center gap-1.5">
                                <Icon name="info" className="w-3.5 h-3.5 text-blue-600" />
                                Login Member Kelas
                            </p>
                            {/* <p className="mt-1 text-[11px] text-blue-800">
                                Gunakan <strong>NIM</strong> Anda untuk Username & Password. 3 digit angka terakhir NIM (contoh: <strong>001, 002, 011</strong>) menentukan profil unik mahasiswa.
                            </p> */}
                        </div>
                    ) 
                    : 
                    (
                        <div>
                            <p className="font-bold flex items-center justify-center gap-1.5">
                                <Icon name="shield-check" className="w-3.5 h-3.5 text-amber-600" />
                                Login Administrator
                            </p>
                            {/* <p className="mt-1 text-[11px] text-amber-800">
                                Akses penuh untuk mengelola mata kuliah, materi, tugas, dan pengumuman. (User: <strong>admin</strong> · Pass: <strong>admin123</strong>)
                            </p> */}
                        </div>
                    )
                    }
                </div>

                {/* Form Login */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            {activeTab === 'member' ? 'NIM / Username' : 'Username Admin'}
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-mono"
                            placeholder={activeTab === 'member' ? 'cth: 25SI001' : 'admin'}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                            {activeTab === 'member' ? 'Password' : 'Password Admin'}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm font-mono"
                            placeholder={activeTab === 'member' ? 'Masukkan NIM Anda' : 'admin123'}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition shadow-sm flex items-center justify-center gap-2 text-sm mt-2"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Masuk ke Portal</span>
                                <Icon name="arrow-right" className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                {/* Tombol Demo Cepat */}
                {/* <div className="pt-2 border-t border-slate-100 text-center">
                    <span className="text-[11px] text-slate-400 block mb-2 font-medium">Uji Coba Akun Demo Cepat:</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('member');
                                quickFill('25SI001', '25SI001');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                        >
                            Member 25SI001 (Fauzan)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('member');
                                quickFill('25SI011', '25SI011');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                        >
                            Member 25SI011 (Ian)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('admin');
                                quickFill('admin', 'admin123');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition"
                        >
                            Admin (admin123)
                        </button>
                    </div>
                </div> */}
            </div>
        </div>
    );
}
