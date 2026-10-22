import React, { useState } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function AssignmentsPage({
    assignments,
    courses,
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

    // Member submission modal
    const [submitTarget, setSubmitTarget] = useState(null);
    const [submitForm, setSubmitForm] = useState({
        link: '',
        note: '',
    });

    const [form, setForm] = useState({
        title: '',
        course: courses[0]?.name || '',
        lecturer: courses[0]?.lecturer || '',
        deadline: getTodayDate(),
        status: 'Aktif',
        description: '',
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
        });
        setEditItem(task);
        setModalMode('edit');
    };

    const handleSave = () => {
        if (!form.title.trim() || !form.course.trim()) return;
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
        const mySub = submissions.find(s => s.assignmentId === task.id && s.nim === currentUser?.nim);
        setSubmitForm({
            link: mySub ? mySub.link : '',
            note: mySub ? mySub.note : '',
        });
        setSubmitTarget(task);
    };

    const handleDoSubmit = () => {
        if (!submitForm.link.trim()) {
            if (showToast) showToast('Silakan masukkan link tugas atau Google Drive', 'error');
            return;
        }
        if (onSubmitAssignment && submitTarget) {
            onSubmitAssignment(submitTarget.id, submitForm);
        }
        setSubmitTarget(null);
    };

    // Filter
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-slate-900">Tugas Kuliah</h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            {activeCount} Aktif
                        </span>
                        {isAdmin ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                Admin
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                                Mahasiswa
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola dan kumpulkan seluruh tugas perkuliahan Semester 3
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
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

                    {/* Tombol Tambah Admin */}
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shrink-0 shadow-sm"
                        >
                            <Icon name="plus" className="w-4 h-4" /> Buat Tugas
                        </button>
                    )}
                </div>
            </div>

            {/* List Tugas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-200 text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Icon name="clipboard-list" className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">Tidak ada tugas yang sesuai.</p>
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
                        const mySub = !isAdmin && currentUser ? submissions.find(s => s.assignmentId === task.id && s.nim === currentUser.nim) : null;

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
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-600'
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

                                    {/* Action Bar: Member Pengumpulan atau Admin Info */}
                                    <div className="flex items-center justify-between pt-1">
                                        {!isAdmin ? (
                                            /* Member: Status & Tombol Kumpul */
                                            mySub ? (
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                                        <Icon name="check-circle" className="w-3.5 h-3.5 text-emerald-600" />
                                                        Terkumpul ({mySub.submittedAt})
                                                    </span>
                                                    <button
                                                        onClick={() => openSubmitModal(task)}
                                                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 hover:underline"
                                                    >
                                                        Lihat / Edit Pengumpulan
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
                                            <button
                                                onClick={() => setViewSubmissionsTask(task)}
                                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 py-1"
                                            >
                                                <Icon name="users" className="w-3.5 h-3.5 text-slate-500" />
                                                Pengumpulan Mahasiswa ({taskSubs.length})
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Modal Member: Kumpulkan Tugas ── */}
            {submitTarget && (
                <Modal title={`Kumpulkan Tugas: ${submitTarget.title}`} onClose={() => setSubmitTarget(null)}>
                    <div className="space-y-4">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="text-slate-500">Mata Kuliah: <strong className="text-slate-900">{submitTarget.course}</strong></p>
                            <p className="text-slate-500">Batas Waktu: <strong className="text-rose-600">{submitTarget.deadline}</strong></p>
                            <p className="text-slate-500">Mahasiswa: <strong className="text-slate-900">{currentUser?.fullname} ({currentUser?.nim})</strong></p>
                        </div>

                        <FormField label="Tautan Berkas Tugas (Google Drive / GitHub / URL)" required>
                            <input
                                className={inputCls}
                                value={submitForm.link}
                                onChange={e => setSubmitForm(f => ({ ...f, link: e.target.value }))}
                                placeholder="https://drive.google.com/file/d/..."
                            />
                            <span className="text-[11px] text-slate-400 block mt-1">
                                Pastikan link Google Drive atau berkas dapat diakses (akses dibuka / public).
                            </span>
                        </FormField>

                        <FormField label="Catatan Tambahan (Opsional)">
                            <textarea
                                rows={3}
                                className={inputCls}
                                value={submitForm.note}
                                onChange={e => setSubmitForm(f => ({ ...f, note: e.target.value }))}
                                placeholder="Tuliskan catatan untuk dosen, ringkasan pengerjaan, atau link pendukung..."
                            />
                        </FormField>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setSubmitTarget(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDoSubmit}
                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition"
                            >
                                Kirim Pengumpulan
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Modal Admin: Lihat Pengumpulan Mahasiswa ── */}
            {viewSubmissionsTask && (
                <Modal
                    title={`Daftar Pengumpulan: ${viewSubmissionsTask.title}`}
                    onClose={() => setViewSubmissionsTask(null)}
                >
                    <div className="space-y-4">
                        {submissions.filter(s => s.assignmentId === viewSubmissionsTask.id).length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                Belum ada mahasiswa yang mengumpulkan tugas ini.
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {submissions.filter(s => s.assignmentId === viewSubmissionsTask.id).map(sub => (
                                    <div key={sub.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-slate-900">{sub.studentName} ({sub.nim})</span>
                                            <span className="text-[10px] text-slate-400">{sub.submittedAt}</span>
                                        </div>
                                        {sub.note && <p className="text-slate-600 text-[11px] leading-relaxed italic">"{sub.note}"</p>}
                                        <a
                                            href={sub.link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold text-[11px] mt-1"
                                        >
                                            <Icon name="external-link" className="w-3 h-3" /> Buka Tautan Berkas
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        <button
                            onClick={() => setViewSubmissionsTask(null)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold"
                        >
                            Tutup
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal Tambah / Edit Tugas */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Tambah Tugas Kuliah' : 'Edit Tugas Kuliah'}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        <FormField label="Judul Tugas" required>
                            <input
                                className={inputCls}
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Perancangan Arsitektur Database"
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
                                rows={4}
                                className={inputCls}
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                placeholder="Jelaskan detail tugas, format penyerahan, dan kriteria penilaian..."
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
                                {modalMode === 'add' ? 'Simpan Tugas' : 'Perbarui Tugas'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Konfirmasi Hapus */}
            {confirmDeleteId && (
                <ConfirmDialog
                    message={`Tugas "${assignments.find(a => a.id === confirmDeleteId)?.title}" akan dihapus permanen.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}
