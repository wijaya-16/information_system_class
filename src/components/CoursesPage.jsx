import React, { useState } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';

const COLORS = [
    { value: 'bg-blue-500',    label: 'Biru' },
    { value: 'bg-cyan-500',    label: 'Cyan' },
    { value: 'bg-emerald-500', label: 'Hijau' },
    { value: 'bg-amber-500',   label: 'Kuning' },
    { value: 'bg-rose-500',    label: 'Merah' },
    { value: 'bg-purple-500',  label: 'Ungu' },
    { value: 'bg-violet-500',  label: 'Violet' },
    { value: 'bg-pink-500',    label: 'Pink' },
    { value: 'bg-orange-500',  label: 'Oranye' },
    { value: 'bg-slate-500',   label: 'Abu-abu' },
];

const CATEGORIES = ['Teori', 'Praktik', 'Teori & Praktikum'];

const emptyForm = { name: '', lecturer: '', credits: 3, category: 'Teori', color: 'bg-blue-500' };

const categoryColor = {
    'Teori':             'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Teori & Praktikum': 'bg-rose-50 text-rose-700 border-rose-200',
    'Praktik':           'bg-purple-50 text-purple-700 border-purple-200',
};

export default function CoursesPage({ courses, materials, assignments, announcements, navigateTo, isAdmin, adminHandlers }) {
    const [search,       setSearch]       = useState('');
    const [modal,        setModal]        = useState(null); // 'add' | 'edit'
    const [editTarget,   setEditTarget]   = useState(null);
    const [form,         setForm]         = useState(emptyForm);
    const [confirmDel,   setConfirmDel]   = useState(null); // course id

    // Hitung count secara dinamis dari data nyata
    const enriched = courses.map(c => ({
        ...c,
        materialCount:     materials.filter(m => m.course === c.name).length,
        assignmentCount:   assignments.filter(a => a.course === c.name).length,
        announcementCount: announcements.filter(a => a.course === c.name).length,
    }));

    const filtered = enriched.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.lecturer.toLowerCase().includes(search.toLowerCase())
    );

    const openAdd = () => {
        setForm(emptyForm);
        setEditTarget(null);
        setModal('add');
    };

    const openEdit = (e, course) => {
        e.stopPropagation();
        setForm({ name: course.name, lecturer: course.lecturer, credits: course.credits, category: course.category, color: course.color });
        setEditTarget(course);
        setModal('edit');
    };

    const handleSave = () => {
        if (!form.name.trim() || !form.lecturer.trim()) return;
        if (modal === 'add') {
            adminHandlers.course.add({ ...form, credits: Number(form.credits) });
        } else {
            adminHandlers.course.update(editTarget.id, { ...form, credits: Number(form.credits) });
        }
        setModal(null);
    };

    const handleDelete = () => {
        adminHandlers.course.delete(confirmDel);
        setConfirmDel(null);
    };

    const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Mata Kuliah</h1>
                    <p className="text-sm text-slate-500 mt-1">Semester 3 · {courses.length} Mata Kuliah</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari mata kuliah..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm w-full sm:w-52"
                        />
                    </div>
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shrink-0"
                        >
                            <Icon name="plus" className="w-4 h-4" /> Tambah
                        </button>
                    )}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-400 text-sm">Mata kuliah tidak ditemukan.</div>
                ) : (
                    filtered.map(course => (
                        <div
                            key={course.id}
                            onClick={() => navigateTo('matkul-detail', { id: course.id })}
                            className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition cursor-pointer overflow-hidden group"
                        >
                            <div className={`h-1.5 w-full ${course.color}`} />
                            <div className="p-5">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${categoryColor[course.category] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                        {course.category}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-mono text-slate-400">{course.credits} SKS</span>
                                        {isAdmin && (
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                                <button
                                                    onClick={e => openEdit(e, course)}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                                    title="Edit"
                                                >
                                                    <Icon name="pencil" className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setConfirmDel(course.id); }}
                                                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                    title="Hapus"
                                                >
                                                    <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 text-sm leading-snug">{course.name}</h3>
                                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                                    <Icon name="user" className="w-3 h-3" /> {course.lecturer}
                                </p>
                                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                                    {[['Materi', course.materialCount], ['Tugas', course.assignmentCount], ['Info', course.announcementCount]].map(([label, count]) => (
                                        <div key={label}>
                                            <p className="text-base font-bold text-slate-900">{count}</p>
                                            <p className="text-[10px] text-slate-500">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Tambah/Edit */}
            {modal && (
                <Modal title={modal === 'add' ? 'Tambah Mata Kuliah' : 'Edit Mata Kuliah'} onClose={() => setModal(null)}>
                    <div className="space-y-4">
                        <FormField label="Nama Mata Kuliah" required>
                            <input className={inputCls} value={form.name} onChange={e => f('name', e.target.value)} placeholder="cth: Manajemen Database" />
                        </FormField>
                        <FormField label="Dosen Pengampu" required>
                            <input className={inputCls} value={form.lecturer} onChange={e => f('lecturer', e.target.value)} placeholder="cth: Salman, S.ST., M.TI" />
                        </FormField>
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="SKS">
                                <input type="number" min={1} max={6} className={inputCls} value={form.credits} onChange={e => f('credits', e.target.value)} />
                            </FormField>
                            <FormField label="Kategori">
                                <select className={selectCls} value={form.category} onChange={e => f('category', e.target.value)}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <FormField label="Warna Kartu">
                            <div className="flex flex-wrap gap-2 pt-1">
                                {COLORS.map(c => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={() => f('color', c.value)}
                                        title={c.label}
                                        className={`w-7 h-7 rounded-full ${c.value} transition ring-offset-2 ${form.color === c.value ? 'ring-2 ring-slate-900' : 'hover:ring-2 hover:ring-slate-300'}`}
                                    />
                                ))}
                            </div>
                        </FormField>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setModal(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">Batal</button>
                            <button onClick={handleSave} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition">
                                {modal === 'add' ? 'Simpan' : 'Perbarui'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Konfirmasi Hapus */}
            {confirmDel && (
                <ConfirmDialog
                    message={`Mata kuliah "${courses.find(c => c.id === confirmDel)?.name}" beserta semua materi, tugas, dan pengumumannya akan dihapus permanen.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDel(null)}
                />
            )}
        </div>
    );
}
