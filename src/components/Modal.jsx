import React, { useEffect } from 'react';
import Icon from './Icons';

export default function Modal({ title, onClose, children, size = 'md' }) {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    // Tutup modal dengan tombol Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`rounded-t-3xl sm:rounded-3xl shadow-2xl w-full ${sizes[size]} max-h-[92vh] flex flex-col border border-white/15 animate-scale-in bg-slate-900/95 backdrop-blur-2xl text-white`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/10 shrink-0">
                    <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                    >
                        <Icon name="x" className="w-4 h-4" />
                    </button>
                </div>
                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 scrollbar-thin">
                    {children}
                </div>
            </div>
        </div>
    );
}

// Komponen form input & textarea yang konsisten
export function FormField({ label, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                {label} {required && <span className="text-rose-400">*</span>}
            </label>
            {children}
        </div>
    );
}

export const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm transition bg-white/5 text-white placeholder-slate-500";
export const selectCls = "w-full px-3.5 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm transition bg-slate-900 text-white";

// Dialog konfirmasi hapus
export function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div className="rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-white/15 bg-slate-900/95 backdrop-blur-2xl text-white">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                    <Icon name="trash-2" className="w-6 h-6 text-rose-400" />
                </div>
                <div className="text-center">
                    <h3 className="text-base font-bold text-white">Konfirmasi Tindakan</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{message}</p>
                </div>
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/30 active:scale-95"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}
