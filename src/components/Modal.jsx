import React, { useEffect } from 'react';
import Icon from './Icons';

export default function Modal({ title, onClose, children, size = 'md' }) {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
    };

    // Tutup modal dengan tombol Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[92vh] flex flex-col animate-slide-up`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                    <h2 className="text-base font-bold text-slate-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    >
                        <Icon name="x" className="w-4 h-4" />
                    </button>
                </div>
                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5">
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
        </div>
    );
}

export const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm transition";
export const selectCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white transition";

// Dialog konfirmasi hapus
export function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto">
                    <Icon name="trash-2" className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-center">
                    <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus</h3>
                    <p className="text-sm text-slate-500 mt-1">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition"
                    >
                        Hapus
                    </button>
                </div>
            </div>
        </div>
    );
}
