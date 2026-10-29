import React, { useState, useRef } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';
import { uploadFile } from '../lib/api';

const FILE_TYPES = ['PDF', 'PPTX', 'DOCX', 'ZIP', 'MP4', 'XLSX'];

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function MaterialsPage({
    materials,
    courses,
    navigateTo,
    isAdmin,
    adminHandlers,
    showToast,
}) {
    const [search, setSearch] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('Semua');

    // Admin modal states
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
    const [editItem, setEditItem] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Form state
    const [form, setForm] = useState({
        title: '',
        course: courses[0]?.name || '',
        lecturer: courses[0]?.lecturer || '',
        type: 'PDF',
        size: '2.5MB',
        date: getTodayDate(),
        description: '',
        file_url: null,
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const res = await uploadFile(file);
            if (res.url) {
                const ext = file.name.split('.').pop().toUpperCase();
                const sizeStr = file.size > 1024 * 1024
                    ? (file.size / (1024 * 1024)).toFixed(1) + 'MB'
                    : Math.round(file.size / 1024) + 'KB';
                setForm(f => ({
                    ...f,
                    title: f.title || file.name.replace(/\.[^/.]+$/, ''),
                    type: ext || f.type,
                    size: sizeStr,
                    file_url: res.url,
                }));
                showToast('Berkas berhasil diunggah ke server!', 'success');
            }
        } catch (err) {
            showToast('Gagal upload berkas: ' + err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    // Handle course change in form to auto-sync lecturer
    const handleCourseSelect = (courseName) => {
        const matched = courses.find(c => c.name === courseName);
        setForm(f => ({
            ...f,
            course: courseName,
            lecturer: matched ? matched.lecturer : f.lecturer,
        }));
    };

    const openAdd = () => {
        const defaultCourse = courses[0];
        setForm({
            title: '',
            course: defaultCourse ? defaultCourse.name : '',
            lecturer: defaultCourse ? defaultCourse.lecturer : '',
            type: 'PDF',
            size: '2.5MB',
            date: getTodayDate(),
            description: '',
            file_url: null,
        });
        setEditItem(null);
        setModalMode('add');
    };

    const openEdit = (e, mat) => {
        e.stopPropagation();
        setForm({
            title: mat.title,
            course: mat.course,
            lecturer: mat.lecturer || '',
            type: mat.type || 'PDF',
            size: mat.size || '2.0MB',
            date: mat.date || getTodayDate(),
            description: mat.description || '',
            file_url: mat.file_url || null,
        });
        setEditItem(mat);
        setModalMode('edit');
    };

    const handleSave = () => {
        if (!form.title.trim() || !form.course.trim()) return;
        const payload = {
            ...form,
            semester: 'Semester 3',
        };
        if (modalMode === 'add') {
            adminHandlers.material.add(payload);
        } else {
            adminHandlers.material.update(editItem.id, payload);
        }
        setModalMode(null);
    };

    const handleDelete = () => {
        if (!confirmDeleteId) return;
        adminHandlers.material.delete(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    // Filter logic
    const filtered = materials.filter(m => {
        const matchSearch =
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            m.course.toLowerCase().includes(search.toLowerCase()) ||
            (m.lecturer && m.lecturer.toLowerCase().includes(search.toLowerCase()));

        const matchCourse = selectedCourse === 'Semua' || m.course === selectedCourse;
        return matchSearch && matchCourse;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-slate-900">Materi Perkuliahan</h1>
                        {isAdmin && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                Admin
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Daftar seluruh materi kuliah Semester 3 · {materials.length} Berkas
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari materi / dosen..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm w-full sm:w-56"
                        />
                    </div>

                    {/* Filter Mata Kuliah */}
                    <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
                    >
                        <option value="Semua">Semua Matkul ({materials.length})</option>
                        {courses.map(c => {
                            const count = materials.filter(m => m.course === c.name).length;
                            return (
                                <option key={c.id} value={c.name}>
                                    {c.name} ({count})
                                </option>
                            );
                        })}
                    </select>

                    {/* Tombol Tambah Admin */}
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shrink-0 shadow-sm"
                        >
                            <Icon name="plus" className="w-4 h-4" /> Tambah Materi
                        </button>
                    )}
                </div>
            </div>

            {/* List Materi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-200 text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Icon name="book-open" className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">Materi tidak ditemukan.</p>
                        {isAdmin && (
                            <button
                                onClick={openAdd}
                                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Materi Baru
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(mat => (
                        <div
                            key={mat.id}
                            onClick={() => navigateTo('materi-detail', { id: mat.id })}
                            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-2 gap-2">
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 line-clamp-1 border border-slate-200">
                                        {mat.course}
                                    </span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
                                            {mat.type}
                                        </span>
                                        {isAdmin && (
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={(e) => openEdit(e, mat)}
                                                    className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                    title="Edit Materi"
                                                >
                                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDeleteId(mat.id);
                                                    }}
                                                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Hapus Materi"
                                                >
                                                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition leading-snug">
                                    {mat.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                                    <Icon name="user" className="w-3 h-3 text-slate-400" />
                                    {mat.lecturer}
                                </p>
                                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                    {mat.description}
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                    <Icon name="file" className="w-3 h-3 text-slate-400" />
                                    {mat.size} · {mat.date}
                                </span>
                                <span className="font-semibold text-slate-900 group-hover:translate-x-0.5 transition inline-flex items-center gap-1">
                                    Detail <Icon name="arrow-right" className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Tambah / Edit Materi */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Tambah Materi Perkuliahan' : 'Edit Materi Perkuliahan'}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        <FormField label="Berkas Dokumen / Materi (PDF, PPTX, Word, ZIP, dll)">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip,.rar,.mp4"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl border border-slate-300 transition inline-flex items-center justify-center gap-2"
                                >
                                    <Icon name="upload" className="w-3.5 h-3.5" />
                                    {uploading ? 'Mengunggah Berkas...' : 'Unggah File dari Komputer'}
                                </button>
                                {form.file_url ? (
                                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium truncate flex items-center gap-1">
                                        <Icon name="check" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        Berkas tersimpan di server
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-slate-400">
                                        Opsional (bisa isi judul & info secara manual)
                                    </span>
                                )}
                            </div>
                        </FormField>

                        <FormField label="Judul Materi" required>
                            <input
                                className={inputCls}
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Normalisasi Database & Relasi Tabel"
                            />
                        </FormField>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField label="Mata Kuliah" required>
                                <select
                                    className={selectCls}
                                    value={form.course}
                                    onChange={e => handleCourseSelect(e.target.value)}
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Dosen Pengampu">
                                <input
                                    className={inputCls}
                                    value={form.lecturer}
                                    onChange={e => setForm(f => ({ ...f, lecturer: e.target.value }))}
                                    placeholder="Nama Dosen"
                                />
                            </FormField>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <FormField label="Jenis Berkas">
                                <select
                                    className={selectCls}
                                    value={form.type}
                                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                >
                                    {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ukuran">
                                <input
                                    className={inputCls}
                                    value={form.size}
                                    onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                                    placeholder="2.5MB"
                                />
                            </FormField>
                            <FormField label="Tanggal">
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={form.date}
                                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                />
                            </FormField>
                        </div>

                        <FormField label="Deskripsi Materi">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Rangkuman atau catatan penting materi kuliah..."
                            />
                        </FormField>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setModalMode(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
                            >
                                {modalMode === 'add' ? 'Simpan Materi' : 'Perbarui Materi'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Konfirmasi Hapus */}
            {confirmDeleteId && (
                <ConfirmDialog
                    message={`Materi "${materials.find(m => m.id === confirmDeleteId)?.title}" akan dihapus permanen.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}