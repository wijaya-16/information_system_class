import React, { useState } from 'react';
import Icon from './Icons';
import Modal, { ConfirmDialog, FormField, inputCls, selectCls } from './Modal';

export default function MembersPage({
    members,
    currentUser,
    isAdmin,
    adminHandlers,
    showToast,
    navigateTo,
}) {
    const [search, setSearch] = useState('');
    const [genderFilter, setGenderFilter] = useState('Semua');
    const [selectedMember, setSelectedMember] = useState(null);

    // Admin modal state
    const [modalMode, setModalMode] = useState(null); // 'add' | 'edit'
    const [editTarget, setEditTarget] = useState(null);
    const [confirmDeleteCode, setConfirmDeleteCode] = useState(null);

    const [form, setForm] = useState({
        code: '',
        fullname: '',
        gender: 'L',
    });

    // Generate next 3-digit code recommendation
    const getNextCode = () => {
        const codes = Object.keys(members).map(k => parseInt(k, 10)).filter(n => !isNaN(n));
        const max = codes.length > 0 ? Math.max(...codes) : 0;
        return String(max + 1).padStart(3, '0');
    };

    const openAdd = () => {
        setForm({
            code: getNextCode(),
            fullname: '',
            gender: 'L',
        });
        setEditTarget(null);
        setModalMode('add');
    };

    const openEdit = (e, code, member) => {
        e.stopPropagation();
        setForm({
            code: code,
            fullname: member.fullname,
            gender: member.gender || 'L',
        });
        setEditTarget({ code, ...member });
        setModalMode('edit');
    };

    const handleSave = () => {
        const trimmedCode = form.code.trim().padStart(3, '0');
        const trimmedName = form.fullname.trim();

        if (!trimmedCode || trimmedCode.length !== 3) {
            if (showToast) showToast('Kode NIM harus berupa 3 digit angka (contoh: 023)', 'error');
            return;
        }
        if (!trimmedName) {
            if (showToast) showToast('Nama lengkap mahasiswa wajib diisi', 'error');
            return;
        }

        if (modalMode === 'add') {
            if (members[trimmedCode]) {
                if (showToast) showToast(`NIM 25SI${trimmedCode} sudah terdaftar`, 'error');
                return;
            }
            adminHandlers.member.add(trimmedCode, {
                fullname: trimmedName,
                gender: form.gender,
            });
        } else if (modalMode === 'edit' && editTarget) {
            adminHandlers.member.update(editTarget.code, trimmedCode, {
                fullname: trimmedName,
                gender: form.gender,
            });
        }
        setModalMode(null);
    };

    const handleDelete = () => {
        if (!confirmDeleteCode) return;
        adminHandlers.member.delete(confirmDeleteCode);
        setConfirmDeleteCode(null);
    };

    // Convert object to array for filtering and rendering
    const memberList = Object.entries(members).map(([code, data]) => ({
        code,
        nim: `25SI${code}`,
        fullname: data.fullname,
        gender: data.gender || 'L',
    }));

    // Filter
    const filtered = memberList.filter(m => {
        const matchSearch =
            m.fullname.toLowerCase().includes(search.toLowerCase()) ||
            m.nim.toLowerCase().includes(search.toLowerCase()) ||
            m.code.includes(search);

        const matchGender = genderFilter === 'Semua' || m.gender === genderFilter;

        return matchSearch && matchGender;
    });

    const countL = memberList.filter(m => m.gender === 'L').length;
    const countP = memberList.filter(m => m.gender === 'P').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-extrabold text-slate-900">Direktori Mahasiswa Kelas</h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                            {memberList.length} Mahasiswa
                        </span>
                        {isAdmin && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                Admin
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        Daftar seluruh anggota kelas Sistem Informasi Semester 3 · {countL} Laki-laki · {countP} Perempuan
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1 sm:flex-initial">
                        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau NIM..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm w-full sm:w-56"
                        />
                    </div>

                    {/* Filter Gender */}
                    <select
                        value={genderFilter}
                        onChange={e => setGenderFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm bg-white"
                    >
                        <option value="Semua">Semua Gender</option>
                        <option value="L">Laki-laki ({countL})</option>
                        <option value="P">Perempuan ({countP})</option>
                    </select>

                    {/* Tombol Tambah Admin */}
                    {isAdmin && (
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition shrink-0 shadow-sm"
                        >
                            <Icon name="user-plus" className="w-4 h-4" /> Tambah Mahasiswa
                        </button>
                    )}
                </div>
            </div>

            {/* Grid Mahasiswa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-slate-200 text-center py-16 px-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                            <Icon name="users" className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500">Mahasiswa tidak ditemukan.</p>
                        {isAdmin && (
                            <button
                                onClick={openAdd}
                                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                            >
                                <Icon name="plus" className="w-3.5 h-3.5" /> Tambah Mahasiswa Baru
                            </button>
                        )}
                    </div>
                ) : (
                    filtered.map(member => {
                        const isSelf = currentUser?.nim === member.nim;
                        return (
                            <div
                                key={member.code}
                                onClick={() => setSelectedMember(member)}
                                className={`bg-white rounded-2xl border p-5 hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative ${
                                    isSelf ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                            {member.nim}
                                        </span>

                                        <div className="flex items-center gap-1">
                                            {isSelf && (
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                                                    Anda
                                                </span>
                                            )}

                                            {isAdmin && (
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                                    <button
                                                        onClick={(e) => openEdit(e, member.code, member)}
                                                        className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                                        title="Edit Mahasiswa"
                                                    >
                                                        <Icon name="pencil" className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setConfirmDeleteCode(member.code);
                                                        }}
                                                        className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                                        title="Hapus Mahasiswa"
                                                    >
                                                        <Icon name="trash-2" className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Avatar & Nama */}
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${
                                            member.gender === 'P'
                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}>
                                            {member.fullname.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition truncate leading-snug">
                                                {member.fullname}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                {member.gender === 'P' ? 'Mahasiswi' : 'Mahasiswa'} · SI #{member.code}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                                    </span>
                                    <span className="text-slate-400 group-hover:text-slate-700 transition flex items-center gap-0.5">
                                        Detail <Icon name="chevron-right" className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Modal: Detail Mahasiswa ── */}
            {selectedMember && (
                <Modal title="Informasi Mahasiswa" onClose={() => setSelectedMember(null)}>
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md ${
                                selectedMember.gender === 'P'
                                    ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white'
                                    : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                            }`}>
                                {selectedMember.fullname.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedMember.fullname}</h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">NIM: {selectedMember.nim}</p>
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                                    {selectedMember.gender === 'P' ? 'Perempuan' : 'Laki-laki'} · Kode Unik #{selectedMember.code}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Program Studi</span>
                                <span className="font-bold text-slate-800">Sistem Informasi</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Jenjang / Semester</span>
                                <span className="font-bold text-slate-800">S1 · Semester 3</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Tahun Angkatan</span>
                                <span className="font-bold text-slate-800">2025/2026</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <span className="text-slate-400 block text-[10px]">Status Perkuliahan</span>
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Aktif
                                </span>
                            </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                                <Icon name="key" className="w-3.5 h-3.5 text-blue-600" />
                                Informasi Kredensial Login
                            </p>
                            <p className="text-[11px] text-blue-800">
                                Username: <strong className="font-mono">{selectedMember.nim}</strong> · Password: <strong className="font-mono">{selectedMember.nim}</strong>
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedMember(null)}
                            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                        >
                            Tutup
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Modal: Tambah / Edit Mahasiswa (Admin) ── */}
            {modalMode && (
                <Modal
                    title={modalMode === 'add' ? 'Tambah Mahasiswa Baru' : 'Edit Data Mahasiswa'}
                    onClose={() => setModalMode(null)}
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <FormField label="3 Digit Kode NIM" required>
                                <div className="flex items-center">
                                    <span className="px-3 py-2.5 rounded-l-xl bg-slate-100 border border-r-0 border-slate-200 text-xs font-mono font-bold text-slate-600">
                                        25SI
                                    </span>
                                    <input
                                        className={`${inputCls} rounded-l-none font-mono font-bold`}
                                        maxLength={3}
                                        value={form.code}
                                        onChange={e => setForm(f => ({ ...f, code: e.target.value.replace(/\D/g, '') }))}
                                        placeholder="023"
                                    />
                                </div>
                            </FormField>

                            <FormField label="Jenis Kelamin">
                                <select
                                    className={selectCls}
                                    value={form.gender}
                                    onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                                >
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </FormField>
                        </div>

                        <FormField label="Nama Lengkap Mahasiswa" required>
                            <input
                                className={inputCls}
                                value={form.fullname}
                                onChange={e => setForm(f => ({ ...f, fullname: e.target.value }))}
                                placeholder="cth: Budi Santoso"
                            />
                        </FormField>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">Akun Login Otomatis Dibuat:</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                                Username & Password: <strong>25SI{form.code.padStart(3, '0')}</strong>
                            </p>
                        </div>

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
                                {modalMode === 'add' ? 'Simpan Mahasiswa' : 'Perbarui Data'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* ── Dialog Konfirmasi Hapus ── */}
            {confirmDeleteCode && (
                <ConfirmDialog
                    message={`Mahasiswa "${members[confirmDeleteCode]?.fullname}" (25SI${confirmDeleteCode}) akan dihapus dari daftar anggota kelas.`}
                    onConfirm={handleDelete}
                    onCancel={() => setConfirmDeleteCode(null)}
                />
            )}
        </div>
    );
}
