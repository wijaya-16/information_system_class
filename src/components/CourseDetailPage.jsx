import React, { useState, useRef } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';
import { getFileUrl } from '../lib/api';
import { uploadDocument } from '../lib/storage';

const TABS = [
    { id: 'materi', label: 'Materi', icon: 'book-open' },
    { id: 'tugas', label: 'Tugas', icon: 'clipboard-list' },
    { id: 'pengumuman', label: 'Pengumuman', icon: 'megaphone' },
];

const FILE_TYPES = ['PDF', 'PPTX', 'DOCX', 'ZIP', 'MP4', 'XLSX'];
const ANNOUNCEMENT_CATEGORIES = ['Akademik', 'Tugas', 'Jadwal', 'Umum'];

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function CourseDetailPage({
    id,
    courses = [],
    materials = [],
    assignments = [],
    announcements = [],
    navigateTo,
    showToast,
    isAdmin,
    adminHandlers,
}) {
    const [activeTab, setActiveTab] = useState('materi');

    // Admin states
    // modalType: null | 'materi-add' | 'materi-edit' | 'tugas-add' | 'tugas-edit' | 'pengumuman-add' | 'pengumuman-edit'
    const [modalType, setModalType] = useState(null);
    const [editItem, setEditItem] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'material'|'assignment'|'announcement', id, title }

    // Upload refs & states
    const materiFileInputRef = useRef(null);
    const tugasFileInputRef = useRef(null);
    const [materiUploading, setMateriUploading] = useState(false);
    const [materiUploadProgress, setMateriUploadProgress] = useState(0);
    const [tugasUploading, setTugasUploading] = useState(false);
    const [tugasUploadProgress, setTugasUploadProgress] = useState(0);

    // Forms
    const [materiForm, setMateriForm] = useState({
        title: '',
        type: 'PDF',
        size: '2.5MB',
        date: getTodayDate(),
        lecturer: '',
        description: '',
        file_url: null,
        fileName: '',
    });

    const [tugasForm, setTugasForm] = useState({
        title: '',
        deadline: getTodayDate(),
        status: 'Aktif',
        lecturer: '',
        description: '',
        file_url: null,
        fileName: '',
    });

    const [pengumumanForm, setPengumumanForm] = useState({
        title: '',
        category: 'Akademik',
        author: 'Administrator',
        date: getTodayDate(),
        important: false,
        content: '',
    });

    const course = courses.find(c => c.id === parseInt(id));

    if (!course) {
        return (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                    <Icon name="alert-circle" className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Mata kuliah tidak ditemukan</h2>
                <p className="text-xs text-slate-500 mt-1">Mata kuliah mungkin telah dihapus atau dipindahkan.</p>
                <button
                    onClick={() => navigateTo('matkul')}
                    className="mt-4 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                >
                    Kembali ke Daftar Mata Kuliah
                </button>
            </div>
        );
    }

    // Filter data berdasarkan nama mata kuliah
    const courseMateri = materials.filter(m => m.course === course.name);
    const courseTugas = assignments.filter(a => a.course === course.name);
    const coursePengumuman = announcements.filter(a => a.course === course.name);

    // ─── Upload Handler untuk Dokumen Materi ──────────────────────────────────────
    const handleMateriFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMateriUploading(true);
        setMateriUploadProgress(15);
        try {
            const res = await uploadDocument(file, (p) => setMateriUploadProgress(p));
            setMateriForm(f => ({
                ...f,
                title: f.title || file.name.replace(/\.[^/.]+$/, ''),
                type: res.type || f.type,
                size: res.size || f.size,
                file_url: res.file_url,
                fileName: file.name,
            }));
            if (showToast) showToast(`Dokumen materi "${file.name}" berhasil diunggah dan siap disimpan!`, 'success');
        } catch (err) {
            if (showToast) showToast('Gagal mengunggah berkas materi: ' + err.message, 'error');
        } finally {
            setMateriUploading(false);
            setMateriUploadProgress(0);
            if (e.target) e.target.value = '';
        }
    };

    // ─── Upload Handler untuk Berkas Tugas / Soal ──────────────────────────────────
    const handleTugasFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setTugasUploading(true);
        setTugasUploadProgress(15);
        try {
            const res = await uploadDocument(file, (p) => setTugasUploadProgress(p));
            setTugasForm(f => ({
                ...f,
                file_url: res.file_url,
                fileName: file.name,
            }));
            if (showToast) showToast(`Berkas panduan soal "${file.name}" berhasil diunggah!`, 'success');
        } catch (err) {
            if (showToast) showToast('Gagal mengunggah berkas soal: ' + err.message, 'error');
        } finally {
            setTugasUploading(false);
            setTugasUploadProgress(0);
            if (e.target) e.target.value = '';
        }
    };

    // ─── Modal Openers ─────────────────────────────────────────────────────────────
    const openAddMateri = () => {
        setMateriForm({
            title: '',
            type: 'PDF',
            size: '2.5MB',
            date: getTodayDate(),
            lecturer: course.lecturer,
            description: '',
            file_url: null,
            fileName: '',
        });
        setEditItem(null);
        setModalType('materi-add');
    };

    const openEditMateri = (e, item) => {
        e.stopPropagation();
        setMateriForm({
            title: item.title,
            type: item.type || 'PDF',
            size: item.size || '2.0MB',
            date: item.date || getTodayDate(),
            lecturer: item.lecturer || course.lecturer,
            description: item.description || '',
            file_url: item.file_url || null,
            fileName: item.fileName || (item.file_url ? 'Dokumen Materi' : ''),
        });
        setEditItem(item);
        setModalType('materi-edit');
    };

    const openAddTugas = () => {
        setTugasForm({
            title: '',
            deadline: getTodayDate(),
            status: 'Aktif',
            lecturer: course.lecturer,
            description: '',
            file_url: null,
            fileName: '',
        });
        setEditItem(null);
        setModalType('tugas-add');
    };

    const openEditTugas = (e, item) => {
        e.stopPropagation();
        setTugasForm({
            title: item.title,
            deadline: item.deadline || getTodayDate(),
            status: item.status || 'Aktif',
            lecturer: item.lecturer || course.lecturer,
            description: item.description || '',
            file_url: item.file_url || null,
            fileName: item.fileName || (item.file_url ? 'Berkas Panduan Soal' : ''),
        });
        setEditItem(item);
        setModalType('tugas-edit');
    };

    const openAddPengumuman = () => {
        setPengumumanForm({
            title: '',
            category: 'Akademik',
            author: course.lecturer || 'Administrator',
            date: getTodayDate(),
            important: false,
            content: '',
        });
        setEditItem(null);
        setModalType('pengumuman-add');
    };

    const openEditPengumuman = (e, item) => {
        e.stopPropagation();
        setPengumumanForm({
            title: item.title,
            category: item.category || 'Akademik',
            author: item.author || course.lecturer,
            date: item.date || getTodayDate(),
            important: !!item.important,
            content: item.content || '',
        });
        setEditItem(item);
        setModalType('pengumuman-edit');
    };

    // ─── Save Handlers ─────────────────────────────────────────────────────────────
    const saveMateri = () => {
        if (!materiForm.title.trim()) {
            if (showToast) showToast('Judul materi wajib diisi', 'error');
            return;
        }
        const payload = {
            ...materiForm,
            course: course.name,
            semester: 'Semester 3',
        };
        if (modalType === 'materi-add') {
            adminHandlers.material.add(payload);
        } else {
            adminHandlers.material.update(editItem.id, payload);
        }
        setModalType(null);
    };

    const saveTugas = () => {
        if (!tugasForm.title.trim()) {
            if (showToast) showToast('Judul tugas wajib diisi', 'error');
            return;
        }
        const payload = {
            ...tugasForm,
            course: course.name,
        };
        if (modalType === 'tugas-add') {
            adminHandlers.assignment.add(payload);
        } else {
            adminHandlers.assignment.update(editItem.id, payload);
        }
        setModalType(null);
    };

    const savePengumuman = () => {
        if (!pengumumanForm.title.trim()) {
            if (showToast) showToast('Judul pengumuman wajib diisi', 'error');
            return;
        }
        const payload = {
            ...pengumumanForm,
            course: course.name,
        };
        if (modalType === 'pengumuman-add') {
            adminHandlers.announcement.add(payload);
        } else {
            adminHandlers.announcement.update(editItem.id, payload);
        }
        setModalType(null);
    };

    // ─── Delete Handler ────────────────────────────────────────────────────────────
    const handleDeleteConfirm = () => {
        if (!confirmDelete) return;
        if (confirmDelete.type === 'material') {
            adminHandlers.material.delete(confirmDelete.id);
        } else if (confirmDelete.type === 'assignment') {
            adminHandlers.assignment.delete(confirmDelete.id);
        } else if (confirmDelete.type === 'announcement') {
            adminHandlers.announcement.delete(confirmDelete.id);
        }
        setConfirmDelete(null);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Navigasi Atas & Mode Admin Badge */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigateTo('matkul')}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                    <Icon name="arrow-left" className="w-4 h-4" /> Kembali ke Mata Kuliah
                </button>

                {isAdmin && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-semibold">
                        <Icon name="shield-check" className="w-3.5 h-3.5 text-amber-400" />
                        Admin Mode Aktif
                    </div>
                )}
            </div>

            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className={`h-2 w-full ${course.color}`} />
                <div className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-500">
                                {course.category} · {course.credits} SKS · Semester 3
                            </span>
                            <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{course.name}</h1>
                            <p className="text-sm text-slate-500 mt-2 flex items-center gap-2">
                                <Icon name="user" className="w-4 h-4 text-slate-400" />
                                {course.lecturer}
                            </p>
                        </div>
                        <div className="flex gap-4 sm:gap-6 shrink-0 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900">{courseMateri.length}</p>
                                <p className="text-xs text-slate-500">Materi</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900">{courseTugas.length}</p>
                                <p className="text-xs text-slate-500">Tugas</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900">{coursePengumuman.length}</p>
                                <p className="text-xs text-slate-500">Pengumuman</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-t border-slate-200 px-6 flex justify-between items-center bg-slate-50/50">
                    <div className="flex gap-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${
                                    activeTab === tab.id
                                        ? 'border-slate-900 text-slate-900 bg-white font-semibold'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                <Icon name={tab.icon} className="w-4 h-4" />
                                {tab.label}
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                    {tab.id === 'materi' ? courseMateri.length : tab.id === 'tugas' ? courseTugas.length : coursePengumuman.length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Tombol Tambah Admin sesuai Tab */}
                    {isAdmin && (
                        <div>
                            {activeTab === 'materi' && (
                                <button
                                    onClick={openAddMateri}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                                >
                                    <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Materi
                                </button>
                            )}
                            {activeTab === 'tugas' && (
                                <button
                                    onClick={openAddTugas}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                                >
                                    <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Tugas
                                </button>
                            )}
                            {activeTab === 'pengumuman' && (
                                <button
                                    onClick={openAddPengumuman}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                                >
                                    <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Pengumuman
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {/* ── TAB: MATERI ── */}
                {activeTab === 'materi' && (
                    <div className="space-y-3">
                        {courseMateri.length === 0 ? (
                            <EmptyState
                                icon="book-open"
                                message="Belum ada materi untuk mata kuliah ini."
                                action={isAdmin && { label: '+ Tambah Materi Pertama', onClick: openAddMateri }}
                            />
                        ) : (
                            courseMateri.map(mat => (
                                <div
                                    key={mat.id}
                                    onClick={() => navigateTo('materi-detail', { id: mat.id })}
                                    className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 hover:shadow-sm transition cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition">
                                            <Icon name="file-text" className="w-5 h-5 text-slate-600 group-hover:text-white transition" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition truncate">
                                                {mat.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{mat.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                        <span className="hidden sm:block text-xs text-slate-400">{mat.size}</span>
                                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">{mat.type}</span>

                                        {/* Tombol Unduh Cepat jika memiliki file_url */}
                                        {mat.file_url && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(getFileUrl(mat.file_url), '_blank');
                                                }}
                                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-400/30 text-[11px] font-bold transition flex items-center gap-1"
                                                title="Unduh / Buka Dokumen Materi"
                                            >
                                                <Icon name="download" className="w-3 h-3 text-emerald-400" />
                                                <span className="hidden sm:inline">Unduh</span>
                                            </button>
                                        )}

                                        {/* Admin Controls */}
                                        {isAdmin && (
                                            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                                                <button
                                                    onClick={(e) => openEditMateri(e, mat)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                    title="Edit Materi"
                                                >
                                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDelete({ type: 'material', id: mat.id, title: mat.title });
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Hapus Materi"
                                                >
                                                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        <Icon name="chevron-right" className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── TAB: TUGAS ── */}
                {activeTab === 'tugas' && (
                    <div className="space-y-3">
                        {courseTugas.length === 0 ? (
                            <EmptyState
                                icon="clipboard-list"
                                message="Belum ada tugas untuk mata kuliah ini."
                                action={isAdmin && { label: '+ Buat Tugas Pertama', onClick: openAddTugas }}
                            />
                        ) : (
                            courseTugas.map(task => (
                                <div key={task.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm transition">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                                                <Icon name="clipboard-list" className="w-5 h-5 text-amber-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                        task.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{task.description}</p>
                                                
                                                {/* Lampiran Panduan Soal Tugas */}
                                                {task.file_url && (
                                                    <div className="mt-2.5">
                                                        <a
                                                            href={getFileUrl(task.file_url)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            download
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-400/30 text-[11px] font-semibold transition"
                                                            title="Unduh Panduan Soal"
                                                        >
                                                            <Icon name="download" className="w-3 h-3" /> Unduh Panduan / Soal
                                                        </a>
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2.5">
                                                    <span className="flex items-center gap-1">
                                                        <Icon name="user" className="w-3 h-3" /> {task.lecturer}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-red-600 font-medium">
                                                        <Icon name="calendar" className="w-3 h-3" /> Tenggat: {task.deadline}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin Controls */}
                                        {isAdmin && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => openEditTugas(e, task)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                    title="Edit Tugas"
                                                >
                                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete({ type: 'assignment', id: task.id, title: task.title })}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Hapus Tugas"
                                                >
                                                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── TAB: PENGUMUMAN ── */}
                {activeTab === 'pengumuman' && (
                    <div className="space-y-3">
                        {coursePengumuman.length === 0 ? (
                            <EmptyState
                                icon="megaphone"
                                message="Belum ada pengumuman untuk mata kuliah ini."
                                action={isAdmin && { label: '+ Buat Pengumuman Pertama', onClick: openAddPengumuman }}
                            />
                        ) : (
                            coursePengumuman.map(item => (
                                <div key={item.id} className={`bg-white border rounded-xl p-5 hover:shadow-sm transition ${item.important ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.important ? 'bg-amber-100' : 'bg-slate-100'}`}>
                                            <Icon name="megaphone" className={`w-5 h-5 ${item.important ? 'text-amber-700' : 'text-slate-600'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                                        {item.category}
                                                    </span>
                                                    {item.important && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                                            <Icon name="alert-triangle" className="w-3 h-3 text-amber-700" /> Penting
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Admin Controls */}
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={(e) => openEditPengumuman(e, item)}
                                                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                            title="Edit Pengumuman"
                                                        >
                                                            <Icon name="pencil" className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => setConfirmDelete({ type: 'announcement', id: item.id, title: item.title })}
                                                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                            title="Hapus Pengumuman"
                                                        >
                                                            <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-semibold text-slate-900 mt-1">{item.title}</h3>
                                            <p className="text-xs text-slate-600 leading-relaxed mt-1.5 whitespace-pre-line">{item.content}</p>
                                            <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1.5">
                                                <Icon name="calendar" className="w-3 h-3" />
                                                {item.date} · Oleh <span className="font-medium text-slate-600">{item.author}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* ── Modal: Form Materi (Dengan Unggah Dokumen Nyata Langsung ke Database) ── */}
            {(modalType === 'materi-add' || modalType === 'materi-edit') && (
                <Modal
                    title={modalType === 'materi-add' ? `Tambah Materi (${course.name})` : `Edit Materi (${course.name})`}
                    onClose={() => setModalType(null)}
                >
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={materiFileInputRef}
                            onChange={handleMateriFileUpload}
                            className="hidden"
                            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.zip,.rar,.mp4"
                        />

                        {/* Area Unggah Dokumen Materi dari Laptop / HP */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Unggah Dokumen Materi (Laptop / HP)
                            </label>

                            {!materiForm.file_url ? (
                                <div
                                    onClick={() => !materiUploading && materiFileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-5 text-center cursor-pointer transition bg-slate-50/50 hover:bg-slate-50 group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition">
                                        <Icon name="file-text" className="w-5 h-5" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-800">
                                        {materiUploading ? 'Mengunggah ke database...' : 'Klik untuk Pilih Dokumen Materi dari Komputer / HP'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Mendukung PDF, Word, PowerPoint, Excel, ZIP, atau MP4 (Langsung tersimpan ke database)
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-xs">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Icon name="check-circle" className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <div className="truncate">
                                            <p className="font-bold text-emerald-800 dark:text-emerald-300 truncate">
                                                {materiForm.fileName || 'Berkas Dokumen Terunggah'}
                                            </p>
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                                {materiForm.size} · Format {materiForm.type} · Siap disimpan ke database
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => window.open(getFileUrl(materiForm.file_url), '_blank')}
                                            className="text-[11px] font-bold text-blue-600 hover:underline"
                                        >
                                            Lihat
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => materiFileInputRef.current?.click()}
                                            className="text-slate-500 hover:text-slate-800 text-xs font-semibold"
                                        >
                                            Ganti
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMateriForm(f => ({ ...f, file_url: null, fileName: '' }))}
                                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            )}

                            {materiUploading && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                                        <span>Mengunggah dokumen ke database...</span>
                                        <span>{materiUploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-1.5 transition-all duration-300"
                                            style={{ width: `${materiUploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <FormField label="Judul Materi" required>
                            <input
                                className={inputCls}
                                value={materiForm.title}
                                onChange={e => setMateriForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Pengenalan User Experience & Wireframe"
                            />
                        </FormField>

                        <FormField label="Dosen Pengampu">
                            <input
                                className={inputCls}
                                value={materiForm.lecturer}
                                onChange={e => setMateriForm(f => ({ ...f, lecturer: e.target.value }))}
                                placeholder={course.lecturer}
                            />
                        </FormField>

                        <div className="grid grid-cols-3 gap-3">
                            <FormField label="Jenis File">
                                <select
                                    className={selectCls}
                                    value={materiForm.type}
                                    onChange={e => setMateriForm(f => ({ ...f, type: e.target.value }))}
                                >
                                    {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Ukuran File">
                                <input
                                    className={inputCls}
                                    value={materiForm.size}
                                    onChange={e => setMateriForm(f => ({ ...f, size: e.target.value }))}
                                    placeholder="2.5MB"
                                />
                            </FormField>
                            <FormField label="Tanggal">
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={materiForm.date}
                                    onChange={e => setMateriForm(f => ({ ...f, date: e.target.value }))}
                                />
                            </FormField>
                        </div>

                        <FormField label="Deskripsi Materi">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={materiForm.description}
                                onChange={e => setMateriForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Ringkasan poin pembelajaran materi ini..."
                            />
                        </FormField>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setModalType(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={saveMateri}
                                disabled={materiUploading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium transition"
                            >
                                {modalType === 'materi-add' ? 'Simpan Materi ke Database' : 'Perbarui Materi'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal: Form Tugas (Dengan Unggah Berkas Panduan Soal) ── */}
            {(modalType === 'tugas-add' || modalType === 'tugas-edit') && (
                <Modal
                    title={modalType === 'tugas-add' ? `Tambah Tugas (${course.name})` : `Edit Tugas (${course.name})`}
                    onClose={() => setModalType(null)}
                >
                    <div className="space-y-4">
                        <input
                            type="file"
                            ref={tugasFileInputRef}
                            onChange={handleTugasFileUpload}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
                        />

                        <FormField label="Judul Tugas" required>
                            <input
                                className={inputCls}
                                value={tugasForm.title}
                                onChange={e => setTugasForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Tugas Analisis Kebutuhan Sistem"
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Batas Pengumpulan (Deadline)" required>
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={tugasForm.deadline}
                                    onChange={e => setTugasForm(f => ({ ...f, deadline: e.target.value }))}
                                />
                            </FormField>
                            <FormField label="Status Tugas">
                                <select
                                    className={selectCls}
                                    value={tugasForm.status}
                                    onChange={e => setTugasForm(f => ({ ...f, status: e.target.value }))}
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </FormField>
                        </div>

                        <FormField label="Dosen Pengampu">
                            <input
                                className={inputCls}
                                value={tugasForm.lecturer}
                                onChange={e => setTugasForm(f => ({ ...f, lecturer: e.target.value }))}
                                placeholder={course.lecturer}
                            />
                        </FormField>

                        <FormField label="Deskripsi / Petunjuk Pengerjaan">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={tugasForm.description}
                                onChange={e => setTugasForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Jelaskan format pengumpulan, instruksi, dan kriteria tugas..."
                            />
                        </FormField>

                        {/* Unggah Berkas Panduan / Soal Tugas */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 block">
                                Berkas Panduan / Soal Tugas (Opsional)
                            </label>

                            <div
                                onClick={() => !tugasUploading && tugasFileInputRef.current?.click()}
                                className="border border-dashed border-slate-300 hover:border-slate-400 rounded-xl p-3 text-center cursor-pointer bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-center gap-2"
                            >
                                <Icon name="upload" className="w-4 h-4 text-slate-500" />
                                <span className="text-xs font-semibold text-slate-700">
                                    {tugasUploading ? 'Mengunggah...' : 'Pilih Berkas Soal / Silabus dari Laptop (PDF, DOCX, ZIP)'}
                                </span>
                            </div>

                            {tugasUploading && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                        <span>Mengunggah dokumen...</span>
                                        <span>{tugasUploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                                        <div className="bg-blue-600 h-1" style={{ width: `${tugasUploadProgress}%` }} />
                                    </div>
                                </div>
                            )}

                            {tugasForm.file_url && !tugasUploading && (
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <Icon name="file-text" className="w-4 h-4 text-blue-600 shrink-0" />
                                        <span className="font-bold text-blue-900 truncate">
                                            {tugasForm.fileName || 'Berkas Lampiran Soal Siap Disimpan'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTugasForm(f => ({ ...f, file_url: null, fileName: '' }))}
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
                                onClick={() => setModalType(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={saveTugas}
                                disabled={tugasUploading}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium transition"
                            >
                                {modalType === 'tugas-add' ? 'Simpan Tugas ke Database' : 'Perbarui Tugas'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal: Form Pengumuman ── */}
            {(modalType === 'pengumuman-add' || modalType === 'pengumuman-edit') && (
                <Modal
                    title={modalType === 'pengumuman-add' ? `Tambah Pengumuman (${course.name})` : `Edit Pengumuman (${course.name})`}
                    onClose={() => setModalType(null)}
                >
                    <div className="space-y-4">
                        <FormField label="Judul Pengumuman" required>
                            <input
                                className={inputCls}
                                value={pengumumanForm.title}
                                onChange={e => setPengumumanForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Perubahan Jam Perkuliahan"
                            />
                        </FormField>

                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="Kategori">
                                <select
                                    className={selectCls}
                                    value={pengumumanForm.category}
                                    onChange={e => setPengumumanForm(f => ({ ...f, category: e.target.value }))}
                                >
                                    {ANNOUNCEMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Tanggal">
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={pengumumanForm.date}
                                    onChange={e => setPengumumanForm(f => ({ ...f, date: e.target.value }))}
                                />
                            </FormField>
                        </div>

                        <FormField label="Pengirim / Pembuat Informasi">
                            <input
                                className={inputCls}
                                value={pengumumanForm.author}
                                onChange={e => setPengumumanForm(f => ({ ...f, author: e.target.value }))}
                                placeholder={course.lecturer}
                            />
                        </FormField>

                        <div className="flex items-center gap-2 py-1">
                            <input
                                type="checkbox"
                                id="importantCheck"
                                checked={pengumumanForm.important}
                                onChange={e => setPengumumanForm(f => ({ ...f, important: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <label htmlFor="importantCheck" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                Tandai sebagai informasi penting (Highlight)
                            </label>
                        </div>

                        <FormField label="Isi Informasi / Pengumuman" required>
                            <textarea
                                rows={4}
                                className={inputCls}
                                value={pengumumanForm.content}
                                onChange={e => setPengumumanForm(f => ({ ...f, content: e.target.value }))}
                                placeholder="Tuliskan isi pengumuman atau instruksi perkuliahan secara rinci..."
                            />
                        </FormField>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setModalType(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={savePengumuman}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
                            >
                                {modalType === 'pengumuman-add' ? 'Terbitkan Pengumuman' : 'Perbarui Pengumuman'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Dialog Konfirmasi Hapus ── */}
            {confirmDelete && (
                <ConfirmDialog
                    message={`Item "${confirmDelete.title}" akan dihapus permanen dari sistem.`}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}

function EmptyState({ icon, message, action }) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl py-14 text-center px-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Icon name={icon} className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500">{message}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
