import React, { useState, useRef } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';
import { getFileUrl } from '../lib/api';
import { uploadDocument } from '../lib/storage';

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function AssignmentsPage({
    assignments = [],
    courses = [],
    navigateTo,
    isAdmin,
    adminHandlers,
    showToast,
    currentUser,
    submissions = [],
    onSubmitAssignment,
}) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [courseFilter, setCourseFilter] = useState('Semua');

    // Admin state
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
    const [editItem, setEditItem] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [viewSubmissionsTask, setViewSubmissionsTask] = useState(null);

    // File input refs
    const memberFileInputRef = useRef(null);
    const adminFileInputRef = useRef(null);

    // Member submission modal state
    const [submitTarget, setSubmitTarget] = useState(null);
    const [submitMethod, setSubmitMethod] = useState('upload'); // 'upload' | 'link'
    const [submitUploading, setSubmitUploading] = useState(false);
    const [submitUploadProgress, setSubmitUploadProgress] = useState(0);
    const [submitForm, setSubmitForm] = useState({
        link: '',
        file_url: '',
        fileName: '',
        fileSize: '',
        note: '',
    });

    // Admin assignment form state
    const [adminUploading, setAdminUploading] = useState(false);
    const [adminUploadProgress, setAdminUploadProgress] = useState(0);
    const [form, setForm] = useState({
        title: '',
        course: courses[0]?.name || '',
        lecturer: courses[0]?.lecturer || '',
        deadline: getTodayDate(),
        status: 'Aktif',
        description: '',
        file_url: '',
        fileName: '',
    });

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
            deadline: getTodayDate(),
            status: 'Aktif',
            description: '',
            file_url: '',
            fileName: '',
        });
        setEditItem(null);
        setModalMode('add');
    };

    const openEdit = (task) => {
        setForm({
            title: task.title,
            course: task.course,
            lecturer: task.lecturer || '',
            deadline: task.deadline || getTodayDate(),
            status: task.status || 'Aktif',
            description: task.description || '',
            file_url: task.file_url || '',
            fileName: task.fileName || (task.file_url ? 'Berkas Panduan Soal' : ''),
        });
        setEditItem(task);
        setModalMode('edit');
    };

    // Upload berkas lampiran soal/tugas oleh Admin
    const handleAdminFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAdminUploading(true);
        setAdminUploadProgress(10);
        try {
            const uploaded = await uploadDocument(file, (prog) => {
                setAdminUploadProgress(prog);
            });
            setForm(f => ({
                ...f,
                file_url: uploaded.file_url,
                fileName: uploaded.name,
                fileSize: uploaded.size,
            }));
            if (showToast) showToast(`Dokumen soal "${file.name}" berhasil diunggah!`, 'success');
        } catch (err) {
            if (showToast) showToast('Gagal mengunggah berkas soal: ' + err.message, 'error');
        } finally {
            setAdminUploading(false);
            setAdminUploadProgress(0);
            e.target.value = '';
        }
    };

    const handleSave = () => {
        if (!form.title.trim() || !form.course.trim()) {
            if (showToast) showToast('Judul dan Mata Kuliah wajib diisi', 'error');
            return;
        }
        if (modalMode === 'add') {
            adminHandlers.assignment.add(form);
        } else {
            adminHandlers.assignment.update(editItem.id, form);
        }
        setModalMode(null);
    };

    const handleDelete = () => {
        if (!confirmDeleteId) return;
        adminHandlers.assignment.delete(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    // Open member submission modal
    const openSubmitModal = (task) => {
        const currentNim = currentUser?.nim || currentUser?.username;
        const mySub = submissions.find(s => s.assignmentId === task.id && s.nim === currentNim);
        const hasUploadedFile = Boolean(mySub?.file_url);

        setSubmitForm({
            link: mySub?.link || '',
            file_url: mySub?.file_url || '',
            fileName: mySub?.fileName || (mySub?.file_url ? 'Berkas Tugas Mahasiswa' : ''),
            fileSize: mySub?.fileSize || '',
            note: mySub?.note || '',
        });
        setSubmitMethod(hasUploadedFile ? 'upload' : (mySub?.link?.startsWith('http') ? 'link' : 'upload'));
        setSubmitTarget(task);
    };

    // Upload berkas tugas oleh Mahasiswa
    const handleMemberFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSubmitUploading(true);
        setSubmitUploadProgress(10);
        try {
            const uploaded = await uploadDocument(file, (prog) => {
                setSubmitUploadProgress(prog);
            });
            setSubmitForm(prev => ({
                ...prev,
                file_url: uploaded.file_url,
                fileName: uploaded.name,
                fileSize: uploaded.size,
                link: prev.link || uploaded.file_url,
            }));
            if (showToast) showToast(`Berkas tugas "${file.name}" siap disimpan ke database!`, 'success');
        } catch (err) {
            if (showToast) showToast('Gagal membaca berkas tugas: ' + err.message, 'error');
        } finally {
            setSubmitUploading(false);
            setSubmitUploadProgress(0);
            e.target.value = '';
        }
    };

    const handleDoSubmit = () => {
        if (submitMethod === 'upload' && !submitForm.file_url) {
            if (showToast) showToast('Silakan pilih berkas tugas dari perangkat Anda untuk diunggah', 'error');
            return;
        }
        if (submitMethod === 'link' && !submitForm.link.trim()) {
            if (showToast) showToast('Silakan masukkan link tugas atau Google Drive', 'error');
            return;
        }

        const payload = {
            ...submitForm,
            link: submitMethod === 'upload' ? (submitForm.file_url || submitForm.link) : submitForm.link,
            file_url: submitForm.file_url || (submitMethod === 'upload' ? submitForm.link : null),
        };

        if (onSubmitAssignment && submitTarget) {
            onSubmitAssignment(submitTarget.id, payload);
        }
        setSubmitTarget(null);
    };

    // Filter list tugas
    const filtered = assignments.filter(a => {
        const matchSearch =
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.course.toLowerCase().includes(search.toLowerCase()) ||
            (a.lecturer && a.lecturer.toLowerCase().includes(search.toLowerCase()));

        const matchStatus = statusFilter === 'Semua' || a.status === statusFilter;
        const matchCourse = courseFilter === 'Semua' || a.course === courseFilter;

        return matchSearch && matchStatus && matchCourse;
    });

    const activeCount = assignments.filter(a => a.status === 'Aktif').length;

    return (
        <div className="space-y-6">
            {/* Header Konten */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-slate-900">Tugas Kuliah</h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 text-xs font-bold">
                            {activeCount} Aktif
                        </span>
                        {isAdmin ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-bold">
                                Administrator
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[10px] font-bold">
                                Mahasiswa
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola, unduh soal, dan kumpulkan seluruh tugas perkuliahan Semester 3 langsung ke sistem database
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Pencarian */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari tugas..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm w-full sm:w-52"
                        />
                    </div>

                    {/* Filter Status */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
                    >
                        <option value="Semua">Semua Status</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Selesai">Selesai</option>
                    </select>

                    {/* Filter Mata Kuliah */}
                    <select
                        value={courseFilter}
                        onChange={e => setCourseFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
                    >
                        <option value="Semua">Semua Matkul</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>

                    {/* Tombol Buat Tugas (Admin) */}
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shrink-0 shadow-sm"
                        >
                            <Icon name="plus" className="w-4 h-4" /> Buat Tugas Baru
                        </button>
                    )}
                </div>
            </div>

            {/* List Kartu Tugas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-200 text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Icon name="clipboard-list" className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">Tidak ada tugas perkuliahan yang sesuai filter.</p>
                        {isAdmin && (
                            <button
                                onClick={openAdd}
                                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" /> Buat Tugas Baru
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(task => {
                        const matchedCourse = courses.find(c => c.name === task.course);
                        const taskSubs = submissions.filter(s => s.assignmentId === task.id);
                        const currentNim = currentUser?.nim || currentUser?.username;
                        const mySub = !isAdmin && currentUser ? submissions.find(s => s.assignmentId === task.id && s.nim === currentNim) : null;

                        return (
                            <div
                                key={task.id}
                                className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <button
                                            onClick={() => matchedCourse && navigateTo('matkul-detail', { id: matchedCourse.id })}
                                            className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition border border-slate-200 flex items-center gap-1"
                                            title="Buka Mata Kuliah"
                                        >
                                            <Icon name="book-open" className="w-3 h-3 text-slate-500" />
                                            {task.course}
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                task.status === 'Aktif'
                                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30'
                                                    : 'bg-slate-500/15 text-slate-300 border border-slate-400/30'
                                            }`}>
                                                {task.status}
                                            </span>

                                            {isAdmin && (
                                                <div className="flex items-center gap-0.5 ml-1">
                                                    <button
                                                        onClick={() => openEdit(task)}
                                                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                        title="Edit Tugas"
                                                    >
                                                        <Icon name="pencil" className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(task.id)}
                                                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                        title="Hapus Tugas"
                                                    >
                                                        <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-slate-900 text-base mt-2 leading-snug">
                                        {task.title}
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                        {task.description}
                                    </p>

                                    {/* Lampiran Panduan Soal dari Admin */}
                                    {task.file_url && (
                                        <div className="mt-3">
                                            <a
                                                href={getFileUrl(task.file_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-400/30 text-xs font-semibold transition"
                                                title="Unduh Berkas Panduan Soal Tugas"
                                            >
                                                <Icon name="download" className="w-3.5 h-3.5" />
                                                <span>Unduh Panduan / Soal Tugas</span>
                                            </a>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-100 space-y-3">
                                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                                        <span className="flex items-center gap-1">
                                            <Icon name="user" className="w-3.5 h-3.5 text-slate-400" />
                                            {task.lecturer}
                                        </span>
                                        <span className="font-semibold text-rose-600 flex items-center gap-1">
                                            <Icon name="calendar" className="w-3.5 h-3.5" />
                                            Tenggat: {task.deadline}
                                        </span>
                                    </div>

                                    {/* Action Bar: Member Pengumpulan atau Admin Submissions */}
                                    <div className="pt-1">
                                        {!isAdmin ? (
                                            /* Member: Status & Aksi Tugas */
                                            mySub ? (
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
                                                    <div className="flex items-center gap-1.5">
                                                        <Icon name="check-circle" className="w-4 h-4 text-emerald-600 shrink-0" />
                                                        <div>
                                                            <span className="text-xs font-bold text-emerald-800 block">
                                                                Terkumpul ({mySub.submittedAt})
                                                            </span>
                                                            {(mySub.file_url || mySub.link) && (
                                                                <a
                                                                    href={getFileUrl(mySub.file_url || mySub.link)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 mt-0.5"
                                                                >
                                                                    <Icon name="external-link" className="w-3 h-3" />
                                                                    Lihat Berkas Saya
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => openSubmitModal(task)}
                                                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition shadow-xs text-center"
                                                    >
                                                        Edit / Kirim Ulang
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => openSubmitModal(task)}
                                                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm"
                                                >
                                                    <Icon name="upload" className="w-3.5 h-3.5" /> Kumpulkan Tugas Sekarang
                                                </button>
                                            )
                                        ) : (
                                            /* Admin: Tombol Lihat yang mengumpulkan */
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => setViewSubmissionsTask(task)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition border border-slate-200"
                                                >
                                                    <Icon name="users" className="w-3.5 h-3.5 text-slate-600" />
                                                    Daftar Pengumpulan Mahasiswa ({taskSubs.length})
                                                </button>
                                                <span className="text-[11px] text-slate-400">
                                                    {taskSubs.length > 0 ? 'Tersedia berkas' : 'Belum ada pengumpulan'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Modal Member: Kumpulkan Tugas Langsung ke Database ── */}
            {submitTarget && (
                <Modal title={`Kumpulkan Tugas: ${submitTarget.title}`} onClose={() => setSubmitTarget(null)}>
                    <div className="space-y-4">
                        {/* Hidden file input untuk member */}
                        <input
                            type="file"
                            ref={memberFileInputRef}
                            onChange={handleMemberFileUpload}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.7z,.jpg,.jpeg,.png,.webp,.txt"
                            className="hidden"
                        />

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="text-slate-500">Mata Kuliah: <strong className="text-slate-900">{submitTarget.course}</strong></p>
                            <p className="text-slate-500">Batas Waktu: <strong className="text-rose-600">{submitTarget.deadline}</strong></p>
                            <p className="text-slate-500">Mahasiswa: <strong className="text-slate-900">{currentUser?.fullname} ({currentUser?.nim || currentUser?.username})</strong></p>
                        </div>

                        {/* Pilihan Metode Pengumpulan */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">Metode Penyerahan Tugas</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSubmitMethod('upload')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${
                                        submitMethod === 'upload'
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon name="upload" className="w-3.5 h-3.5" />
                                    Unggah Berkas (Laptop/HP)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSubmitMethod('link')}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${
                                        submitMethod === 'link'
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon name="link" className="w-3.5 h-3.5" />
                                    Tautan Drive / URL
                                </button>
                            </div>
                        </div>

                        {/* Tab 1: Unggah Berkas Dokumen Nyata */}
                        {submitMethod === 'upload' ? (
                            <div className="space-y-2">
                                <FormField label="Berkas Tugas (PDF, DOCX, ZIP, PPTX, Gambar)" required>
                                    <div
                                        onClick={() => !submitUploading && memberFileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition">
                                            <Icon name="file-text" className="w-5 h-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-800">
                                            {submitUploading ? 'Mengunggah ke database...' : 'Klik untuk Pilih Dokumen / Tugas dari HP atau Laptop'}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Format: PDF, Word, PowerPoint, Excel, ZIP, atau Foto Tugas
                                        </p>
                                    </div>
                                </FormField>

                                {submitUploading && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                                            <span>Mengunggah dokumen tugas...</span>
                                            <span>{submitUploadProgress}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-1.5 transition-all duration-300"
                                                style={{ width: `${submitUploadProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {submitForm.file_url && !submitUploading && (
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-xs">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Icon name="check-circle" className="w-4 h-4 text-emerald-600 shrink-0" />
                                            <div className="truncate">
                                                <p className="font-bold text-emerald-800 dark:text-emerald-300 truncate">
                                                    {submitForm.fileName || 'Berkas Tugas Berhasil Terpilih'}
                                                </p>
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                    {submitForm.fileSize ? `Ukuran: ${submitForm.fileSize} · ` : ''}Tersimpan dan siap dikirim ke database
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <a
                                                href={getFileUrl(submitForm.file_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] font-bold text-blue-600 hover:underline"
                                            >
                                                Lihat
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => setSubmitForm(f => ({ ...f, file_url: '', fileName: '', fileSize: '' }))}
                                                className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                            >
                                                Ganti
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Tab 2: Tautan Drive / URL */
                            <FormField label="Tautan Berkas Tugas (Google Drive / GitHub / OneDrive)" required>
                                <input
                                    className={inputCls}
                                    value={submitForm.link}
                                    onChange={e => setSubmitForm(f => ({ ...f, link: e.target.value }))}
                                    placeholder="https://drive.google.com/file/d/..."
                                />
                                <span className="text-[11px] text-slate-400 block mt-1">
                                    Pastikan tautan Google Drive atau URL dapat diakses oleh dosen dan admin.
                                </span>
                            </FormField>
                        )}

                        <FormField label="Catatan Tambahan untuk Dosen / Admin (Opsional)">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={submitForm.note}
                                onChange={e => setSubmitForm(f => ({ ...f, note: e.target.value }))}
                                placeholder="Tuliskan catatan pengerjaan, ringkasan jawaban, atau pesan singkat..."
                            />
                        </FormField>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setSubmitTarget(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDoSubmit}
                                disabled={submitUploading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium transition flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <Icon name="check" className="w-4 h-4" />
                                {submitUploading ? 'Mengunggah...' : 'Kirim & Simpan ke Database'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal Admin: Lihat Seluruh Pengumpulan Mahasiswa ── */}
            {viewSubmissionsTask && (
                <Modal
                    title={`Daftar Pengumpulan: ${viewSubmissionsTask.title}`}
                    onClose={() => setViewSubmissionsTask(null)}
                >
                    <div className="space-y-4">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                            <div>
                                <span className="text-slate-500">Mata Kuliah: </span>
                                <strong className="text-slate-900">{viewSubmissionsTask.course}</strong>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 font-bold text-[11px]">
                                {submissions.filter(s => s.assignmentId === viewSubmissionsTask.id).length} Mahasiswa Telah Mengumpulkan
                            </span>
                        </div>

                        {submissions.filter(s => s.assignmentId === viewSubmissionsTask.id).length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs">
                                <Icon name="clipboard-list" className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                Belum ada mahasiswa yang mengumpulkan tugas ini.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {submissions.filter(s => s.assignmentId === viewSubmissionsTask.id).map(sub => {
                                    const fileTarget = sub.file_url || sub.link;
                                    const isUploadedDoc = sub.file_url && !sub.file_url.startsWith('http');

                                    return (
                                        <div key={sub.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                                        {sub.studentName ? sub.studentName.charAt(0).toUpperCase() : 'M'}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block">{sub.studentName}</span>
                                                        <span className="text-[10px] text-slate-500 font-mono">NIM: {sub.nim}</span>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                                    {sub.submittedAt}
                                                </span>
                                            </div>

                                            {sub.note && (
                                                <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-slate-700 text-[11px] leading-relaxed">
                                                    <span className="font-semibold text-slate-500 block text-[10px] uppercase">Catatan Mahasiswa:</span>
                                                    "{sub.note}"
                                                </div>
                                            )}

                                            {fileTarget && (
                                                <div className="flex items-center justify-between pt-1">
                                                    <a
                                                        href={getFileUrl(fileTarget)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download={isUploadedDoc}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-xs"
                                                    >
                                                        <Icon name={isUploadedDoc ? "download" : "external-link"} className="w-3.5 h-3.5" />
                                                        {isUploadedDoc ? 'Unduh Berkas Tugas Mahasiswa' : 'Buka Tautan Tugas Mahasiswa'}
                                                    </a>

                                                    <span className="text-[10px] text-slate-400">
                                                        {isUploadedDoc ? 'Tersimpan di Server MySQL' : 'Tautan Cloud / Drive'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setViewSubmissionsTask(null)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
                        >
                            Tutup
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Modal Admin: Tambah / Edit Tugas & Berkas Soal ── */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Tambah Tugas Kuliah Baru' : 'Edit Tugas Kuliah'}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={adminFileInputRef}
                            onChange={handleAdminFileUpload}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                            className="hidden"
                        />

                        <FormField label="Judul Tugas" required>
                            <input
                                className={inputCls}
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Perancangan Arsitektur Basis Data Terdistribusi"
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

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Batas Pengumpulan (Deadline)" required>
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={form.deadline}
                                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                                />
                            </FormField>
                            <FormField label="Status Tugas">
                                <select
                                    className={selectCls}
                                    value={form.status}
                                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </FormField>
                        </div>

                        <FormField label="Instruksi & Deskripsi Tugas" required>
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Jelaskan detail tugas, petunjuk pengerjaan, dan ketentuan penyerahan..."
                            />
                        </FormField>

                        {/* Unggah Berkas Lampiran / Panduan Soal Tugas oleh Admin */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Berkas Panduan / Soal Tugas (Opsional)
                            </label>

                            <div
                                onClick={() => !adminUploading && adminFileInputRef.current?.click()}
                                className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-3 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-center gap-2"
                            >
                                <Icon name="upload" className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-700">
                                    {adminUploading ? 'Mengunggah...' : 'Pilih Berkas Soal / Silabus dari Komputer (PDF, DOCX, ZIP)'}
                                </span>
                            </div>

                            {adminUploading && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                        <span>Mengunggah dokumen...</span>
                                        <span>{adminUploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                        <div className="bg-blue-600 h-1" style={{ width: `${adminUploadProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            {form.file_url && !adminUploading && (
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <Icon name="file-text" className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span className="font-bold text-blue-900 truncate">
                                            {form.fileName || 'Berkas Lampiran Soal Siap Disimpan'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setForm(f => ({ ...f, file_url: '', fileName: '' }))}
                                        className="text-red-500 hover:text-red-700 font-semibold text-xs ml-2 shrink-0"
                                    >
                                        Hapus
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setModalMode(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={adminUploading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium transition"
                            >
                                {modalMode === 'add' ? 'Simpan Tugas ke Database' : 'Perbarui Tugas'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Konfirmasi Hapus Tugas */}
            {confirmDeleteId && (
                <ConfirmDialog
                    message={`Tugas "${assignments.find(a => a.id === confirmDeleteId)?.title}" akan dihapus permanen dari sistem.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}
