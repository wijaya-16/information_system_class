import React, { useState } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';
import { getFileUrl } from '../lib/api';

const FILE_TYPES = ['PDF', 'PPTX', 'DOCX', 'ZIP', 'MP4', 'XLSX'];

export default function MaterialDetailPage({
    id,
    materials,
    navigateTo,
    showToast,
    isAdmin,
    onUpdate,
    onDelete,
}) {
    const material = materials.find(m => m.id === parseInt(id));

    const [isEditing, setIsEditing] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [form, setForm] = useState({
        title: '',
        type: 'PDF',
        size: '',
        lecturer: '',
        description: '',
    });

    if (!material) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
                    <Icon name="alert-circle" className="w-6 h-6 text-amber-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Materi tidak ditemukan</h2>
                <p className="text-xs text-slate-500 mt-1">Materi ini mungkin telah dihapus oleh pengajar atau administrator.</p>
                <button
                    onClick={() => navigateTo('materi')}
                    className="mt-4 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                    Kembali ke Daftar Materi
                </button>
            </div>
        );
    }

    const openEdit = () => {
        setForm({
            title: material.title,
            type: material.type || 'PDF',
            size: material.size || '2.0MB',
            lecturer: material.lecturer || '',
            description: material.description || '',
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!form.title.trim()) return;
        onUpdate(material.id, {
            ...form,
        });
        setIsEditing(false);
        showToast('Materi berhasil diperbarui');
    };

    const handleDelete = () => {
        setConfirmDelete(false);
        onDelete(material.id);
    };

    const handleDownload = () => {
        if (material.file_url) {
            window.open(getFileUrl(material.file_url), '_blank');
            showToast(`Membuka berkas: ${material.title}`);
        } else {
            showToast(`Mengunduh file: ${material.title} (${material.type})`);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header navigasi & Admin actions */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigateTo('materi')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                    <Icon name="arrow-left" className="w-4 h-4" /> Kembali ke Daftar Materi
                </button>

                {isAdmin && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition shadow-sm"
                        >
                            <Icon name="pencil" className="w-3.5 h-3.5" /> Edit Materi
                        </button>
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded-lg text-xs font-semibold transition"
                        >
                            <Icon name="trash-2" className="w-3.5 h-3.5" /> Hapus
                        </button>
                    </div>
                )}
            </div>

            {/* Konten Materi */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            {material.course}
                        </span>
                        <h1 className="text-2xl font-extrabold text-slate-900 mt-3">{material.title}</h1>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                            <Icon name="user" className="w-4 h-4 text-slate-400" />
                            {material.lecturer} · Diunggah pada {material.date}
                        </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-semibold shrink-0">
                        {material.type}
                    </span>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Deskripsi Materi
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {material.description || 'Tidak ada deskripsi tambahan.'}
                    </p>
                </div>

                <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm">
                            <Icon name="file-text" className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">Informasi Berkas</p>
                            <p className="text-xs text-slate-500">Ukuran: {material.size} · Format: {material.type}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                        <Icon name="download" className="w-4 h-4" /> Unduh Berkas
                    </button>
                </div>
            </div>

            {/* Modal Edit Materi */}
            {isEditing && (
                <Modal title="Edit Materi Perkuliahan" onClose={() => setIsEditing(false)}>
                    <div className="space-y-4">
                        <FormField label="Judul Materi" required>
                            <input
                                className={inputCls}
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            />
                        </FormField>

                        <FormField label="Dosen Pengampu">
                            <input
                                className={inputCls}
                                value={form.lecturer}
                                onChange={e => setForm(f => ({ ...f, lecturer: e.target.value }))}
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Jenis Berkas">
                                <select
                                    className={selectCls}
                                    value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                >
                                    {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ukuran File">
                                <input
                                    className={inputCls}
                                    value={form.size}
                                    onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                                />
                            </FormField>
                        </div>

                        <FormField label="Deskripsi">
                            <textarea
                                rows={4}
                                className={inputCls}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            />
                        </FormField>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
                            >
                                Perbarui
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Dialog Hapus */}
            {confirmDelete && (
                <ConfirmDialog
                    message={`Materi "${material.title}" akan dihapus permanen.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDelete(false)}
                />
            )}
        </div>
    );
}
