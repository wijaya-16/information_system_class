import React, { useState } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';

const CATEGORIES = ['Akademik', 'Tugas', 'Jadwal', 'Umum'];

const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};

export default function AnnouncementsPage({
    announcements,
    courses,
    navigateTo,
    isAdmin,
    adminHandlers,
    showToast,
}) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Semua');
    const [courseFilter, setCourseFilter] = useState('Semua');

    // Admin state
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
    const [editItem, setEditItem] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const [form, setForm] = useState({
        title: '',
        category: 'Akademik',
        course: '',
        author: 'Administrator Kelas',
        date: getTodayDate(),
        important: false,
        content: '',
    });

    const openAdd = () => {
        setForm({
            title: '',
            category: 'Akademik',
            course: courses[0]?.name || '',
            author: 'Administrator Kelas',
            date: getTodayDate(),
            important: false,
            content: '',
        });
        setEditItem(null);
        setModalMode('add');
    };

    const openEdit = (item) => {
        setForm({
            title: item.title,
            category: item.category || 'Akademik',
            course: item.course || '',
            author: item.author || 'Administrator Kelas',
            date: item.date || getTodayDate(),
            important: !!item.important,
            content: item.content || '',
        });
        setEditItem(item);
        setModalMode('edit');
    };

    const handleSave = () => {
        if (!form.title.trim() || !form.content.trim()) return;
        if (modalMode === 'add') {
            adminHandlers.announcement.add(form);
        } else {
            adminHandlers.announcement.update(editItem.id, form);
        }
        setModalMode(null);
    };

    const handleDelete = () => {
        if (!confirmDeleteId) return;
        adminHandlers.announcement.delete(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    // Filter
    const filtered = announcements.filter(a => {
        const matchSearch =
            a.title.toLowerCase().includes(search.toLowerCase()) ||
            a.content.toLowerCase().includes(search.toLowerCase()) ||
            (a.author && a.author.toLowerCase().includes(search.toLowerCase()));

        const matchCat = categoryFilter === 'Semua' || a.category === categoryFilter;
        const matchCourse = courseFilter === 'Semua' || a.course === courseFilter;

        return matchSearch && matchCat && matchCourse;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-slate-900">Pengumuman & Informasi</h1>
                        {isAdmin && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                Admin
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Pemberitahuan resmi perkuliahan, jadwal kegiatan, dan informasi penting kelas
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari pengumuman..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm w-full sm:w-52"
                        />
                    </div>

                    {/* Filter Kategori */}
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
                    >
                        <option value="Semua">Semua Kategori</option>
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    {/* Filter Matkul */}
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

                    {/* Tombol Buat Admin */}
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shrink-0 shadow-sm"
                        >
                            <Icon name="plus" className="w-4 h-4" /> Buat Pengumuman
                        </button>
                    )}
                </div>
            </div>

            {/* List Pengumuman */}
            <div className="space-y-4">
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Icon name="bell" className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">Tidak ada pengumuman yang sesuai.</p>
                        {isAdmin && (
                            <button
                                onClick={openAdd}
                                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" /> Buat Pengumuman Pertama
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(item => {
                        const matchedCourse = courses.find(c => c.name === item.course);
                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-2xl border p-6 hover:shadow-md transition ${
                                    item.important
                                        ? 'border-amber-300 bg-gradient-to-r from-amber-50/40 via-white to-white'
                                        : 'border-slate-200'
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                        item.important ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        <Icon name={item.important ? 'alert-triangle' : 'megaphone'} className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                                                    {item.category}
                                                </span>

                                                {item.course && (
                                                    <button
                                                        onClick={() => matchedCourse && navigateTo('matkul-detail', { id: matchedCourse.id })}
                                                        className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                                                    >
                                                        {item.course}
                                                    </button>
                                                )}

                                                {item.important && (
                                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                                        <Icon name="alert-triangle" className="w-3 h-3 text-amber-700" /> Penting
                                                    </span>
                                                )}
                                            </div>

                                            {/* Admin Controls */}
                                            {isAdmin && (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                        title="Edit Pengumuman"
                                                    >
                                                        <Icon name="pencil" className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(item.id)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                        title="Hapus Pengumuman"
                                                    >
                                                        <Icon name="trash-2" className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                                            {item.title}
                                        </h3>

                                        <p className="text-sm text-slate-700 leading-relaxed mt-2 whitespace-pre-line">
                                            {item.content}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
                                            <span className="flex items-center gap-1">
                                                <Icon name="calendar" className="w-3.5 h-3.5" />
                                                {item.date}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1 font-medium text-slate-600">
                                                <Icon name="user" className="w-3.5 h-3.5" />
                                                {item.author}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal Tambah / Edit Pengumuman */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Buat Pengumuman Baru' : 'Edit Pengumuman'}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        <FormField label="Judul Pengumuman" required>
                            <input
                                className={inputCls}
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="cth: Pengumuman Perubahan Ruangan Kuliah"
                            />
                        </FormField>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField label="Kategori" required>
                                <select
                                    className={selectCls}
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField label="Terkait Mata Kuliah (Opsional)">
                                <select
                                    className={selectCls}
                                    value={form.course}
                                    onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                                >
                                    <option value="">Umum / Semua Mata Kuliah</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField label="Tanggal Terbit">
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={form.date}
                                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                />
                            </FormField>
                            <FormField label="Penulis / Pengirim">
                                <input
                                    className={inputCls}
                                    value={form.author}
                                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                                    placeholder="Administrator Kelas"
                                />
                            </FormField>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                            <input
                                type="checkbox"
                                id="importantCheckPage"
                                checked={form.important}
                                onChange={e => setForm(f => ({ ...f, important: e.target.checked }))}
                                className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <label htmlFor="importantCheckPage" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                Tandai sebagai informasi penting (Highlight warna emas)
                            </label>
                        </div>

                        <FormField label="Isi Informasi / Pengumuman" required>
                            <textarea
                                rows={5}
                                className={inputCls}
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                placeholder="Tuliskan isi pengumuman lengkap di sini..."
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
                                {modalMode === 'add' ? 'Terbitkan Pengumuman' : 'Perbarui Pengumuman'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Konfirmasi Hapus */}
            {confirmDeleteId && (
                <ConfirmDialog
                    message={`Pengumuman "${announcements.find(a => a.id === confirmDeleteId)?.title}" akan dihapus permanen.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteId(null)}
                />
            )}
        </div>
    );
}
